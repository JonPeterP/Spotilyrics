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
                function findArtist() {
                    var divs = document.querySelectorAll('.encore-text.encore-text-marginal');
                    for (var i = 0; i < divs.length; i++) {
                        var div = divs[i];
                        var span = div.querySelector('span');
                        var anchor = div.querySelector('span a');
                        if (span && anchor) {
                            return anchor.textContent;
                        }
                    }
                    return "Artist Not Found";
                }

                function findAnchorTextInEncoreTextDivs() {
                    var divs = document.querySelectorAll('.encore-text.encore-text-body-small');
                    var artist = findArtist();

                    for (var i = 0; i < divs.length; i++) {
                        var div = divs[i];
                        var span = div.querySelector('span');
                        var anchor = div.querySelector('span a');
                        if (span && anchor) {
                            return anchor.textContent.concat(";", artist);
                        }
                    }

                    return "ERROR: No div with class 'encore-text encore-text-body-small' containing both span and anchor tag found";
                }

                return findAnchorTextInEncoreTextDivs();
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
    const response = await fetch(`https://lyrics-nodejs-api-git-main-ninfosmrs-projects.vercel.app/api/lyrics?artist=${encodeURIComponent(artistName)}&song=${encodeURIComponent(songName)}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(searchQuery);
    }
    const data = await response.json();
    return data.lyrics;
}



window.onload = onWindowLoad;
