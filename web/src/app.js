//#region REQUIRE
const path = require('path');
const express = require('express')
const cookieParser = require('cookie-parser');
const axios = require('axios');
const queryString = require('querystring');
const fs = require('node:fs');
//#endregion

//#region CONSTANTS
const staticDir = path.join(__dirname, '../public');
const commonDir = path.join(__dirname, '../../common');
const port = 3000
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = 'http://localhost:3000/callback';
const scope = 'user-read-private user-read-email';
//#endregion

//#region APP INIT
const app = express()
app.use(cookieParser());
app.use(express.static(staticDir));
app.get('/', function (req, res) {
  req.cookies['account'] == 'true'
    ? res.sendFile(staticDir + '/home.html')
    : res.sendFile(staticDir + '/login.html');
});

app.listen(port, () => {
  console.log(`Big brother is listening on port ${port}`);
})
//#endregion

//#region USER AUTHORIZATION
function generateRandomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomString += charset[randomIndex];
  }
  return randomString;
}

app.get('/login', function (req, res) {
  const state = generateRandomString(16);

  res.redirect('https://accounts.spotify.com/authorize?' +
    queryString.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    }));
});
//#endregion

//#region ACCESS TOKEN
app.get('/callback', (req, res) => {
  res.cookie('account', 'true', { maxAge: 360000 });
  const code = req.query.code;
  const state = req.query.state;

  res.redirect('/');

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    data: {
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
    },
    json: true
  };

  axios(authOptions)
    .then(response => {
      fs.writeFile(commonDir + '/spotify_access_token', response.data.access_token, err => {
        if (err) {
          console.error(err);
        } else {
          console.log("Spotify access token recovered.")
        }
      });
    })
    .catch(error => {
      console.log('Error:', error);
    });
});
//#endregion