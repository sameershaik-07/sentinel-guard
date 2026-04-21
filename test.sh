#!/bin/bash

# Start FastAPI Backend in background
cd /home/sameer/Desktop/hacky/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

# Test the actual `/api/scan` endpoint
echo "Testing scan endpoint against example.com..."
curl -X POST http://localhost:8000/api/scan \
     -H "Content-Type: application/json" \
     -d '{"target_url": "https://example.com"}' \
     -s
     
echo -e "\nKilling backend..."
kill $BACKEND_PID
