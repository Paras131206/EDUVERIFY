# EduVerify AI / Data Engine (`eduverify_engine`)

Team C's pure Python package for data parsing, smart column mapping, explainable validation (rules V001–V035), duplicate detection, schema drift, and data-quality reporting.

## Installation

From the repository root:
```bash
pip install -e "./engine[dev]"
```

Or using `uv`:
```bash
uv pip install -e "./engine[dev]"
```

## Running Tests

```bash
pytest engine/tests
```

Linting and formatting:
```bash
ruff check engine contracts
ruff format --check engine
```

## Developer Harness

To run the local developer API harness on port 8100:
```bash
uvicorn devserver:app --app-dir engine --port 8100 --reload
```

Endpoints:
- `GET http://localhost:8100/healthz` — Service healthcheck
- `GET http://localhost:8100/catalog` — Lists all V001–V035 validation rules
- `POST http://localhost:8100/validate` — Validate uploaded CSV/XLSX file
- Interactive Swagger docs: `http://localhost:8100/docs`
