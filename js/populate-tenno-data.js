(function () {
    "use strict";

    var repoName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
    var storageKey = repoName + ":tennoData";
    
    var playerData = null;

    try {
        var raw = localStorage.getItem("tennoData");
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

        var nameEl = document.getElementById("player-name");
        if (nameEl && displayName) {
            nameEl.textContent = displayName;
            nameEl.hidden = false;
        }
    }
})();
