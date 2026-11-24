function xpToMasteryRank(xp) {
	let mr = 0;
	// XP required for a rank is 2500 * (that MR squared)
	
	while ( mr < 30 ) { // because LR math is different
		const nextTarget = 2500 * (mr + 1) * (mr + 1);
		if  (xp > nextTarget) {
			mr++; // enough for next rank
		}
		else { // not enough for next rank
			return mr; 
		}
	}
	
	// Legendary ranks: 147500 XP each beyond MR 30
    let lrThreshold = 2500 * 30 * 30; // 2,250,000
    while (xp >= lrThreshold + 147500) {
        lrThreshold += 147500;
        mr++;
    }
	
	return mr; // only once there's no more possible ranks with the passed XP value
}

function xpToNextMR(xp) {
    var currentRank = xpToMasteryRank(xp);
    if (currentRank < 30) {
        return 2500 * (currentRank + 1) * (currentRank + 1) - xp;
    }
    var nextThreshold = 2500 * 30 * 30 + (currentRank - 30 + 1) * 147500;
    return nextThreshold - xp;
}

function setItemRank(uniqueName, rank) {
    var row = document.querySelector('.item-row[data-unique-name="' + uniqueName + '"]');
    if (!row) {
        console.log("[populate-tenno-data] No row found for uniqueName: " + uniqueName);
        return;
    }

    var levelInput = row.querySelector(".item-current-level");
    if (levelInput) {
        levelInput.value = rank;
        levelInput.dispatchEvent(new Event("change"));
    }
}
