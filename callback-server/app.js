//#region REQUIRE
const express = require('express')
const axios = require('axios');
const mariadb = require('mariadb');
const cors = require('cors');
//#endregion

//#region CONSTANTS
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const mariadbUser = process.env.MARIADB_USER;
const mariadbDatabase = process.env.MARIADB_DATABASE;
const mariadbPassword = process.env.MARIADB_PASSWORD;
const port = 80
const redirectUri = 'https://felixmielcarek.github.io/big-brother/callback/';
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
app.use(express.json());
app.listen(port, () => { console.log(`Big brother is listening on port ${port}`) })
//#endregion

//#region ACCESS TOKEN
app.post('/', async (req, res) => {
  console.log(clientId);
  stepBeggining("Activation");
  
  let data;
  let accessToken;
  let refreshToken;
  const code = req.body.code;

  try {
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token', method: 'post', json: true,
      data: { 
        code: code, 
        redirect_uri: redirectUri, 
        grant_type: 'authorization_code' 
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
      }    
    };
    const response1 = await axios(authOptions);
    accessToken = response1.data.access_token
    refreshToken = response1.data.refresh_token
  } catch (error) {
    console.log(`Error getting Spotify token: ${error}`);
    console.log(error.response.data);
    res.status(500).send('Error');
  }

  try {
    const response2 = await axios.get(`https://api.spotify.com/v1/me`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    data = {
      SpotifyId: response2.data.id,
      AccessToken: accessToken,
      RefreshToken: refreshToken
    };
  } catch (error) {
    console.log(`Error getting user Spotify id: ${error}`);
    res.status(500).send('Error');
  }

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
      user: mariadbUser,
      database: mariadbDatabase,
      password: mariadbPassword,
      connectionLimit: 5
    });

    const conn = await pool.getConnection();
    
    conn.query(sqlQuery, [data.SpotifyId, data.AccessToken, data.RefreshToken], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data inserted/updated successfully');
      res.status(200).send('Ok');
      conn.end();
    });
  } catch (error) { 
    console.log(`Error accessing database: ${error}`);
    res.status(500).send('Error');
  }
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
  } catch (error) {
    console.log(`Error getting user Spotify id: ${error}`);
    res.status(500).send('Error');
  }

  const sqlQuery = `
    DELETE FROM users
    WHERE spotifyid = ?;
  `;
  
  try {    
    const pool = mariadb.createPool({
      host: 'felixmielcarek-bigbrotherdb',
      user: mariadbUser,
      database: mariadbDatabase,
      password: mariadbPassword,
      connectionLimit: 5
    });

    const conn = await pool.getConnection();
    
    conn.query(sqlQuery, [userId], (err, res) => {
      if (err) {
        console.error('Error executing query', err);
        return;
      }
      console.log('Data deleted successfully');
      res.status(200).send('Ok');
      conn.end();
    });
  } catch (error) { 
    console.log(`Error accessing database: ${error}`);
    res.status(500).send('Error');
  }
});
//#endregion
