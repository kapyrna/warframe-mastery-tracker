// build the manifests into cards on the main page
(function () {
	"use strict"; // form good habits

	// bring in page level elements and variables
	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
  	const listsContainer = document.getElementById("lists"); // progress list container
  	const placeholderElement = document.getElementById("list-placeholder"); // list placeholder text
	const statItemsCompleted = document.getElementById("stat-items-completed"); // overview completed count total
	const statItemsPossible = document.getElementById("stat-items-possible"); // overview possible count total
	const statXpTotal = document.getElementById("stat-xp-earned"); // overview xp earned total
	const statXpPossible = document.getElementById("stat-xp-possible"); // overview xp possible total
	const statMrPossible = document.getElementById("stat-mr-potential"); // overview mr possible value
	const statMrAchieved = document.getElementById("stat-mastery-rank"); // overview mr achieved
	const statXpToNextMr = document.getElementById("stat-xp-to-next-mr"); // overview remaining xp to next rank
	const importerMethod = localStorage.getItem(repositoryName + ":importerMethod");
	
	if (!listsContainer) return; // exit if the page already broke

	let overviewCompletedTotal = 0; // overview initial value
	let overviewPossibleTotal = 0;	// overview initial value
	let overviewXpTotal = 0;
	let overviewXpPossible = 0;

	// for assigning founder tag for filtering
	const founderItems = [
	    "/Lotus/Powersuits/Excalibur/ExcaliburPrime",
	    "/Lotus/Weapons/Tenno/Melee/LongSword/SkanaPrime",
		"/Lotus/Weapons/Tenno/Pistol/LatoPrime",
	];

	// for assigning variant tag to enable filtering
	const adversaryWeapons = [
	    // Kuva Lich weapons
	    "/Lotus/Weapons/Grineer/KuvaLich/",
	    "/Lotus/Weapons/Grineer/Melee/GrnKuvaLichScythe/",
	    "/Lotus/Weapons/Grineer/LongGuns/GrnKuvaLichRifle/",
	    "/Lotus/Weapons/Grineer/HeavyWeapons/GrnHeavyGrenadeLauncher",
	    "/Lotus/Weapons/Grineer/Bows/GrnBow/GrnBowWeapon",
	    // Tenet (Sister of Parvos) weapons
	    "/Lotus/Weapons/Corpus/BoardExec/",
	    "/Lotus/Weapons/Corpus/Pistols/CrpIgniterPistol/",
	    "/Lotus/Weapons/Corpus/Pistols/CrpBriefcaseAkimbo/",
	    "/Lotus/Weapons/Corpus/Melee/ShieldAndSword/CrpHammerShield/",
	    "/Lotus/Weapons/Corpus/Melee/CrpBriefcaseScythe/",
	    "/Lotus/Weapons/Corpus/Melee/CrpBriefcase2HKatana/",
	    "/Lotus/Weapons/Corpus/LongGuns/CrpBriefcaseLauncher/",
	    "/Lotus/Weapons/Tenno/Melee/Swords/CrpBigSlash/",
		// Coda (Technocyte) weapons
	    "/Lotus/Weapons/Infested/InfestedLich/",
	    // Paracesis
	    "/Lotus/Weapons/Orokin/BallasSword/BallasSwordWeapon",
	];

	// star chart lists
	const originRegions = [ // stage the regions within origin system
		"Mercury",
		"Venus",
		"Earth",
		"Mars",
		"Jupiter",
		"Saturn",
		"Uranus",
		"Neptune",
		"Pluto",
		"Ceres",
		"Eris",
		"Sedna",
		"Europa",
		// "Void",
		"Phobos",
		"Deimos",
		// "Lua",
		// "Kuva Fortress",
		// "Zariman",
	];

	// secondaries list is extra complicated
	const secondaryPrefixes = [ // DE put a lot more than secondaries in the secondaries datapath, so doing as narrow inclusions
		"/Lotus/Weapons/Tenno/",
		"/Lotus/Weapons/Corpus/Pistols/",
		"/Lotus/Weapons/Corpus/BoardExec/",
		"/Lotus/Weapons/Grineer/",
		"/Lotus/Weapons/Infested/Pistols/InfestedPistol",
		"/Lotus/Weapons/Infested/Pistols/InfestedDartPistol",
		"/Lotus/Weapons/Infested/Pistols/InfVomitGun",
		"/Lotus/Weapons/Infested/Pistols/InfUzi",
		"/Lotus/Weapons/Infested/Pistols/InfProximityStars",
		"/Lotus/Weapons/Infested/Pistols/InfBeamPistol",
		"/Lotus/Weapons/Infested/InfestedLich/",
		"/Lotus/Weapons/ClanTech/",
		"/Lotus/Weapons/Syndicates/",
		"/Lotus/Weapons/Lasria/",
		"/Lotus/Weapons/MK1Series/",
		"/Lotus/Weapons/Thanotech/",
		"/Lotus/Weapons/VoidTrader/VTDetron",
	];

	// kitguns prefixes to narrow down inside secondaries list
	const kitgunPrefixes = [
		"/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel",
		"/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/",
	];

	// zaws has three sublists and they are in the data as econdary not melee
	const zawPrefixes = [
		"/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip",
		"/Lotus/Weapons/Ostron/Melee/ModularMelee02/Tip",
		"/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips",
	];

	// amp prefixes for the modular, sirroco is separate
	const ampModularPrefixes = [
		    "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingBarrel",
		    "/Lotus/Weapons/Sentients/OperatorAmplifiers/Set1/Barrel",
		    "/Lotus/Weapons/Sentients/OperatorAmplifiers/Set2/Barrel",
		    "/Lotus/Weapons/Corpus/OperatorAmplifiers/Set1/Barrel",
	];

	/* const proximaRegions = [
		"Earth Proxima",
		"Venus Proxima",
		"Saturn Proxima",
		"Neptune Proxima",
		"Pluto Proxima",
		"Veil Proxima",
	]; */
	
	function updateOverviewItemCount(completedDelta, possibleDelta) {
		overviewCompletedTotal += completedDelta;
		overviewPossibleTotal += possibleDelta;
		if (statItemsCompleted) statItemsCompleted.textContent = overviewCompletedTotal;
		if (statItemsPossible) statItemsPossible.textContent = overviewPossibleTotal;
	}

	function updateOverviewXp(xpTotalDelta, xpPossibleDelta) {
	    overviewXpTotal += xpTotalDelta;
	    overviewXpPossible += xpPossibleDelta;
	    if (statXpTotal) statXpTotal.textContent = overviewXpTotal;
	    if (statXpPossible) statXpPossible.textContent = overviewXpPossible;
		if (statMrPossible) statMrPossible.textContent = xpToMasteryRank(overviewXpPossible);

		const currentMr = xpToMasteryRank(overviewXpTotal);
		if (statMrAchieved) statMrAchieved.textContent = currentMr;
		if (statXpToNextMr) statXpToNextMr.textContent = xpToNextMR(overviewXpTotal);
	}

	function createItemListHeader(details) {
		const headerRow = document.createElement("div");
		headerRow.className = "item-row item-row-header";
		
		const headerCheckbox = document.createElement("span");
		headerCheckbox.className = "item-checkbox";
		
		const headerName = document.createElement("span");
		headerName.className = "item-name";
		headerName.textContent = "Name";
		
		const headerLevel = document.createElement("span");
		headerLevel.className = "item-current-level numeric-cell";
		headerLevel.textContent = "Rank";
		
		const headerXp = document.createElement("span");
		headerXp.className = "item-current-xp numeric-cell";
		headerXp.textContent = "XP";
		
		headerRow.append(headerCheckbox, headerName, headerLevel, headerXp);
		details.append(headerRow);
	}
	
	async function createItemList(details, updateCount, updateXp, filenameCurrentCard, maxLevel, xpPerLevel, exportKey, itemType, uniqueNamePrefix, uniqueNameExcludePrefix){
		try {
			const fileLoadResponse = await fetch(filenameCurrentCard);
			if (!fileLoadResponse.ok) {
				throw new Error("Failed to load " + filenameCurrentCard);}
	
			const exportData = await fileLoadResponse.json();
			const cardItems = (exportData[exportKey] || []).filter(function (item) {
				if (item.productCategory !== itemType) return false; // filter to specified and exclude others like warframes versus archwing/necramech
				let prefixes = undefined;
				if (uniqueNamePrefix !== undefined) { // if we're including by pattern to narrow down like in secondaries
					if (Array.isArray(uniqueNamePrefix)) { // check for array and store
			            prefixes = uniqueNamePrefix;
			        } else { // otherwise just take the string
			            prefixes = [uniqueNamePrefix];
			        }
					if (!prefixes.some(function (p) { return item.uniqueName.startsWith(p); })) return false;
				}
				if (uniqueNameExcludePrefix !== undefined && item.uniqueName.startsWith(uniqueNameExcludePrefix)) return false; // filter out what we know doesn't belong in the list
				// filter down K-Drives to deck only
				if (prefixes !== undefined && prefixes.some(function (p) { return p.includes("Hoverboard"); })) {
					if (!item.uniqueName.includes("Deck")) return false;
				}
				return true;
			});
					
			let completedCount = 0; // baseline to be incremented when loading player data
			let earnedXpTotal = 0;
			let possibleXpTotal = 0;
			const totalCount = cardItems.length;
				
			cardItems.sort(function (firstItem, secondItem) {
				return firstItem.name.localeCompare(secondItem.name);
			});
			
			for (const cardItem of cardItems) {
				const currentLevel = 0;
				const itemRow = createItemRow(cardItem.name, cardItem.uniqueName, currentLevel, xpPerLevel, maxLevel, updateCount, updateXp);
				details.append(itemRow);
				possibleXpTotal += ( xpPerLevel * maxLevel );
			}
	
			updateCount(completedCount, totalCount);
			updateXp(earnedXpTotal, possibleXpTotal);
			
			} catch (error) {
				console.error("createItemList error:", error);
				details.append("Failed to load " + exportKey + " from " + filenameCurrentCard);
			}
		}
	
	function createCategoryCard(headingText, hasSubcategories, updateParentCounts, updateParentXp) {
	    const section = document.createElement("section");
	    section.className = "card";
		const details = document.createElement("details");
		details.className = "mastery-panel";
		// details.open = hasSubcategories === true; // un-comment if unfurling parent comtainers is desired
		const summary = document.createElement("summary");
		details.append(summary);
		
		const headingSpan = document.createElement("span");
		headingSpan.textContent = headingText;

		const separatorSpan = document.createElement("span");
		separatorSpan.className = "summary-separator";
		separatorSpan.textContent = " | ";

		const countSpan = document.createElement("span");
		countSpan.className = "category-count";
		countSpan.textContent = "0/0";

		const xpSpan = document.createElement("span");
		xpSpan.className = "category-xp sentence";
		xpSpan.textContent = "0 XP";
		
		summary.append(headingSpan, separatorSpan, countSpan, separatorSpan.cloneNode(true), xpSpan);
	    section.append(details);

		// initial counts 0
		let cardCompletedTotal = 0;
		let cardPossibleTotal = 0;
		let cardEarnedXp = 0
		let cardPossibleXp = 0

		// adjust running totals on each row append
		function updateCount(completedDelta, possibleDelta) {
			cardCompletedTotal += completedDelta;
			cardPossibleTotal += possibleDelta;
			countSpan.textContent = cardCompletedTotal + "/" + cardPossibleTotal;
			updateParentCounts(completedDelta, possibleDelta);
		}
		// adjust possible XP on each row append
		function updateXp(earnedXp, possibleXp) {
			cardEarnedXp += earnedXp;
			cardPossibleXp += possibleXp;
			xpSpan.textContent = cardEarnedXp + "/" + cardPossibleXp + " XP";
			updateParentXp(earnedXp, possibleXp);
		}

		if (hasSubcategories) {
			details.classList.add("has-subcategories"); // skip the item table header
		}
		else createItemListHeader(details);
		
	    return {section, details , updateCount, updateXp};
	}

	// template for each item's row
	function createItemRow(itemName, uniqueName, currentLevel, xpPerLevel, maxLevel, updateCount, updateXp) {
		const row = document.createElement("div");
		row.className = "item-row";
		row.dataset.uniqueName = uniqueName;
		row.dataset.xpPerLevel = xpPerLevel;
		row.dataset.maxLevel = maxLevel;
	
		// checkbox
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "item-checkbox";
		checkbox.checked = currentLevel >= maxLevel;
		checkbox.setAttribute("aria-label", itemName);

		// name
		const nameElement = document.createElement("span");
		nameElement.className = "item-name";
		nameElement.textContent = itemName;
		if (itemName.startsWith("<ARCHWING> ")) {
   			nameElement.textContent = itemName.slice("<ARCHWING> ".length);
		}
		
		// Founders' check
		const isFounder = founderItems.includes(uniqueName);
		if (isFounder) {
			// row.classList.add("item-founder"); use for variant filtering later
			nameElement.textContent += " (Founders exclusive)";
		}

		// Adversary check to bump up the max rank to 40
		const isAdversary = adversaryWeapons.some(function (p) { return uniqueName.startsWith(p); });
		if (isAdversary) {
		    // row.classlist.add("item-adversary"); use for variant filtering later
			maxLevel = 40;
		}

		// currentl level, only numeric user input
		const currentLevelInput = document.createElement("input");
		currentLevelInput.type = "number";
		currentLevelInput.className = "item-current-level numeric-cell";
		currentLevelInput.value = currentLevel;
		currentLevelInput.min = 0;
		currentLevelInput.max = maxLevel;

		// because we know this per item
		const maxLevelSuffix = document.createElement("span");
		maxLevelSuffix.className = "item-max-level-suffix";
		maxLevelSuffix.textContent = "/" + maxLevel;

		// make the cell with entry box plus suffix
		const levelWrapper = document.createElement("span");
		levelWrapper.className = "item-level-wrapper";
		levelWrapper.append(currentLevelInput, maxLevelSuffix);

		// earned xp value math
		const currentXpElement = document.createElement("span");
		currentXpElement.className = "item-current-xp numeric-cell";
		currentXpElement.textContent = currentLevel * xpPerLevel;

		// possible xp value math
		const maxXpElement = maxLevel * xpPerLevel;
		const xpSeparator = document.createElement("span");
		xpSeparator.className = "item-xp-separator";
		xpSeparator.textContent = "/";
		const maxXpNumber = document.createElement("span");
		maxXpNumber.className = "item-max-xp-number numeric-cell";
		maxXpNumber.textContent = maxXpElement;

		// xp values into cell
		const xpWrapper = document.createElement("span");
		xpWrapper.className = "item-xp-wrapper";
		xpWrapper.append(currentXpElement, xpSeparator, maxXpNumber);

		// doer for maintaining state between checkboxes and earned rank numerics
		function applyRankChange() {
		    const newLevel = Math.min(Math.max(parseInt(currentLevelInput.value) || 0, 0), maxLevel);
		    currentLevelInput.value = newLevel;
		
		    const oldXp = parseInt(currentXpElement.textContent) || 0;
		    const newXp = newLevel * xpPerLevel;
		    currentXpElement.textContent = newXp;
		
		    const wasCompleted = oldXp >= maxLevel * xpPerLevel;
		    const isCompleted = newLevel >= maxLevel;
		    checkbox.checked = isCompleted;
			currentLevelInput.disabled = isCompleted;
		
		    const xpDelta = newXp - oldXp;
		    let completedDelta = 0;
		    if (isCompleted && !wasCompleted) { completedDelta = 1; }
		    if (!isCompleted && wasCompleted) { completedDelta = -1; }
		
		    updateXp(xpDelta, 0);
		    updateCount(completedDelta, 0);
		}

		if (importerMethod !== "none") { // disallow manual entry when using API import
		    checkbox.disabled = true;
		    currentLevelInput.disabled = true;
			currentLevelInput.title = "Rank is set automatically from imported data";
		}
		
		// listener for user numeric input
		currentLevelInput.addEventListener("change", function () {
		    applyRankChange();
		});

		// listener for checkbox toggle
		checkbox.addEventListener("change", function () {
		    if (checkbox.checked) {
		        currentLevelInput.value = maxLevel;
		    } else {
		        currentLevelInput.value = 0;
		    }
		    applyRankChange();
		});

		// build row
		row.append(checkbox, nameElement, levelWrapper, xpWrapper);
		return row;
	}

	// star chart nodes are handled differentlyt than item ranks
	function createNodeRow(nodeName, nodeUniqueName, nodeMasteryReq, nodeXp) {
	    const row = document.createElement("div");
	    row.className = "node-row";
		row.dataset.uniqueName = nodeUniqueName;
		row.dataset.masteryReq = nodeMasteryReq;
	
	    const checkboxNormal = document.createElement("input");
	    checkboxNormal.type = "checkbox";
	    checkboxNormal.className = "item-checkbox";
	    checkboxNormal.setAttribute("aria-label", nodeName + " (Normal)");

		const checkboxSteelPath = document.createElement("input");
	    checkboxSteelPath.type = "checkbox";
	    checkboxSteelPath.className = "item-checkbox";
	    checkboxSteelPath.setAttribute("aria-label", nodeName + " (Steel Path)");

		if (importerMethod !== "none") { // disallow manual entry when using API import
		    checkboxNormal.disabled = true;
			checkboxSteelPath.disabled = true;
		}
		
		const checkboxWrapper = document.createElement("div");
		checkboxWrapper.className = "node-checkbox-group";
		checkboxWrapper.append(checkboxNormal, checkboxSteelPath);
		row.append(checkboxWrapper);
	
	    const nameElement = document.createElement("span");
	    nameElement.className = "item-name";
	    nameElement.textContent = nodeName;
	    row.append(nameElement);

		// XP: each node can be cleared twice (Normal + Steel Path)
	    const xpPerClear = nodeXp ?? 0; //fallback to 0
	    let clearedCount = 0;
	    const xpPossible = xpPerClear * 2;
	
	    const xpEarnedSpan = document.createElement("span");
	    xpEarnedSpan.className = "node-xp-earned";
	    xpEarnedSpan.textContent = "0";
	
	    const xpSeparatorSpan = document.createElement("span");
	    xpSeparatorSpan.textContent = "/";
	
	    const xpPossibleSpan = document.createElement("span");
	    xpPossibleSpan.className = "node-xp-possible";
	    xpPossibleSpan.textContent = xpPossible;
	
	    const xpWrapper = document.createElement("div");
	    xpWrapper.className = "node-xp";
	    xpWrapper.append(xpEarnedSpan, xpSeparatorSpan, xpPossibleSpan);
	    row.append(xpWrapper);
		
	    return row;
	}
	
	function createNodeList(parentDetails, notifyParent, notifyParentXp, dataPath, exportKey, productCategory, systemName, hasRegions) {
	    return Promise.all([
        	fetch(dataPath).then(function (response) {
	            if (!response.ok) throw new Error("Failed to load " + dataPath);
	            return response.json();
	        }),
			fetch("data/ExportNodeXp_en.json").then(function (response) {
	            if (!response.ok) return {};
	            return response.json();
	        })
		])
	        .then(function ([exportData, xpData]) {
				const nodeXpMap = xpData.ExportNodeXp || {};
				
	            const nodeItems = (exportData[exportKey] || []).filter(function (item) {
	                if (productCategory !== undefined && item.productCategory !== productCategory) return false;
	                if (systemName !== undefined && item.systemName !== systemName) return false;
	                return true;
	            });
	
	            nodeItems.sort(function (a, b) {
				    return a.missionIndex - b.missionIndex;
				});
	
	            const completedCount = 0;
	            const totalCount = nodeItems.length;
				
				if (hasRegions) {
					const systemHeader = document.createElement("div");
					systemHeader.className = "node-system-header";
					systemHeader.textContent = systemName;
					parentDetails.append(systemHeader);
				}
				
				if (!parentDetails.querySelector(".node-list-header")) {
					const listHeader = document.createElement("div");
					listHeader.className = "node-list-header";
					const clearedHeader = document.createElement("span");
					clearedHeader.textContent = "Cleared";
					const nameHeader = document.createElement("span");
					nameHeader.textContent = "Node";
					const xpHeader = document.createElement("span");
					xpHeader.textContent = "XP";
					listHeader.append(clearedHeader, nameHeader, xpHeader);
					parentDetails.append(listHeader);
				}

				let totalXp = 0;
	            for (const node of nodeItems) {
					const xp = nodeXpMap[node.uniqueName] ?? 0;
					if (xp === 0) continue;
					totalXp += xp * 2; // Normal + Steel Path
					parentDetails.append(createNodeRow(node.name, node.uniqueName, node.masteryReq, xp));
	            }
	
	            notifyParent(completedCount, totalCount);
				notifyParentXp(0, totalXp);
	        });
	}

	// build layout, pass second variable of true if category has subcategories 
	const { section: warframesSection, details: warframesDetails, updateCount: updateWarframesCount, updateXp: updateWarframesXp } = createCategoryCard("Warframes", false, updateOverviewItemCount, updateOverviewXp);
	const { section: weaponsSection, details: weaponsDetails, updateCount: updateWeaponsCount, updateXp: updateWeaponsXp } = createCategoryCard("Weapons", true, updateOverviewItemCount, updateOverviewXp);
	const { section: companionsSection, details: companionsDetails, updateCount: updateCompanionsCount, updateXp: updateCompanionsXp } = createCategoryCard("Companions", true, updateOverviewItemCount, updateOverviewXp);
	const { section: vehiclesSection, details: vehiclesDetails, updateCount: updateVehiclesCount, updateXp: updateVehiclesXp } = createCategoryCard("Vehicles", true, updateOverviewItemCount, updateOverviewXp);
	const { section: intrinsicsSection, details: intrinsicsDetails, updateCount: updateIntrinsicsCount, updateXp: updateIntrinsicsXp } = createCategoryCard("Intrinsics", true, updateOverviewItemCount, updateOverviewXp);
	const { section: starchartSection, details: starchartDetails, updateCount: updateStarchartCount, updateXp: updateStarchartXp } = createCategoryCard("Star Chart", true, updateOverviewItemCount, updateOverviewXp);
	listsContainer.replaceChildren(
		warframesSection,
		weaponsSection,
		companionsSection,
		vehiclesSection,
		intrinsicsSection,
		starchartSection);
	
	// build subcategories of weapons
	const { section: primarySection, details: primaryDetails, updateCount: updatePrimaryCount, updateXp: updatePrimariesXp } = createCategoryCard("Primary", false, updateWeaponsCount, updateWeaponsXp);
	const { section: secondarySection, details: secondaryDetails, updateCount: updateSecondaryCount, updateXp: updateSecondariesXp } = createCategoryCard("Secondary", false, updateWeaponsCount, updateWeaponsXp);
	const { section: meleeSection, details: meleeDetails, updateCount: updateMeleeCount, updateXp: updateMeleeXp } = createCategoryCard("Melee", false, updateWeaponsCount, updateWeaponsXp);
	const { section: archgunSection, details: archgunDetails, updateCount: updateArchgunCount, updateXp: updateArchgunXp } = createCategoryCard("Archgun", false, updateWeaponsCount, updateWeaponsXp);
	const { section: archmeleeSection, details: archmeleeDetails, updateCount: updateArchmeleeCount, updateXp: updateArchmeleeXp } = createCategoryCard("Archmelee", false, updateWeaponsCount, updateWeaponsXp);
	const { section: kitgunsSection, details: kitgunsDetails, updateCount: updateKitgunsCount, updateXp: updateKitgunsXp } = createCategoryCard("Kitguns", false, updateWeaponsCount, updateWeaponsXp);
	const { section: zawsSection, details: zawsDetails, updateCount: updateZawsCount, updateXp: updateZawsXp } = createCategoryCard("Zaws", false, updateWeaponsCount, updateWeaponsXp);
	const { section: ampsSection, details: ampsDetails, updateCount: updateAmpsCount, updateXp: updateAmpsXp } = createCategoryCard("Amps", false, updateWeaponsCount, updateWeaponsXp);
	const { section: companionWeaponsSection, details: companionWeaponsDetails, updateCount: updateCompanionWeaponsCount, updateXp: updateCompanionWeaponsXp } = createCategoryCard("Companion Weapons", false, updateWeaponsCount, updateWeaponsXp);
	weaponsDetails.append(primarySection, secondarySection, meleeSection, archgunSection, archmeleeSection, kitgunsSection, zawsSection, ampsSection, companionWeaponsSection);
	
	// companions subcategory cards
	const { section: sentinelsSection, details: sentinelsDetails, updateCount: updateSentinelsCount, updateXp: updateSentinelsXp } = createCategoryCard("Sentinels", false, updateCompanionsCount, updateCompanionsXp);
	const { section: beastsSection, details: beastsDetails, updateCount: updateBeastsCount, updateXp: updateBeastsXp } = createCategoryCard("Beasts", false, updateCompanionsCount, updateCompanionsXp);
	const { section: moasSection, details: moasDetails, updateCount: updateMoasCount, updateXp: updateMoasXp } = createCategoryCard("MOAs", false, updateCompanionsCount, updateCompanionsXp);
	const { section: houndsSection, details: houndsDetails, updateCount: updateHoundsCount, updateXp: updateHoundsXp } = createCategoryCard("Hounds", false, updateCompanionsCount, updateCompanionsXp);
	companionsDetails.append(sentinelsSection, beastsSection, moasSection, houndsSection);

	// vehicles subcategory cards
	const { section: archwingSection, details: archwingDetails, updateCount: updateArchwingCount, updateXp: updateArchwingXp } = createCategoryCard("Archwings", false, updateVehiclesCount, updateVehiclesXp);
	const { section: necramechSection, details: necramechDetails, updateCount: updateNecramechCount, updateXp: updateNecramechXp } = createCategoryCard("Necramechs", false, updateVehiclesCount, updateVehiclesXp);
	const { section: kDriveSection, details: kDriveDetails, updateCount: updateKDriveCount, updateXp: updateKDriveXp } = createCategoryCard("K-Drives", false, updateVehiclesCount, updateVehiclesXp);
	const { section: plexusSection, details: plexusDetails, updateCount: updatePlexusCount, updateXp: updatePlexusXp } = createCategoryCard("Plexus", false, updateVehiclesCount, updateVehiclesXp); // railjack plexus isn't a vehicle apparently
	vehiclesDetails.append(archwingSection, necramechSection, kDriveSection, plexusSection);

	// intrinsics subcategory cards
	const { section: railjackSection, details: railjackDetails, updateCount: updateRailjackCount, updateXp: updateRailjackXp } = createCategoryCard("Railjack", false, updateIntrinsicsCount, updateIntrinsicsXp);
	const { section: drifterSection, details: drifterDetails, updateCount: updateDrifterCount, updateXp: updateDrifterXp } = createCategoryCard("Drifter", false, updateIntrinsicsCount, updateIntrinsicsXp);
	intrinsicsDetails.append(railjackSection, drifterSection);

	// star chart cards
	const starchartNote = document.createElement("p");
	starchartNote.textContent = "Nodes are organized by system and region. Systems that do not award mastery points are excluded from this list. The first checkbox is for normal completion and the second checkbox is for Steel Path.";
	starchartDetails.append(starchartNote);
	// separate by system then by region
	const { section: originSection, details: originDetails, updateCount: updateOriginCount, updateXp: updateOriginNodesXp } = createCategoryCard("Origin System", true, updateStarchartCount, updateStarchartXp);
	// card per region
	const regionLoads = [];
	for (const region of originRegions) {
		const { section: regionSection, details: regionDetails, updateCount: updateRegionCount, updateXp: updateRegionXp } = createCategoryCard(region, true, updateOriginCount, updateOriginNodesXp);
		originDetails.append(regionSection);
		regionLoads.push(
        createNodeList(regionDetails, updateRegionCount, updateRegionXp, "data/ExportRegions_en.json", "ExportRegions", undefined, region, false)
            .catch(function (error) { regionDetails.append("Failed to load " + region + " data."); }),
        createNodeList(regionDetails, updateRegionCount, updateRegionXp, "data/ExportJunctions_en.json", "ExportJunctions", undefined, region, false)
            .catch(function (error) { regionDetails.append("Failed to load " + region + " junction data."); })

		);
	}
	/* createNodeList(regionDetails, updateRegionCount, "data/ExportProxima_en.json", "ExportProxima", "ProximaNode", region, false)
		.catch(function (error) { regionDetails.append("Failed to load " + region + " data."); }), railjack missions currently do not award mastery
	createNodeList(duviriDetails, updateDuviriCount, "data/ExportRegions_en.json", "ExportRegions", undefined, "Duviri", false)
		.catch(function (error) { duviriDetails.append("Failed to load Duviri data."); });
	createNodeList(hollvaniaDetails, updateHollvaniaCount, "data/ExportRegions_en.json", "ExportRegions", undefined, "Höllvania", false)
		.catch(function (error) { hollvaniaDetails.append("Failed to load Höllvania data."); });
	createNodeList(darkRefractoryDetails, updateDarkRefractoryCount, "data/ExportRegions_en.json", "ExportRegions", undefined, "Dark Refractory, Deimos", false)
		.catch(function (error) { darkRefractoryDetails.append("Failed to load Dark Refractory data."); });
	createNodeList(tauDetails, updateTauCount, "data/ExportTau_en.json", "ExportTau", "TauNode", false)
		.catch(function (error) { tauDetails.append("Failed to load Tau data."); }); */
	//  const { section: proximaSection, details: proximaDetails, updateCount: updateProximaCount, updateXp: updateProximaNodesXp } = createCategoryCard("Empyrean Proxima", true, updateStarchartCount, updateStarchartXp);
	// const { section: duviriSection, details: duviriDetails, updateCount: updateDuviriCount, updateXp: updateDuviriNodesXp } = createCategoryCard("Duviri", true, updateStarchartCount, updateStarchartXp);
	// const { section: hollvaniaSection, details: hollvaniaDetails, updateCount: updateHollvaniaCount, updateXp: updateHollvaniaNodesXp } = createCategoryCard("Höllvania", true, updateStarchartCount, updateStarchartXp);
	// const { section: darkRefractorySection, details: darkRefractoryDetails, updateCount: updateDarkRefractoryCount, updateXp: updateDarkRefactoryNodesXp } = createCategoryCard("Dark Refractory", true, updateStarchartCount, updateStarchartXp);
	// const { section: tauSection, details: tauDetails, updateCount: updateTauCount, updateXp: updateTauNodesXp } = createCategoryCard("Tau", true, updateStarchartCount, updateStarchartXp);
	/* for (const region of proximaRegions) {
		    const { section: regionSection, details: regionDetails, updateCount: updateRegionCount } = createCategoryCard(region, false, updateProximaCount, updateProximaNodesXp);
		    proximaDetails.append(regionSection); railjack missions currently do not award mastery */
	starchartDetails.append(
		originSection,
		// proximaSection,
		// duviriSection,
		// hollvaniaSection,
		// darkRefractorySection,
		// tauSection
	);

	const allLoads = [
		// bring in list of warframes
		createItemList(warframesDetails, updateWarframesCount, updateWarframesXp, "data/ExportWarframes_en.json", 30, 200, "ExportWarframes", "Suits")
			.catch(function (error) { warframesDetails.append("Failed to load Warframe data."); }),
		
		// build each weaspon subcategory
		createItemList(primaryDetails, updatePrimaryCount, updatePrimariesXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "LongGuns")
			.catch(function (error) { primaryDetails.append("Failed to load Primary data."); }),
		createItemList(secondaryDetails, updateSecondaryCount, updateSecondariesXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "Pistols", secondaryPrefixes)
			.catch(function (error) { secondaryDetails.append("Failed to load Secondary data."); }),
		// melee
		createItemList(meleeDetails, updateMeleeCount, updateMeleeXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "Melee")
			.catch(function (error) { meleeDetails.append("Failed to load Melee data."); }),
		// archguns
		createItemList(archgunDetails, updateArchgunCount, updateArchgunXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "SpaceGuns")
			.catch(function (error) { archgunDetails.append("Failed to load Archgun data."); }),
		// archmelee
		createItemList(archmeleeDetails, updateArchmeleeCount, updateArchmeleeXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "SpaceMelee")
			.catch(function (error) { archmeleeDetails.append("Failed to load Archmelee data."); }),
		// kitguns
		createItemList(kitgunsDetails, updateKitgunsCount, updateKitgunsXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "Pistols", kitgunPrefixes)
		  .catch(function (error) { kitgunsDetails.append("Failed to load Kitgun data."); }),
		// zaws
		createItemList(zawsDetails, updateZawsCount, updateZawsXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "Pistols", zawPrefixes)
			.catch(function (error) { zawsDetails.append("Failed to load Zaw strike data."); }),
		// amps
		createItemList(ampsDetails, updateAmpsCount, updateAmpsXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "Pistols", ampModularPrefixes)
			.catch(function (error) { ampsDetails.append("Failed to load Amp prism data."); }),
		createItemList(ampsDetails, updateAmpsCount, updateAmpsXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "OperatorAmps") // just sirocco
			.catch(function (error) { ampsDetails.append("Failed to load Amps data."); }),
		// companion weapons includes all robots
		createItemList(companionWeaponsDetails, updateCompanionWeaponsCount, updateCompanionWeaponsXp, "data/ExportWeapons_en.json", 30, 100, "ExportWeapons", "SentinelWeapons")
			.catch(function (error) { companionWeaponsDetails.append("Failed to load Sentinel Weapons data."); }),

		// companions lists
		createItemList(sentinelsDetails, updateSentinelsCount, updateSentinelsXp, "data/ExportSentinels_en.json", 30, 200, "ExportSentinels", "Sentinels")
			.catch(function (error) { sentinelsDetails.append("Failed to load Sentinels data."); }),
		createItemList(beastsDetails, updateBeastsCount, updateBeastsXp, "data/ExportSentinels_en.json", 30, 200, "ExportSentinels", "KubrowPets")
			.catch(function (error) { beastsDetails.append("Failed to load Beasts data."); }),
		createItemList(moasDetails, updateMoasCount, updateMoasXp, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetHead") // somewhy these are secondary weapons
			.catch(function (error) { moasDetails.append("Failed to load MOA data."); }),
		createItemList(houndsDetails, updateHoundsCount, updateHoundsXp, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHead") // somewhy these are secondary weapons
			.catch(function (error) { houndsDetails.append("Failed to load Hound data."); }),

		// vehicles
		// archwings
		createItemList(archwingDetails, updateArchwingCount, updateArchwingXp, "data/ExportWarframes_en.json", 30, 200, "ExportWarframes", "SpaceSuits")
			.catch(function (error) { archwingDetails.append("Failed to load Archwing data."); }),
		// necramechs, note they go up to 40 with 5 forma
		createItemList(necramechDetails, updateNecramechCount, updateNecramechXp, "data/ExportWarframes_en.json", 40, 200, "ExportWarframes", "MechSuits")
			.catch(function (error) { necramechDetails.append("Failed to load Necramech data."); }),
		// kdrives
		createItemList(kDriveDetails, updateKDriveCount, updateKDriveXp, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts/PartComponents")
			.catch(function (error) { kDriveDetails.append("Failed to load K-Drive data."); }),
		// railjack plexus not found in manifests, using placeholder file 
		createItemList(plexusDetails, updatePlexusCount, updatePlexusXp, "data/ExportPlexus_en.json", 30, 200, "ExportPlexus", "RailjackPlexus")
			.catch(function (error) { plexusDetails.append("Failed to load Plexus data."); }),
		
		// intrinsics not found in manifests yet, using placeholder file
		createItemList(railjackDetails, updateRailjackCount, updateRailjackXp, "data/ExportIntrinsics_en.json", 10, 1500, "ExportIntrinsics", "RailjackIntrinsics")
			.catch(function (error) { railjackDetails.append("Failed to load Railjack intrinsics data."); }),
		createItemList(drifterDetails, updateDrifterCount, updateDrifterXp, "data/ExportIntrinsics_en.json", 10, 1500, "ExportIntrinsics", "DrifterIntrinsics")
			.catch(function (error) { drifterDetails.append("Failed to load Drifter intrinsics data."); }),

		// star chart nodes loaded above
		...regionLoads,
	];

	Promise.all(allLoads).then(function () {
		document.dispatchEvent(new Event("mastery-sources-ready")); // ready to start loading tenno progress
		document.documentElement.dataset.masterySourcesReady = "true"; // go-time for loading tenno progress
		console.log("[populate-mastery-sources] All XP sources loaded.");
	});
})();
