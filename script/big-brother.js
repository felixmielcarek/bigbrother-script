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
            if(t.track.album.album_type !== "single") {
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
async function checkAlbum(idsString,idsList) {
    try {
        const response = await axios.get(`https://api.spotify.com/v1/me/albums/contains?ids=${idsString}`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });
        
        var idsToSaveString = "";
        for(var i in response.data) {
            if(!response.data[i]) {
                idsToSaveString = idsToSaveString.concat(idsList[i],',');
                
                var artistsNames = "";
                albums[idsList[i]].artistsNames.forEach(name => artistsNames = artistsNames.concat(name,' & '));
                artistsNames = artistsNames.substring(0, artistsNames.length - 3);
                console.log(`New saved album: ${albums[idsList[i]].name} from ${artistsNames}`);
            }
        }

        await axios.put(`https://api.spotify.com/v1/me/albums?ids=${idsToSaveString}`, { x: 'x' } , { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    } catch (error) { webError("Check album", error) }
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
    var tmp = 0;
    for(var album of lovedAlbum ) {
        idsList.push(album);
        idsString = idsString.concat(album,',');
        tmp = tmp+1;

        if(tmp == 20){
            await checkAlbum(idsString,idsList);
            idsString = "";
            idsList = [];
            tmp = 0;
        }
    }
    await checkAlbum(idsString,idsList);
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
    try {
        await stepExecution(step1, getSavedTracks);
        await stepExecution(step2, tresholdAlgorithm);
    } catch (error) { }
}
//#endregion

//#region EXPORTS 
module.exports = {
    main,

    // For tests
}
//#endregion