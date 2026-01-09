FROM python:3.11-slim

WORKDIR /app

COPY server/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY server/app.py /app/app.py
COPY dist /app/dist

ENV PORT=5003
EXPOSE 5003

CMD ["gunicorn", "-b", "0.0.0.0:5003", "app:app"]
