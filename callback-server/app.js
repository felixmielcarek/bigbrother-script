//#region REQUIRE
const express = require('express')
const axios = require('axios');
const mariadb = require('mariadb');
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
app.get('/settings/deactivate', async (req,res) => {
  const code = req.query.code;
  
  const pool = mariadb.createPool({
    host: 'felixmielcarek-bigbrotherdb',
    user: process.env.MARIADB_USER,
    database: process.env.MARIADB_DATABASE,
    password: process.env.MARIADB_PASSWORD,
    connectionLimit: 5
});

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

  let conn;

  try {
    conn = await pool.getConnection()
    const response2 = await axios.get(`https://api.spotify.com/v1/me`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });

    const sqlQuery = `
      DELETE FROM users
      WHERE spotifyid = ?;
    `;
    
    conn.query(sqlQuery, [response2.data.SpotifyId], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data deleted successfully');
      conn.end();
    });
  } catch (error) { console.log('Error getting user Spotify id') }
})

app.get('/', async (req, res) => {
  const pool = mariadb.createPool({
    host: 'felixmielcarek-bigbrotherdb',
    user: process.env.MARIADB_USER,
    database: process.env.MARIADB_DATABASE,
    password: process.env.MARIADB_PASSWORD,
    connectionLimit: 5
});

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

  let conn;

  try {
    conn = await pool.getConnection()
    
    const response2 = await axios.get(`https://api.spotify.com/v1/me`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    
    const data = {
      SpotifyId: response2.data.id,
      AccessToken: accessToken,
      RefreshToken: refreshToken
    };

    const sqlQuery = `
      INSERT INTO users (spotifyid, accesstoken, refreshtoken)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      accesstoken = VALUES(accesstoken),
      refreshtoken = VALUES(refreshtoken);
    `;
    
    conn.query(sqlQuery, [data.SpotifyId, data.AccessToken, data.RefreshToken], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data inserted/updated successfully');
      conn.end();
    });
  } catch (error) { console.log('Error getting user Spotify id') }
});
//#endregion