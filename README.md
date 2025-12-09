# Context

The context of this repository is described in the following document: [bigbrother README](https://github.com/felixmielcarek/bigbrother/blob/main/README.md).

# Requirements

## Development environment

To run the script you will need [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/).

To install needed dependencies, run the following command:

```shell
npm install
```

## Environment variables

To run this script, you have to create a `.env` file a the root of the project.

Fill this file with the following content:

```
CLIENT_ID=my_client_id
CLIENT_SECRET=my_client_secret
DBAPI_URL=my_dbapi_url
```

Replace `my_client_id` and `my_client_secret` with the corresponding values from Spotify.

Replace `my_dbapi_url` with your own value.