FROM node:latest

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /usr/src/app

COPY script/package*.json ./script/
RUN npm install ./script

COPY script ./script/
COPY common ./common/
RUN touch common/.env

# Expose the port the app runs on
EXPOSE 80

# Command to run the application
CMD ["python3", "common/set-env-var.py"]
CMD ["node", "--env-file=common/.env" , "script/app.js"]
