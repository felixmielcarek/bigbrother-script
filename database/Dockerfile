FROM postgres:latest

ENV POSTGRES_DB=big-brother
ENV POSTGRES_PASSWORD=postgres

COPY init_db.py /docker-entrypoint-initdb.d/

RUN apt-get update && \
    apt-get install -y python3 && \
    apt install python3-psycopg2

EXPOSE 5432