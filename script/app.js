//#region REQUIRE
const axios = require('axios');
const { Client } = require('pg');
//#endregion

//#region CONSTANTS
const spotifyRequestsLimit = 50;
const thresholdLove = 0.6;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const client = new Client({
    host: 'felixmielcarek-bigbrotherdb',
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
  })
//#endregion

//#region STRUCTURE
let albumDataStructure = {
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
                    let albumData = Object.create(albumDataStructure);
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
    let lovedAlbum = []
    for(let album in albums) {
        if(albums[album].savedTracks.length >= albums[album].totalTracks * thresholdLove) {
            lovedAlbum.push(album);
        }
    }

    let idsString = "";
    let idsList = [];
    let idsCounter = 0;
    for(let album of lovedAlbum ) {
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

        let idsToDelete = "";
        let idsCounter = 0;
        for(let i in response.data) {
            if(response.data[i]) {
                for(let track of albums[idsList[i]].savedTracks) {
                    idsToDelete = idsToDelete.concat(track, ',');
                    idsCounter = idsCounter+1;
                    if(idsCounter == 50) {
                        await removeTracks(accessToken, idsToDelete);
                        let idsToDelete = "";
                        let idsCounter = 0;
                    }
                }
            }
        }
        if(idsCounter > 0)
            await removeTracks(accessToken, idsToDelete);
    } catch (error) { webError("Check albums", error) }
}

async function removeTracksAlgorithm(albums, accessToken) {
    let idsString = "";
    let idsList = [];
    let idsCounter = 0;

    for(let album in albums) {
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
async function mainAlgorithm(accessToken) {
    let albums = {};

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
}

async function main() {
    await client.connect();

    try {
        const selectQuery = 'SELECT * FROM public.users';   
        const selectResult = await client.query(selectQuery);

        for(let row of selectResult.rows) {
            const spotifyId = row.spotifyid;
            const refreshToken = row.refreshtoken;            

            let authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                method: 'post',
                data: {
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                },
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64'))
                },
                json: true
            };
         
            const response = await axios(authOptions);
            const newAccessToken = response.data.access_token;
            const newRefreshToken = response.data.refresh_token;

            const updateQuery = `
                UPDATE public.users
                SET accesstoken = $2, refreshtoken = $3
                WHERE spotifyid = $1;
            `;
            await client.query(updateQuery, [spotifyId, newAccessToken, newRefreshToken])

            await mainAlgorithm(newAccessToken);
        }
    } catch (error) { console.error('Error executing select query:', error) } finally { await client.end() }
}
//#endregion

main();