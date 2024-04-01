//#region REQUIRE
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
//#endregion

//#region VARIABLES
const commonDir = path.join(__dirname, '../common');
const spotifyRequestsLimit = 50;
const thresholdLove = 0.6;

var albums = {};
var albumDataStructure = {
    savedTracks: [],
    totalTracks: 0,
};

var accessToken;
try { accessToken = fs.readFileSync(commonDir + '/spotify_access_token', 'utf8') }
catch (err) { console.error(err) }
//#endregion

//#region GET SAVED TRACKS
async function getOffsetSavedTracks(href=`https://api.spotify.com/v1/me/tracks?offset=0&limit=${spotifyRequestsLimit}`) {
    try {
        const response = await axios.get(href, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
        response.data.items.forEach(t => {
            if(t.track.album.album_type !== "single") {
                if(!albums[t.track.album.id]) {
                    var albumData = Object.create(albumDataStructure);
                    albumData.savedTracks = [];
                    albumData.totalTracks = t.track.album.total_tracks;
                    albums[t.track.album.id] = albumData;
                }
                albums[t.track.album.id].savedTracks.push(t.track.id);
            }
        });
        if(response.data.next) await getOffsetSavedTracks(response.data.next);
    } catch (error) { webError("Get user id", error) }
}

async function getSavedTracks() {
    await getOffsetSavedTracks();
    console.log(albums);
}
//#endregion

//#region TRESHOLD ALGORITHM
function tresholdAlgorithm() {
    for(let album in albums)
        if(albums[album].savedTracks.length >= albums[album].totalTracks * thresholdLove) 
            console.log(album);
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
    const step2 = "Apply treshold algortihm";
    try {
        await stepExecution(step1, getSavedTracks);
        stepExecution(step2, tresholdAlgorithm);
    } catch (error) { }
}
//#endregion

//#region EXPORTS 
module.exports = {
    main,

    // For tests
}
//#endregion