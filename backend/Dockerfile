FROM python:3.11-slim

WORKDIR /app

# System deps some scientific/ML packages need to build wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data and cache directories exist and are writable by non-root user (HF Spaces runs as user 1000)
RUN mkdir -p /app/data /tmp && chmod -R 777 /app/data /tmp

# Hugging Face Spaces (Docker SDK) requires the app to listen on port 7860
ENV MODEL_DIR=/tmp
EXPOSE 7860

CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "7860"]
