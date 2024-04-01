//#region REQUIRE
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
//#endregion

//#region VARIABLES
const commonDir = path.join(__dirname, '../common');
const spotifyRequestsLimit = 50;

var savedTracksIds = [];

var accessToken;
try { accessToken = fs.readFileSync(commonDir + '/spotify_access_token', 'utf8') }
catch (err) { console.error(err) }
//#endregion

//#region GET SAVED TRACKS
async function getOffsetSavedTracks(href=`https://api.spotify.com/v1/me/tracks?offset=0&limit=${spotifyRequestsLimit}`) {
    try {
        const response = await axios.get(href, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
        response.data.items.forEach(t => savedTracksIds.push(t.track.id));
        if(response.data.next) await getOffsetSavedTracks(response.data.next);
    } catch (error) { webError("Get user id", error) }
}

async function getSavedTracks() {
    await getOffsetSavedTracks();
}
//#endregion

//#region LOGS
function webError(step, error) {
    console.log(`[KO] ${step} : ${error}`);
    throw new Error();
}

function stepSuccess(step) {
    console.log(`[OK] ${step}`);
}

function stepBeggining(step) {
    const sptor = "=".repeat(5);
    console.log(`\n${sptor} ${step} ${sptor}`);
}

async function stepExecution(stepName, stepFunc) {
    stepBeggining(stepName);
    await stepFunc()
    stepSuccess(stepName);
}
//#endregion

//#region MAIN
async function main() {
    const step1 = "Get liked tracks";
    try {
        await stepExecution(step1, getSavedTracks);
    } catch (error) { }
}
//#endregion

//#region EXPORTS 
module.exports = {
    main,

    // For tests
}
//#endregion