import os
import psycopg2

env_user = os.getenv('POSTGRES_USER')
env_password = os.getenv('POSTGRES_PASSWORD')

def executeDBQuery(query):
    conn = psycopg2.connect(
        user=env_user, 
        password=env_password, 
        host="felixmielcarek-bigbrotherdb"
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(query)
    cur.close()
    conn.close()

create_db_query = '''
CREATE DATABASE bigbrother;
'''

create_schema_query = '''
CREATE SCHEMA IF NOT EXISTS public
    AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public
    IS 'standard public schema';

GRANT USAGE ON SCHEMA public TO PUBLIC;

GRANT ALL ON SCHEMA public TO pg_database_owner;
'''

create_table_query = '''
CREATE TABLE IF NOT EXISTS public.users
(
    spotifyid character varying COLLATE pg_catalog."default" NOT NULL,
    accesstoken character varying COLLATE pg_catalog."default",
    refreshtoken character varying COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (spotifyid)
)

TABLESPACE pg_default;
'''

executeDBQuery(create_db_query)
executeDBQuery(create_schema_query)
executeDBQuery(create_table_query)