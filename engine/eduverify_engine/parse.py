"""
File parser for EduVerify Engine.
Reads CSV and XLSX into DataFrame of strings ONLY.
Never crashes on bad rows, detects encoding, guards file size.
"""

import io
from pathlib import Path

import charset_normalizer
import openpyxl
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field

from .models import Issue

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_ROWS = 100_000


class ParsedFile(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    df: pd.DataFrame
    original_headers: list[str]
    detected_encoding: str = "utf-8"
    cell_types: dict[str, str] = Field(default_factory=dict)
    parse_issues: list[Issue] = Field(default_factory=list)
    rows_total: int = 0


def detect_file_encoding(data: bytes) -> str:
    """Detects encoding using charset-normalizer with fallback to utf-8."""
    if not data:
        return "utf-8"
    # Check BOM
    if data.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    result = charset_normalizer.from_bytes(data).best()
    if result and result.encoding:
        return result.encoding
    return "utf-8"


def normalize_header(header: str) -> str:
    """Normalizes header: stripped, trimmed."""
    if header is None:
        return ""
    return str(header).strip()


def parse_csv(data: bytes, encoding: str) -> tuple[pd.DataFrame, list[str], list[Issue]]:
    """Reads CSV into a DataFrame where all values are strings."""
    issues: list[Issue] = []
    text = data.decode(encoding, errors="replace")

    # Read using pandas with dtype=str, keep_default_na=False
    try:
        df = pd.read_csv(
            io.StringIO(text),
            dtype=str,
            keep_default_na=False,
            na_filter=False,
            on_bad_lines="warn",
        )
    except Exception as e:
        # Fallback line-by-line reading to isolate bad rows
        lines = text.splitlines()
        if not lines:
            return pd.DataFrame(), [], issues
        header_line = lines[0]
        headers = [h.strip() for h in header_line.split(",")]
        rows = []
        for row_idx, line in enumerate(lines[1:], start=2):
            parts = line.split(",")
            if len(parts) != len(headers):
                reason_msg = (
                    f"Row {row_idx} column mismatch: expected {len(headers)}, got {len(parts)}"
                )
                issues.append(
                    Issue(
                        issue_id=f"parse-row-{row_idx}",
                        row=row_idx,
                        field="row",
                        rule_id="V006",
                        severity="ERROR",
                        priority="LOW",
                        bucket="AUTO_FLAG",
                        message=f"Corrupt or malformed CSV row structure: {e}",
                        reason=reason_msg,
                        evidence={"row_content": line[:100]},
                    )
                )
            else:
                rows.append([p.strip() for p in parts])
        df = pd.DataFrame(rows, columns=headers, dtype=str)

    headers = [str(col).strip() for col in df.columns]
    # Trim all string values in DataFrame
    for col in df.columns:
        df[col] = df[col].astype(str).str.strip()

    return df, headers, issues


def parse_xlsx(data: bytes) -> tuple[pd.DataFrame, list[str], dict[str, str], list[Issue]]:
    """Reads XLSX using openpyxl in data_only mode, preserving raw string representations."""
    issues: list[Issue] = []
    cell_types: dict[str, str] = {}
    wb = openpyxl.load_workbook(io.BytesIO(data), data_only=True, read_only=False)
    sheet = wb.active
    if not sheet:
        return pd.DataFrame(), [], cell_types, issues

    rows_iter = sheet.iter_rows(values_only=False)
    try:
        header_row = next(rows_iter)
    except StopIteration:
        return pd.DataFrame(), [], cell_types, issues

    headers = [
        str(cell.value).strip() if cell.value is not None else f"col_{idx}"
        for idx, cell in enumerate(header_row)
    ]

    # Map column cell types based on first data rows
    data_rows = []
    for _row_idx, row in enumerate(rows_iter, start=2):
        row_vals = []
        for col_idx, cell in enumerate(row):
            col_name = headers[col_idx] if col_idx < len(headers) else f"col_{col_idx}"
            if cell.data_type and col_name not in cell_types:
                cell_types[col_name] = cell.data_type

            val = cell.value
            if val is None:
                str_val = ""
            elif isinstance(val, float) and val.is_integer():
                str_val = str(int(val))
            else:
                str_val = str(val).strip()
            row_vals.append(str_val)
        data_rows.append(row_vals)

    df = pd.DataFrame(data_rows, columns=headers, dtype=str)
    return df, headers, cell_types, issues


def parse_file(file_input: str | Path | bytes | io.BytesIO | pd.DataFrame) -> ParsedFile:
    """
    Universal file reader for CSV and Excel files.
    Enforces size guards and returns ParsedFile with string-only DataFrame.
    """
    if isinstance(file_input, pd.DataFrame):
        df = file_input.astype(str)
        return ParsedFile(
            df=df,
            original_headers=[str(c) for c in df.columns],
            detected_encoding="utf-8",
            rows_total=len(df),
        )

    # Resolve bytes
    if isinstance(file_input, (str, Path)):
        p = Path(file_input)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {p}")
        file_bytes = p.read_bytes()
        filename = p.name.lower()
    elif isinstance(file_input, io.BytesIO):
        file_bytes = file_input.getvalue()
        filename = "upload.csv"
    elif isinstance(file_input, bytes):
        file_bytes = file_input
        filename = "upload.csv"
    else:
        raise ValueError(f"Unsupported file input type: {type(file_input)}")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File size exceeds 10 MB limit ({len(file_bytes)} bytes > {MAX_FILE_SIZE_BYTES} bytes)"
        )

    # Detect format: check zip magic for xlsx (PK\x03\x04)
    is_xlsx = filename.endswith(".xlsx") or file_bytes.startswith(b"PK\x03\x04")

    if is_xlsx:
        df, headers, cell_types, issues = parse_xlsx(file_bytes)
        encoding = "binary"
    else:
        encoding = detect_file_encoding(file_bytes)
        df, headers, issues = parse_csv(file_bytes, encoding)
        cell_types = {h: "string" for h in headers}

    if len(df) > MAX_ROWS:
        raise ValueError(f"Row count exceeds 100,000 limit ({len(df)} rows)")

    return ParsedFile(
        df=df,
        original_headers=headers,
        detected_encoding=encoding,
        cell_types=cell_types,
        parse_issues=issues,
        rows_total=len(df),
    )
