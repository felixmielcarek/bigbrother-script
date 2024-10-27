//#region IMPORTS
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
//#endregion

//#region CONFIGURATIONS
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  })
});
const db = admin.firestore();

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const port = process.env.PORT;
const redirectUri = process.env.REDIRECT_URL;
const allowedDomain = [ process.env.ALLOWED_DOMAIN ];
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
app.get('/callback', async (req, res) => {
  stepBeggining("Activation");
  
  let data;
  let accessToken;
  let refreshToken;
  const code = req.query.code;

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

  try {
    await db.collection("users").doc(data.SpotifyId).set({
      accessToken: data.AccessToken,
      refreshToken: data.RefreshToken,
    });
    
    console.log('Data inserted/updated successfully');
    res.status(200).send('Ok');
  } catch (error) { 
    console.log(`Error accessing database: ${error}`);
    res.status(500).send('Error');
  }
});
//#endregion