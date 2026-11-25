(function () {
	"use strict";

	var repoName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
	var storageKeyFetchedImport = repoName + ":tennoData";
	var storageKeyNoImport = repoName + ":maraData";

	// Overview elements
	var statItemsCompleted = document.getElementById("stat-items-completed");
	var statXpEarned = document.getElementById("stat-xp-earned");
	var statMasteryRank = document.getElementById("stat-mastery-rank");
	var statXpToNextMr = document.getElementById("stat-xp-to-next-mr");
	
	var playerData = null;

	try {
		var raw = localStorage.getItem(storageKeyFetchedImport);
		if (!raw) {
			console.log("[populate-tenno-data] No player JSON found in localStorage.");
		} else {
			playerData = JSON.parse(raw);
			console.log("[populate-tenno-data] Player JSON loaded successfully.");
			console.log("[populate-tenno-data] Transference stream strong for ", playerData.Results && playerData.Results[0] && playerData.Results[0].DisplayName);
		}
	} catch (e) {
		console.error("[populate-tenno-data] Failed to load player JSON:", e);
	}
	
	var playerIntrinsics = null;
	var playerMissions = [];
	
	if (playerData) {
		var displayName =
			playerData.Results &&
			playerData.Results[0] &&
			playerData.Results[0].DisplayName;

		playerIntrinsics = playerData.Results &&
			playerData.Results[0] &&
			playerData.Results[0].PlayerSkills;
		console.log("[populate-tenno-data] playerIntrinsics:", playerIntrinsics);

		playerMissions = (
			playerData.Results && 
			playerData.Results[0] && 
			playerData.Results[0].Missions) || [];  
	
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
	var INTRINSICS_TO_UNIQUE_NAME = { // PlayerSkills key → intrinsic uniqueName
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
	
	function applyIntrinsics() {
		if (!playerIntrinsics) return;
		console.log("[populate-tenno-data] Beginning Intrinsics progress.");
		console.log("[populate-tenno-data] Intrinsics rows in DOM:", document.querySelectorAll('.item-row[data-unique-name^="/Intrinsics/"]').length);
		Object.keys(INTRINSICS_TO_UNIQUE_NAME).forEach(function (intrinsicsKey) {
			var rank = playerIntrinsics[intrinsicsKey];
			if (rank === undefined) return;
			var uniqueName = INTRINSICS_TO_UNIQUE_NAME[intrinsicsKey];
			setItemRank(uniqueName, rank);
		});
		console.log("[populate-tenno-data] Intrinsics progress complete.");
	}

	function applyNodes() {
		if (!playerData) return;
		console.log("[populate-tenno-data] Beginning node progress. Missions:", playerMissions.length);
		playerMissions.forEach(function (mission) {
			if (!mission.Tag || (mission.Completes || 0) < 1) return;
			var row = document.querySelector('.node-row[data-unique-name="' + mission.Tag + '"]');
			if (!row) return;
			var checkboxes = row.querySelectorAll('.item-checkbox');
			if (checkboxes[0]) checkboxes[0].checked = true;
		});
		console.log("[populate-tenno-data] Node progress complete.");
	}
	
	if (document.documentElement.dataset.masterysourcesready === "true") {
		console.log("[populate-tenno-data] Sources already ready, applying intrinsics now.");
		applyIntrinsics(); // already fired, run now
		applyNodes();
	} else {
		console.warn("[populate-tenno-data] Waiting for mastery-sources-ready event.");
		document.addEventListener("mastery-sources-ready", function () {
			applyIntrinsics();
			applyNodes();
		});
	}
})();
