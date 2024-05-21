import os
import mariadb

env_user = os.getenv('MARIADB_USER')
env_password = os.getenv('MARIADB_PASSWORD')
env_database = os.getenv('MARIADB_DATABASE')

def executeDBQuery(query):
    conn = mariadb.connect(
        user=env_user, 
        password=env_password, 
        host="felixmielcarek-bigbrotherdb",
        database=env_database
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(query)
    cur.close()
    conn.close()

grant_privileges_query = '''
GRANT ALL PRIVILEGES ON {database}.* TO '{user}'@'%' IDENTIFIED BY '{password}';
FLUSH PRIVILEGES;
'''.format(database=env_database, user=env_user, password=env_password)

create_table_query = '''
CREATE TABLE IF NOT EXISTS users (
    spotifyid VARCHAR(255) NOT NULL,
    accesstoken VARCHAR(255),
    refreshtoken VARCHAR(255),
    PRIMARY KEY (spotifyid)
);
'''

executeDBQuery(create_table_query)