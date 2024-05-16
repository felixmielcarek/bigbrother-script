//#region REQUIRE
const express = require('express')
const axios = require('axios');
const { Client } = require('pg');
//#endregion

//#region CONSTANTS
const port = 80
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = 'https://felixmielcarek.github.io/callback/';
//#endregion

//#region APP INIT

const app = express()
app.listen(port, () => { console.log(`Big brother is listening on port ${port}`) })

//#endregion

//#region ACCESS TOKEN

app.get('/', async (req, res) => {
  const client = new Client({
    host: 'felixmielcarek-bigbrotherdb',
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
  })

  const code = req.query.code;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token', method: 'post', json: true,
    data: { code: code, redirect_uri: redirectUri, grant_type: 'authorization_code' },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
    }    
  };

  const response1 = await axios(authOptions);
  const accessToken = response1.data.access_token
  const refreshToken = response1.data.refresh_token

  try {
    const response2 = await axios.get(`https://api.spotify.com/v1/me`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    
    const data = {
      SpotifyId: response2.data.id,
      AccessToken: accessToken,
      RefreshToken: refreshToken
    };

    await client.connect()

    const sqlQuery = `
      INSERT INTO public.users (spotifyid,accesstoken,refreshtoken)
      VALUES ($1,$2,$3)
      ON CONFLICT (spotifyid) DO UPDATE SET
      accesstoken = EXCLUDED.accesstoken,
      refreshtoken = EXCLUDED.refreshtoken
    `;
    
    client.query(sqlQuery, [data.SpotifyId, data.AccessToken, data.RefreshToken], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data inserted/updated successfully');
      client.end();
    });
  } catch (error) { console.log('Error getting user Spotify id') }
});
//#endregion