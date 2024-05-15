FROM node:latest

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /usr/src/app

COPY web/src/package*.json ./web/src/
RUN npm install ./web/src
RUN apt-get update && apt-get install python3-os

COPY web ./web/
COPY common ./common/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["python3", "common/set-env-var.py"]
CMD ["node", "--env-file=common/.env" , "web/src/app.js"]
