FROM python:3.9

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

CMD ["gunicorn", "-k", "gevent", "-w", "1", "-b", ":5000", "app:app"]
