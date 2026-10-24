FROM python:3.11-slim

WORKDIR /workspace

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHON_VERSION=3.11.9 \
    PORT=8000

# Install build and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libjpeg-dev \
    libopenjp2-7-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and engine package
COPY backend/requirements.txt /workspace/backend/requirements.txt
COPY engine /workspace/engine

# Install python dependencies and engine package
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r /workspace/backend/requirements.txt \
    && pip install --no-cache-dir ./engine

# Copy backend code and contracts
COPY backend /workspace/backend
COPY contracts /workspace/contracts

WORKDIR /workspace/backend

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
