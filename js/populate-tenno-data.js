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

    // load intrinsics progress
    var SKILL_TO_UNIQUE_NAME = { // PlayerSkills key → intrinsic uniqueName
        LPS_TACTICAL: "/Intrinsics/Railjack/Tactical",
        LPS_PILOTING: "/Intrinsics/Railjack/Piloting",
        LPS_GUNNERY: "/Intrinsics/Railjack/Gunnery",
        LPS_ENGINEERING: "/Intrinsics/Railjack/Engineering",
        LPS_COMMAND: "/Intrinsics/Railjack/Command",
        LPS_DRIFT_COMBAT: "/Intrinsics/Drifter/Combat",
        LPS_DRIFT_RIDING: "/Intrinsics/Drifter/Riding",
        LPS_DRIFT_OPPORTUNITY: "/Intrinsics/Drifter/Opportunity",
        LPS_DRIFT_ENDURANCE: "/Intrinsics/Drifter/Endurance"
    };
    if (playerData) {
        var playerSkills =
            playerData.Results &&
            playerData.Results[0] &&
            playerData.Results[0].PlayerSkills;

        if (playerSkills) {
            Object.keys(SKILL_TO_UNIQUE_NAME).forEach(function (skillKey) {
                var rank = playerSkills[skillKey];
                if (rank === undefined) return;
                var uniqueName = SKILL_TO_UNIQUE_NAME[skillKey];
                setItemRank(uniqueName, rank);
            });
        }
};
})();
