WeasyPrint native dependency notes

Purpose
-------
This project uses WeasyPrint to convert rich HTML/CSS reports into PDFs. WeasyPrint relies on several native system libraries (C libraries) which are not Python packages and must be installed on the host or container.

Debian / Ubuntu (recommended)
-----------------------------
Install system libraries and then Python requirements:

```bash
sudo apt update
sudo apt install -y libcairo2 libpango-1.0-0 libgdk-pixbuf2.0-0 libffi-dev libpangocairo-1.0-0 libfreetype6 libjpeg-dev libxml2 libxslt1.1
# Then from the backend directory:
cd backend
python3 -m pip install -r requirements.txt
```

Alpine Linux (Docker)
---------------------
Alpine has different package names and musl libc. Use the following in an Alpine-based image:

```Dockerfile
RUN apk add --no-cache \
    build-base \
    cairo-dev pango-dev gdk-pixbuf-dev libffi-dev libxml2-dev libxslt-dev jpeg-dev freetype-dev
RUN pip install --no-cache-dir -r requirements.txt
```

Notes & Troubleshooting
-----------------------
- If WeasyPrint fails at runtime the application will fall back to a ReportLab-based PDF renderer (`generate_fallback_report`) which produces a simpler, text-only PDF. The backend prints a log message when this happens:

```
WeasyPrint unavailable, using fallback PDF renderer: <error message>
```

- Common missing-ingredient errors reference `cairo`, `pango` or `libffi`.
- On some systems you may also need `libpangocairo-1.0-0`, `libfreetype6`, or `libgdk-pixbuf2.0-0`.
- For reliability in production, build a small Docker image that includes these system packages so the environment is consistent across deploys.

Recommended Docker base image (Debian-based)
--------------------------------------------
Start from `python:3.11-slim` or similar and install the packages above. Example snippet:

```Dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 libpango-1.0-0 libgdk-pixbuf2.0-0 libffi-dev libfreetype6 libjpeg-dev libxml2 libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
```

If you want, I can add a small `Dockerfile` for the backend that includes these dependencies.