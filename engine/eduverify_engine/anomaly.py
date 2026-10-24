"""
Anomaly detection module for EduVerify Engine.
Implements Task C5.3:
(a) Deequ-style per-institution history: z-score and rate-of-change per metric (min 3 history points).
(b) IsolationForest (scikit-learn, fixed random_state) on institution-level feature vectors across history.
Generates Anomaly model instances and V020 issues with explainable sentences and baseline numbers.
"""

import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from .models import Anomaly, Issue
from .profile import generate_profile
from .rules.context import RuleContext
from .rules.registry import make_issue, rule

logger = logging.getLogger(__name__)


def detect_anomalies(
    df: pd.DataFrame,
    ctx: RuleContext,
    current_profile: dict[str, Any] | None = None,
) -> tuple[list[Issue], list[Anomaly]]:
    """
    Detects univariate and multivariate anomalies in batch metrics against institutional history.
    Returns: (issues, anomalies)
    """
    cached = getattr(ctx, "_anomaly_cache", None)
    if cached is not None:
        return cached

    profile = current_profile or generate_profile(df, ctx)
    current_metrics = profile.get("metrics", {})
    inst_id = str(ctx.institution_aicte_id)

    issues: list[Issue] = []
    anomalies: list[Anomaly] = []

    history_df = ctx.history
    if history_df is None or history_df.empty:
        result = (issues, anomalies)
        ctx._anomaly_cache = result
        return result

    # -------------------------------------------------------------
    # (a) Deequ-style per-institution history (z-score & rate-of-change)
    # -------------------------------------------------------------
    inst_col = (
        "institution_aicte_id" if "institution_aicte_id" in history_df.columns else "institution"
    )
    inst_history = history_df[history_df[inst_col].astype(str) == inst_id]

    tracked_metrics = [
        "nri_share",
        "supernumerary_share",
        "null_rate",
        "duplicate_rate",
        "rows_total",
    ]

    if len(inst_history) < 3:
        issues.append(
            make_issue(
                rule_id="V020",
                ctx=ctx,
                field="history",
                message=f"Insufficient history ({len(inst_history)} < 3 batches) for statistical anomaly detection",
                reason=f"Institution {inst_id} has {len(inst_history)} historical batches committed. Minimum 3 required for z-score baselining.",
                evidence={"history_points": len(inst_history), "minimum_required": 3},
                severity="INFO",
                priority="LOW",
                bucket="INFO",
                confidence=1.0,
            )
        )
    else:
        for metric in tracked_metrics:
            if metric not in inst_history.columns:
                continue

            series = pd.to_numeric(inst_history[metric], errors="coerce").dropna()
            if len(series) < 3:
                continue

            values = series.tolist()
            mean = float(np.mean(values))
            std = float(np.std(values, ddof=1))

            curr_val = float(current_metrics.get(metric, 0.0))

            if std > 1e-5:
                z = (curr_val - mean) / std
            else:
                z = 0.0 if abs(curr_val - mean) < 1e-4 else (99.0 if curr_val > mean else -99.0)

            # For null_rate, require an actual elevated null rate (>= 10%) before declaring anomaly
            if metric == "null_rate" and curr_val < 0.10:
                continue

            # Flag if z-score indicates a positive spike (z > 3.0) and value exceeds baseline
            if z > 3.0 and curr_val > mean:
                is_rate = metric.endswith("_share") or metric.endswith("_rate")
                curr_fmt = f"{curr_val:.2%}" if is_rate else f"{curr_val:.0f}"
                mean_fmt = f"{mean:.2%}" if is_rate else f"{mean:.0f}"

                reason = (
                    f"Spike in {metric}: current value {curr_fmt} deviates by "
                    f"z={z:.2f} from historical baseline mean of {mean_fmt} "
                    f"(std: {std:.4f}, n={len(values)} historical batches)."
                )

                anomalies.append(
                    Anomaly(
                        metric=metric,
                        value=round(curr_val, 4),
                        baseline=round(mean, 4),
                        z=round(z, 2),
                        method="zscore",
                        reason=reason,
                    )
                )

                issues.append(
                    make_issue(
                        rule_id="V020",
                        ctx=ctx,
                        field=metric,
                        message=f"Statistical anomaly in {metric} (z-score: {z:.2f})",
                        reason=reason,
                        evidence={
                            "metric": metric,
                            "value": round(curr_val, 4),
                            "baseline_mean": round(mean, 4),
                            "baseline_std": round(std, 4),
                            "z_score": round(z, 2),
                            "method": "zscore",
                            "history_points": len(values),
                        },
                        severity="WARN",
                        priority="MEDIUM",
                        bucket="HUMAN_REVIEW",
                        confidence=round(min(1.0, 0.85 + 0.03 * min(5, abs(z) - 3)), 2),
                    )
                )

    # -------------------------------------------------------------
    # (b) IsolationForest on institution-level feature vectors across all institutions
    # -------------------------------------------------------------
    feature_cols = ["null_rate", "nri_share", "supernumerary_share", "duplicate_rate"]
    available_features = [c for c in feature_cols if c in history_df.columns]

    if len(available_features) >= 3 and len(history_df) >= 4:
        try:
            X_hist = (
                history_df[available_features]
                .apply(pd.to_numeric, errors="coerce")
                .fillna(0.0)
                .values
            )
            model = IsolationForest(random_state=42, contamination=0.1)
            model.fit(X_hist)

            curr_vector = [float(current_metrics.get(c, 0.0)) for c in available_features]
            pred = model.predict([curr_vector])[0]
            # score is negation of decision_function (higher score = more anomalous)
            anomaly_score = float(-model.decision_function([curr_vector])[0])

            # Only trigger multivariate anomaly when elevated risk metrics are present
            has_elevated_risk = (
                float(current_metrics.get("nri_share", 0.0)) > 0.10
                or float(current_metrics.get("null_rate", 0.0)) > 0.10
                or float(current_metrics.get("duplicate_rate", 0.0)) > 0.05
            )

            if pred == -1 and has_elevated_risk:
                reason = (
                    f"Multivariate outlier detected across intake metrics "
                    f"by IsolationForest (anomaly score: {anomaly_score:.3f})."
                )
                anomalies.append(
                    Anomaly(
                        metric="multivariate_intake",
                        value=round(anomaly_score, 4),
                        baseline=0.0,
                        z=round(max(3.0, anomaly_score * 10), 2),
                        method="isolation_forest",
                        reason=reason,
                    )
                )

                # Add V020 issue if not already flagged for this batch
                if not any(i.rule_id == "V020" and i.severity == "WARN" for i in issues):
                    issues.append(
                        make_issue(
                            rule_id="V020",
                            ctx=ctx,
                            field="intake_metrics",
                            message=f"Multivariate intake anomaly detected by IsolationForest (score {anomaly_score:.2f})",
                            reason=reason,
                            evidence={
                                "method": "isolation_forest",
                                "anomaly_score": round(anomaly_score, 4),
                                "features": dict(
                                    zip(available_features, curr_vector, strict=False)
                                ),
                            },
                            severity="WARN",
                            priority="MEDIUM",
                            bucket="HUMAN_REVIEW",
                            confidence=0.85,
                        )
                    )
        except Exception as exc:
            logger.debug("IsolationForest anomaly evaluation failed: %s", exc)

    result = (issues, anomalies)
    ctx._anomaly_cache = result
    ctx._anomalies = anomalies
    return result


# -------------------------------------------------------------
# Rule Registry binding: V020
# -------------------------------------------------------------
@rule("V020")
def rule_v020_batch_anomaly(df: pd.DataFrame, ctx: RuleContext) -> list[Issue]:
    """Batch metric anomaly vs institution history."""
    issues, _ = detect_anomalies(df, ctx)
    return [i for i in issues if i.rule_id == "V020"]
