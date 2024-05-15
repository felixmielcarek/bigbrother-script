import os

with open('.env', 'w') as f:
    f.write("POSTGRES_USER={}\n".format(os.getenv('POSTGRES_USER')))
    f.write("POSTGRES_PASSWORD={}\n".format(os.getenv('POSTGRES_PASSWORD')))
    f.write("POSTGRES_DATABASE={}\n".format(os.getenv('POSTGRES_DATABASE')))
    f.write("CLIENT_ID={}\n".format(os.getenv('CLIENT_ID')))
    f.write("CLIENT_SECRET={}\n".format(os.getenv('CLIENT_SECRET')))
