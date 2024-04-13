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
    name: "",
    artistsNames: []
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
            if(t.track.album.total_tracks > 1) {
                if(!albums[t.track.album.id]) {
                    var albumData = Object.create(albumDataStructure);
                    albumData.savedTracks = [];
                    albumData.totalTracks = t.track.album.total_tracks;
                    albums[t.track.album.id] = albumData;
                    albumData.name = t.track.album.name;
                    albumData.artistsNames = [];
                    t.track.album.artists.forEach(artist => albumData.artistsNames.push(artist.name));
                }
                albums[t.track.album.id].savedTracks.push(t.track.id);
            }
        });
        if(response.data.next) await getOffsetSavedTracks(response.data.next);
    } catch (error) { webError("Get saved tracks", error) }
}

async function getSavedTracks() {
    await getOffsetSavedTracks();
}
//#endregion

//#region TRESHOLD ALGORITHM
async function addAlbums(idsString) {
    try {
        await axios.put(`https://api.spotify.com/v1/me/albums?ids=${idsString}`, { x: 'x' } , { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    } catch (error) { webError("Check and add album", error) }
}

async function tresholdAlgorithm() {
    var lovedAlbum = []
    for(let album in albums) {
        if(albums[album].savedTracks.length >= albums[album].totalTracks * thresholdLove) {
            lovedAlbum.push(album);
        }
    }

    var idsString = "";
    var idsList = [];
    var idsCounter = 0;
    for(var album of lovedAlbum ) {
        idsList.push(album);
        idsString = idsString.concat(album,',');
        idsCounter = idsCounter+1;

        if(idsCounter == 20){
            await addAlbums(idsString);
            idsString = "";
            idsList = [];
            idsCounter = 0;
        }
    }
    if(idsCounter > 0)
        await addAlbums(idsString);
}
//#endregion

//#region REMOVE SAVED TRACKS FROM SAVED ALBUMS
async function removeTracks(idsToDelete) {
    try {
        await axios.delete(`https://api.spotify.com/v1/me/tracks?ids=${idsToDelete}`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });    
    } catch (error) { webError("Remove tracks", error) }
}

async function checkAlbums(idsString, idsList) {
    try {
        const response = await axios.get(`https://api.spotify.com/v1/me/albums/contains?ids=${idsString}`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });

        var idsToDelete = "";
        var idsCounter = 0;
        for(var i in response.data) {
            if(response.data[i]) {
                for(var track of albums[idsList[i]].savedTracks) {
                    idsToDelete = idsToDelete.concat(track, ',');
                    idsCounter = idsCounter+1;
                    if(idsCounter == 50) {
                        await removeTracks(idsToDelete);
                        var idsToDelete = "";
                        var idsCounter = 0;
                    }
                }
            }
        }
        if(idsCounter > 0)
            await removeTracks(idsToDelete);
    } catch (error) { webError("Check albums", error) }
}

async function removeTracksAlgorithm() {
    var idsString = "";
    var idsList = [];
    var idsCounter = 0;

    for(var album in albums) {
        idsList.push(album);
        idsString = idsString.concat(album,',');
        idsCounter = idsCounter+1;

        if(idsCounter == 20){
            await checkAlbums(idsString, idsList);

            idsString = "";
            idsList = [];
            idsCounter = 0;
        }
    }
    if(idsCounter > 0)
        await checkAlbums(idsString, idsList);
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
    const step2 = "Apply treshold algorithm";
    const step3 = "Remove saved tracks from saved albums";
    try {
        await stepExecution(step1, getSavedTracks);
        await stepExecution(step2, tresholdAlgorithm);
        await stepExecution(step3, removeTracksAlgorithm);
    } catch (error) { }
}
//#endregion

//#region EXPORTS 
module.exports = {
    main,

    // For tests

}
//#endregion