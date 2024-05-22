//#region REQUIRE
const express = require('express')
const axios = require('axios');
const mariadb = require('mariadb');
const cors = require('cors');
//#endregion

//#region CONSTANTS
const port = 80
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = 'https://felixmielcarek.github.io/callback/';
const allowedDomain = [ 'https://felixmielcarek.github.io' ];
//#endregion

//#region LOGS
function stepBeggining(step) {
    const sptor = "=".repeat(5);
    console.log(`\n${sptor} ${step} ${sptor}`);
}
//#endregion

//#region APP INIT
const app = express()
app.use(cors({ origin: allowedDomain }));
app.listen(port, () => { console.log(`Big brother is listening on port ${port}`) })
//#endregion

//#region ACCESS TOKEN
app.post('/', async (req, res) => {
  stepBeggining("Activation");
  
  const code = req.query.code;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token', method: 'get', json: true,
    data: { code: code, redirect_uri: redirectUri, grant_type: 'authorization_code' },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
    }    
  };
  let data;

  try {
    const response1 = await axios(authOptions);
    const accessToken = response1.data.access_token
    const refreshToken = response1.data.refresh_token
    const response2 = await axios.get(`https://api.spotify.com/v1/me`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    data = {
      SpotifyId: response2.data.id,
      AccessToken: accessToken,
      RefreshToken: refreshToken
    };
  } catch (error) { console.log(`Error getting user Spotify id: ${error}`) }

  const sqlQuery = `
    INSERT INTO users (spotifyid, accesstoken, refreshtoken)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
    accesstoken = VALUES(accesstoken),
    refreshtoken = VALUES(refreshtoken);
  `;

  try {    
    const pool = mariadb.createPool({
      host: 'felixmielcarek-bigbrotherdb',
      user: process.env.MARIADB_USER,
      database: process.env.MARIADB_DATABASE,
      password: process.env.MARIADB_PASSWORD,
      connectionLimit: 5
    });

    const conn = await pool.getConnection();
    
    conn.query(sqlQuery, [data.SpotifyId, data.AccessToken, data.RefreshToken], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data inserted/updated successfully');
      conn.end();
    });
  } catch (error) { console.log(`Error accessing database: ${error}`) }
});

app.get('/settings/deactivate', async (req,res) => {
  stepBeggining("Setting: deactivation");
  
  const code = req.query.code;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token', method: 'post', json: true,
    data: { code: code, redirect_uri: redirectUri, grant_type: 'authorization_code' },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
    }
  };
  let userId;

  try {
    const response1 = await axios(authOptions);
    const accessToken = response1.data.access_token;
    const response2 = await axios.get(`https://api.spotify.com/v1/me`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    userId = response2.data.SpotifyId;
  } catch (error) { console.log(`Error getting user Spotify id: ${error}`) }

  const sqlQuery = `
    DELETE FROM users
    WHERE spotifyid = ?;
  `;
  
  try {    
    const pool = mariadb.createPool({
      host: 'felixmielcarek-bigbrotherdb',
      user: process.env.MARIADB_USER,
      database: process.env.MARIADB_DATABASE,
      password: process.env.MARIADB_PASSWORD,
      connectionLimit: 5
    });

    const conn = await pool.getConnection();
    
    conn.query(sqlQuery, [userId], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data deleted successfully');
      conn.end();
    });
  } catch (error) { console.log(`Error accessing database: ${error}`) }
});
//#endregion
