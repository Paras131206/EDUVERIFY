"""
JSON Logging configuration with PII filter for EduVerify backend.
Complies with agents.md §12 and prompt B0.
"""

import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

from eduverify_engine.masking import mask_apaar, mask_email, mask_mobile

# Patterns for automated PII detection in log messages
APAAR_PATTERN = re.compile(r"\b\d{12}\b")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
MOBILE_PATTERN = re.compile(r"\b(?:\+91|91|0)?[6-9]\d{9}\b")


class PIIFilter(logging.Filter):
    """
    Log filter that intercepts log records and masks PII (APAAR, email, mobile)
    before records are rendered or emitted.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self._sanitize_text(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self._sanitize_obj(v) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self._sanitize_obj(v) for v in record.args)
        return True

    def _sanitize_text(self, text: str) -> str:
        text = APAAR_PATTERN.sub(lambda m: mask_apaar(m.group(0)), text)
        text = EMAIL_PATTERN.sub(lambda m: mask_email(m.group(0)), text)
        text = MOBILE_PATTERN.sub(lambda m: mask_mobile(m.group(0)), text)
        return text

    def _sanitize_obj(self, obj: Any) -> Any:
        if isinstance(obj, str):
            return self._sanitize_text(obj)
        if isinstance(obj, dict):
            return {k: self._sanitize_obj(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._sanitize_obj(item) for item in obj]
        return obj


class JSONFormatter(logging.Formatter):
    """
    Standard JSON structured logging formatter for cloud observability (Render/Datadog/ELK).
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include request_id if available on the record
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logging(level: str = "INFO") -> None:
    """
    Configures the root logger with the PII filter and JSON formatter.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplicates
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(JSONFormatter())
    stream_handler.addFilter(PIIFilter())
    root_logger.addHandler(stream_handler)
