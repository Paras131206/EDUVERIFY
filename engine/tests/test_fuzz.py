"""
Fuzz testing for validate_batch with random garbage CSV/XLSX.
Verifies invariant:
validate_batch ALWAYS returns a valid BatchReport instance and NEVER crashes on arbitrary garbage.
"""

from __future__ import annotations

import io
import os
import secrets
import zipfile

from eduverify_engine.models import BatchReport
from eduverify_engine.validate import validate_batch


def test_fuzz_completely_random_binary_bytes():
    """Fuzz with completely random bytes of varying lengths."""
    for length in [0, 1, 10, 64, 512, 4096, 65536]:
        garbage = secrets.token_bytes(length)
        report = validate_batch(garbage)
        assert isinstance(report, BatchReport)
        assert report.batch_id != ""
        assert isinstance(report.issues, list)
        assert isinstance(report.quality_score, float)


def test_fuzz_corrupted_zip_and_pseudo_xlsx():
    """Fuzz with corrupted zip archives and pseudo-XLSX structures."""
    # 1. Truncated PK header
    report = validate_batch(b"PK\x03\x04")
    assert isinstance(report, BatchReport)

    # 2. PK header with random noise
    report = validate_batch(b"PK\x03\x04" + os.urandom(256))
    assert isinstance(report, BatchReport)

    # 3. Valid zip archive containing non-excel garbage
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("random.txt", "this is not an excel workbook")
    report = validate_batch(buf.getvalue())
    assert isinstance(report, BatchReport)

    # 4. Valid zip archive with corrupt [Content_Types].xml
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", b"\x00\xff\xfe\x00<not-xml>")
    report = validate_batch(buf.getvalue())
    assert isinstance(report, BatchReport)


def test_fuzz_malformed_csv_structures():
    """Fuzz with pathological CSV corner cases."""
    cases = [
        b"",  # Empty
        b" \t \r\n \n",  # Whitespace only
        b"\x00" * 100,  # Null bytes
        b"\xff\xfe\x00\x00" + b"invalid utf16",  # Bad BOM
        b"," * 2000,  # Excessive commas
        b"\n" * 500,  # Excessive newlines
        b'"unclosed quote,apaar_id,name\n123,456',  # Unclosed quotes
        b'"\r\n"\r\n"\r\n',  # Quote permutations
        b"header1,header2\n" + (b"val1,val2,extra1,extra2\n" * 20),  # Row width mismatch
        b"header1,header2\n" + (b"val1\n" * 20),  # Truncated rows
        b"\xef\xbb\xbf",  # Standalone UTF-8 BOM
        b"\xef\xbb\xbfcol1,col2\n",  # BOM followed by empty data
    ]

    for c in cases:
        report = validate_batch(c)
        assert isinstance(report, BatchReport)
        assert (
            report.rows_total == len(report.metrics.get("completeness", {}))
            or report.rows_total >= 0
        )
        assert isinstance(report.quality_score, (int, float))


def test_fuzz_random_mutations():
    """Fuzz with 50 randomized mutations of header and data fragments."""
    chars = [",", "\n", "\r", "\t", '"', "'", "\\", "\x00", "\xff", "a", "1", " "]

    for _ in range(50):
        length = 1 + secrets.randbelow(3000)
        sample_bytes = "".join(secrets.choice(chars) for _ in range(length)).encode("latin-1")
        report = validate_batch(sample_bytes)
        assert isinstance(report, BatchReport)
        assert report.engine_version != ""
        assert report.rule_catalog_version != ""
