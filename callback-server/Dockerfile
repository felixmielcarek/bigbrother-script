FROM node:latest

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /usr/src/app

COPY callback-server/package*.json ./callback-server/
RUN npm install ./callback-server

COPY callback-server ./callback-server/
COPY common ./common/
RUN touch common/.env
RUN python3 common/set-env-var.py
RUN cat common/.env

# Expose the port the app runs on
EXPOSE 80

# Command to run the application
CMD ["node", "--env-file=common/.env" , "callback-server/app.js"]
