FROM node:latest

# Set working directory inside the container
WORKDIR /usr/src/app

COPY callback-server/package*.json ./callback-server/
RUN npm install ./callback-server

COPY callback-server ./callback-server/
RUN env | awk -F= '{print $1 "=" $1}' > .env

# Expose the port the app runs on
EXPOSE 80

# Command to run the application
CMD ["node", "--env-file=.env" , "callback-server/app.js"]
