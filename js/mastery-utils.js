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

function itemXpToRank(itemType, xp) {
    // Warframes and companions: cumulative XP = 1000 * rank^2, max rank 30
    const warframeTypes = [
        "/Lotus/Powersuits/",
        "/Lotus/Types/Sentinels/",
        "/Lotus/Types/Friendly/Pets/",
        "/Lotus/Types/Vehicles/Hoverboard/",
        "/Lotus/Powersuits/SpaceSuits/",
    ];
    // Necramechs: cumulative XP = 2000 * rank^2, max rank 40
    const necramechTypes = [
        "/Lotus/Powersuits/MechSuits/",
    ];
    // Adversary weapons (Kuva, Tenet, Coda, Paracesis): same formula as weapons but max rank 40
    const adversaryTypes = [
        "/Lotus/Weapons/Grineer/KuvaLich/",
        "/Lotus/Weapons/Grineer/Melee/GrnKuvaLichScythe/",
        "/Lotus/Weapons/Grineer/LongGuns/GrnKuvaLichRifle/",
        "/Lotus/Weapons/Grineer/HeavyWeapons/GrnHeavyGrenadeLauncher",
        "/Lotus/Weapons/Grineer/Bows/GrnBow/GrnBowWeapon",
        "/Lotus/Weapons/Corpus/BoardExec/",
        "/Lotus/Weapons/Corpus/Pistols/CrpIgniterPistol/",
        "/Lotus/Weapons/Corpus/Pistols/CrpBriefcaseAkimbo/",
        "/Lotus/Weapons/Corpus/Melee/ShieldAndSword/CrpHammerShield/",
        "/Lotus/Weapons/Corpus/Melee/CrpBriefcaseScythe/",
        "/Lotus/Weapons/Corpus/Melee/CrpBriefcase2HKatana/",
        "/Lotus/Weapons/Corpus/LongGuns/CrpBriefcaseLauncher/",
        "/Lotus/Weapons/Tenno/Melee/Swords/CrpBigSlash/",
        "/Lotus/Weapons/Infested/InfestedLich/",
        "/Lotus/Weapons/Orokin/BallasSword/BallasSwordWeapon",
    ];

    var maxRank, xpPerRankSquared;

    if (necramechTypes.some(function (p) { return itemType.startsWith(p); })) {
        maxRank = 40;
        xpPerRankSquared = 2000; // cumulative = 2000 * rank^2
    } else if (warframeTypes.some(function (p) { return itemType.startsWith(p); })) {
        maxRank = 30;
        xpPerRankSquared = 1000; // cumulative = 1000 * rank^2
    } else if (adversaryTypes.some(function (p) { return itemType.startsWith(p); })) {
        maxRank = 40;
        xpPerRankSquared = 500; // cumulative = 500 * rank^2
    } else {
        // all other weapons
        maxRank = 30;
        xpPerRankSquared = 500; // cumulative = 500 * rank^2
    }

    var rank = Math.min(Math.floor(Math.sqrt(xp / xpPerRankSquared)), maxRank);
    return rank;
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
