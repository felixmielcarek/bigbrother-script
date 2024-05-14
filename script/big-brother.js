//#region REQUIRE
const axios = require('axios');
const { Client } = require('pg');
//#endregion

//#region CONSTANTS
const spotifyRequestsLimit = 50;
const thresholdLove = 0.6;
const client = new Client({
    user: process.env.DB_USER,
    host: 'localhost',
    database: 'bigbrother',
    password: process.env.DB_PASSWORD,
    port: 5432
  });
//#endregion

//#region STRUCTURE
var albumDataStructure = {
    savedTracks: [],
    totalTracks: 0,
    name: "",
    artistsNames: []
};
//#endregion

//#region GET SAVED TRACKS
async function getSavedTracks(accessToken, albums, href=`https://api.spotify.com/v1/me/tracks?offset=0&limit=${spotifyRequestsLimit}`) {
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
        if(response.data.next) await getSavedTracks(accessToken, albums, response.data.next);
    } catch (error) { webError("Get saved tracks", error) }
}
//#endregion

//#region TRESHOLD ALGORITHM
async function addAlbums(accessToken, idsString) {
    try {
        await axios.put(`https://api.spotify.com/v1/me/albums?ids=${idsString}`, { x: 'x' } , { headers: { 'Authorization': 'Bearer ' + accessToken, } });
    } catch (error) { webError("Check and add album", error) }
}

async function tresholdAlgorithm(albums, accessToken) {
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
            await addAlbums(accessToken, idsString);
            idsString = "";
            idsList = [];
            idsCounter = 0;
        }
    }
    if(idsCounter > 0)
        await addAlbums(accessToken, idsString);
}
//#endregion

//#region REMOVE SAVED TRACKS FROM SAVED ALBUMS
async function removeTracks(accessToken, idsToDelete) {
    try {
        await axios.delete(`https://api.spotify.com/v1/me/tracks?ids=${idsToDelete}`, { headers: { 'Authorization': 'Bearer ' + accessToken, } });    
    } catch (error) { webError("Remove tracks", error) }
}

async function checkAlbums(accessToken, idsString, idsList, albums) {
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
                        await removeTracks(accessToken, idsToDelete);
                        var idsToDelete = "";
                        var idsCounter = 0;
                    }
                }
            }
        }
        if(idsCounter > 0)
            await removeTracks(accessToken, idsToDelete);
    } catch (error) { webError("Check albums", error) }
}

async function removeTracksAlgorithm(albums, accessToken) {
    var idsString = "";
    var idsList = [];
    var idsCounter = 0;

    for(var album in albums) {
        idsList.push(album);
        idsString = idsString.concat(album,',');
        idsCounter = idsCounter+1;

        if(idsCounter == 20){
            await checkAlbums(accessToken, idsString, idsList, albums);

            idsString = "";
            idsList = [];
            idsCounter = 0;
        }
    }
    if(idsCounter > 0)
        await checkAlbums(accessToken, idsString, idsList, albums);
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
//#endregion

//#region MAIN
async function main() {
    try {
        await client.connect();
        const query = 'SELECT accesstoken FROM public.users';
        const result = await client.query(query);
    
        result.rows.forEach(async (row) => {
            var albums = {};
            var accessToken = row.accesstoken

            const step1 = "Get liked tracks";
            const step2 = "Apply treshold algorithm";
            const step3 = "Remove saved tracks from saved albums";
            try {
                stepBeggining(step1);
                await getSavedTracks(accessToken, albums);
                stepSuccess(step1);

                stepBeggining(step2);
                await tresholdAlgorithm(albums, accessToken);
                stepSuccess(step2);

                stepBeggining(step3);
                await removeTracksAlgorithm(albums, accessToken);
                stepSuccess(step3);
            } catch (error) { }
        });
    } catch (error) { console.error('Error executing query:', error) } finally { await client.end() }
}
//#endregion

//#region EXPORTS 
module.exports = {
    main,

    // For tests

}
//#endregion