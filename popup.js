function onWindowLoad() {
    var songMsg = document.querySelector('#song');
    var artistMsg = document.querySelector("#artist");
    var message = document.querySelector("#lyrics");

    chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            injectImmediately: true,
            func: function () {
                function findSongAndArtist() {
                    // Select all spans with aria-live="polite"
                    var liveRegions = document.querySelectorAll('span[aria-live="polite"]');
                    
                    for (var i = 0; i < liveRegions.length; i++) {
                        var liveRegion = liveRegions[i];
                        var textContent = liveRegion.textContent.trim();
                
                        // Check if the text content starts with "Now playing:"
                        if (textContent.startsWith("Now playing:")) {
                            console.log("Found Live Region:", textContent); // Debug
                
                            // Extract the song and artist name
                            var songAndArtist = textContent.replace("Now playing:", "").trim();
                            var [song, artist] = songAndArtist.split(" by ");
                            
                            return { 
                                song: song ? song.trim() : "Song Not Found", 
                                artist: artist ? artist.trim() : "Artist Not Found" 
                            };
                        }
                    }
                
                    console.warn("No valid 'Now playing' live region found!");
                    return { song: "Song Not Found", artist: "Artist Not Found" };
                }
                // Combining song name and artist
                var songartist = findSongAndArtist();
                var songName = songartist["song"];
                var artistName = songartist["artist"];
                return songName + " ; " + artistName;
            }
        });

    }).then(function (results) {
        var songResult = results[0].result.split(';');
        var songName = songResult[0];
        var artistName = songResult[1];

        songMsg.innerText = songName;
        artistMsg.innerText = artistName;

        getLyrics(artistName, songName).then(function (lyrics) {
            message.innerText = lyrics;
        }).catch(function (error) {
            message.innerText = 'Error fetching lyrics: \n' + error.message;
        });

    }).catch(function (error) {
        songMsg.innerText = 'There was an error injecting script : \n' + error.message;
    });
}

async function getLyrics(artistName, songName) {
    try {
        const result = await search(artistName, songName);
        return result;
    } catch (error) {
        throw new Error('Lyrics not found for ' + songName + ' by ' + artistName);
    }
}

async function search(artistName, songName) {
    //sample query https://lyrics-nodejs-api-git-main-ninfosmrs-projects.vercel.app/api/lyrics?artist=ado&song=odereki
    const response = await fetch(`https://lyrics-nodejs-api-git-main-ninfosmrs-projects.vercel.app/api/lyrics?artist=${encodeURIComponent(artistName)}&song=${encodeURIComponent(songName)}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(searchQuery);
    }
    const data = await response.json();
    return data.lyrics;
}



window.onload = onWindowLoad;
