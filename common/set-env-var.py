import os

with open('.env', 'w') as f:
    f.write("MARIADB_USER={}\n".format(os.getenv('MARIADB_USER')))
    f.write("MARIADB_PASSWORD={}\n".format(os.getenv('MARIADB_PASSWORD')))
    f.write("MARIADB_DATABASE={}\n".format(os.getenv('MARIADB_DATABASE')))
    f.write("CLIENT_ID={}\n".format(os.getenv('CLIENT_ID')))
    f.write("CLIENT_SECRET={}\n".format(os.getenv('CLIENT_SECRET')))
