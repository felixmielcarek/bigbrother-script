FROM postgres:latest

COPY database/init_db.py /docker-entrypoint-initdb.d/

RUN apt-get update && apt-get install -y python3 python3-pip && \
    pip3 install psycopg2-binary

EXPOSE 5432
