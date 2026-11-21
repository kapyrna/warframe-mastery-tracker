(function () {
    "use strict";

    var repoName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
    var storageKey = repoName + ":tennoData";

    // Overview elements
    var statItemsCompleted = document.getElementById("stat-items-completed");
    var statXpEarned = document.getElementById("stat-xp-earned");
    var statMasteryRank = document.getElementById("stat-mastery-rank");
    var statXpToNextMr = document.getElementById("stat-xp-to-next-mr");
    
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

        var statPlayername = document.getElementById("player-name");
        var separatorElement = document.getElementById("player-name-separator");
        if (statPlayername && displayName) {
            statPlayername.textContent = displayName;
            statPlayername.hidden = false;
            separatorElement.hidden = false;
        }

    // XP to next MR from current earned XP
    if (statXpToNextMr && statXpEarned) {
        var currentXp = parseInt(statXpEarned.textContent) || 0;
        statXpToNextMr.textContent = xpToNextMR(currentXp);
    }
    
    }
})();
