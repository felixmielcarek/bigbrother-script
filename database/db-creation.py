import psycopg2
import os

# Establish connection to the PostgreSQL database
conn = psycopg2.connect(
    dbname=os.getenv['POSTGRES_DATABASE'],
    user=os.getenv['POSTGRES_USER'],
    password=os.getenv['POSTGRES_PASSWORD'],
    host="localhost"
)

# Create a cursor object to execute SQL queries
cur = conn.cursor()

create_db_query = '''
-- Database: bigbrother

-- DROP DATABASE IF EXISTS bigbrother;

CREATE DATABASE bigbrother
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

COMMENT ON DATABASE bigbrother
    IS 'Database for Big Brother tool for Spotify.';
'''

create_schema_query = '''
-- SCHEMA: public

-- DROP SCHEMA IF EXISTS public ;

CREATE SCHEMA IF NOT EXISTS public
    AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public
    IS 'standard public schema';

GRANT USAGE ON SCHEMA public TO PUBLIC;

GRANT ALL ON SCHEMA public TO pg_database_owner;
'''

# Define your SQL query to create a table
create_table_query = '''
-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    spotifyid character varying COLLATE pg_catalog."default" NOT NULL,
    accesstoken character varying COLLATE pg_catalog."default",
    refreshtoken character varying COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (spotifyid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
'''

# Execute the SQL queries
cur.execute(create_db_query)
cur.execute(create_schema_query)
cur.execute(create_table_query)

# Commit the changes to the database
conn.commit()

# Close the cursor and the connection
cur.close()
conn.close()
