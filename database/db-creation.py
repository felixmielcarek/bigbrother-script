import os
import mariadb

env_user = os.getenv('MARIADB_USER')
env_password = os.getenv('MARIADB_PASSWORD')

def executeDBQuery(query):
    conn = mariadb.connect(
        user=env_user, 
        password=env_password, 
        host="felixmielcarek-bigbrotherdb",
        database="bigbrother"
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(query)
    cur.close()
    conn.close()


create_table_query = '''
CREATE TABLE IF NOT EXISTS users (
    spotifyid VARCHAR(255) NOT NULL,
    accesstoken VARCHAR(255),
    refreshtoken VARCHAR(255),
    PRIMARY KEY (spotifyid)
);
'''

executeDBQuery(create_table_query)