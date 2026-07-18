FROM python:3.11-slim

# Install system dependencies needed for OpenCV, PaddlePaddle, and PaddleOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache the PaddleOCR Arabic/multilingual models to avoid latency on the first request
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='ar', show_log=False)"

COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port 8001
EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
