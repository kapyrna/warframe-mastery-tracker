function xpToMasteryRank(xp) {
	let mr = 0;
	let xpTotalTarget = 2500; // inital needed for next rank
	// XP required for a rank is 2500 * (that MR squared)
	
	while ( mr < 30 ) { // because LR math is different
		if  (xp > xpTotalTarget) {
			mr++; // enough for next rank
			xpTotalTarget = 2500 * mr * mr; // bump up to the next target
		}
	else return mr; // not enough to hit the next rank
	}
	return mr; // only once there's no more possible ranks with the passed XP value, LRs not handled yet
}

function xpToNextMR(xp) {
    var currentRank = xpToMasteryRank(xp);
    if (currentRank < 30) {
        return 2500 * (currentRank + 1) * (currentRank + 1) - xp;
    }
    var nextThreshold = 2500 * 30 * 30 + (currentRank - 30 + 1) * 147500;
    return nextThreshold - xp;
}
