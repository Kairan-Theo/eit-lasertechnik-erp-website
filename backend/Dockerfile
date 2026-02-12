FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for Pillow/reportlab (images/PDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libtiff5-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps (no requirements.txt, install core libs directly)
RUN pip install --no-cache-dir \
    "Django>=4.2,<5.0" \
    djangorestframework \
    django-cors-headers \
    requests \
    reportlab \
    Pillow \
    psycopg2-binary

# Copy backend source
COPY . .

EXPOSE 8001

# Default command (overridden by docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]
