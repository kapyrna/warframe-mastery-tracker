(function () {
    "use strict";

    var repoName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
    var storageKey = repoName + ":tennoData";
    
    var playerData = null;

    try {
        var raw = localStorage.getItem(storageKey);
        if (!raw) {
            console.log("[populate-tenno-data] No player JSON found in localStorage.");
        } else {
            playerData = JSON.parse(raw);
            console.log("[populate-tenno-data] Player JSON loaded successfully.");
        }
    } catch (e) {
        console.log("[populate-tenno-data] Failed to load player JSON:", e);
    }

    if (playerData) {
        var displayName =
            playerData.Results &&
            playerData.Results[0] &&
            playerData.Results[0].DisplayName;

        var nameElement = document.getElementById("player-name");
        var separatorElement = document.getElementById("player-name-separator");
        if (nameElement && displayName) {
            nameElement.textContent = displayName;
            nameElement.hidden = false;
            separatorElement.hidden = false;
        }
    }
})();
