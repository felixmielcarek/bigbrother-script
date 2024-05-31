import psycopg2

conn = psycopg2.connect(
   database="big-brother", user='postgres', password='postgres', host='127.0.0.1', port= '5432'
)
cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS USERS")

sql ='''CREATE TABLE USERS(
   SPOTIFY_ID       VARCHAR(255) PRIMARY KEY,
   ACCESS_TOKEN     VARCHAR(255),
   REFRESH_TOKEN    VARCHAR(255)
)'''
cursor.execute(sql)
print("Table created successfully........")
conn.commit()
conn.close()