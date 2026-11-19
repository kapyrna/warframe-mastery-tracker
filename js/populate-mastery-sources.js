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
	
	if (!listsContainer) return; // exit if the page already broke

	let overviewCompletedTotal = 0; // overview initial value
	let overviewPossibleTotal = 0;	// overview initial value
	let overviewXpTotal = 0;
	let overviewXpPossible = 0;

	const founderItems = [
	    "/Lotus/Powersuits/Excalibur/ExcaliburPrime",
	    "/Lotus/Weapons/Tenno/Melee/LongSword/SkanaPrime",
		"/Lotus/Weapons/Tenno/Pistol/LatoPrime",
	];

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
	
	async function createItemList(details, updateCount, filenameCurrentCard, maxLevel, xpPerLevel, exportKey, itemType, uniqueNamePrefix, uniqueNameExcludePrefix){
		try {
		const fileLoadResponse = await fetch(filenameCurrentCard);
		if (!fileLoadResponse.ok) {
			throw new Error("Failed to load " + filenameCurrentCard);}

		const exportData = await fileLoadResponse.json();
		const cardItems = (exportData[exportKey] || []).filter(function (item) {
			if (item.productCategory !== itemType) return false; // filter to specified and exclude others like warframes versus archwing/necramech
			if (uniqueNamePrefix !== undefined) { // if we're including by pattern to narrow down like in secondaries
				const prefixes = Array.isArray(uniqueNamePrefix) ? uniqueNamePrefix : [uniqueNamePrefix];
				if (!prefixes.some(function (p) { return item.uniqueName.startsWith(p); })) return false;
			}
			if (uniqueNameExcludePrefix !== undefined && item.uniqueName.startsWith(uniqueNameExcludePrefix)) return false; // filter out what we know doesn't belong in the list
			return true;
		});
				
		let completedCount = 0; // baseline to be incremented when loading player data
		const totalCount = cardItems.length;
			
		cardItems.sort(function (firstItem, secondItem) {
			return firstItem.name.localeCompare(secondItem.name);
		});
		
		for (const cardItem of cardItems) {
			const currentLevel = 0;
			const itemRow = createItemRow(cardItem.name, cardItem.uniqueName, currentLevel, xpPerLevel, maxLevel);
			details.append(itemRow);
		}

		updateCount(completedCount, totalCount);
			
		} catch (error) {
			details.append("Failed to load " + exportKey + " from " + filenameCurrentCard);
			}
		}
	
	function createCategoryCard(headingText, hasSubcategories, updateParentCounts) {
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
		separatorSpan.textContent = " | ";

		const countSpan = document.createElement("span");
		countSpan.className = "category-count";
		countSpan.textContent = "0/0";
		
		summary.append(headingSpan, separatorSpan, countSpan);
	    section.append(details);

		// initial counts 0
		let cardCompletedTotal = 0;
		let cardPossibleTotal = 0

		// adjust running totals on each row append
		function updateCount(completedDelta, possibleDelta) {
			cardCompletedTotal += completedDelta;
			cardPossibleTotal += possibleDelta;
			countSpan.textContent = cardCompletedTotal + "/" + cardPossibleTotal;
			updateParentCounts(completedDelta, possibleDelta);
		}

		if (hasSubcategories) { /* skip the item table header */ }
		else createItemListHeader(details);
		
	    return {section, details , updateCount};
	}

	// template for each item's row
	function createItemRow(itemName, uniqueName, currentLevel, xpPerLevel, maxLevel) {
		const row = document.createElement("div");
		row.className = "item-row";
	
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
		const maxXpSuffix = document.createElement("span");
		maxXpSuffix.className = "item-max-xp-suffix";
		maxXpSuffix.textContent = "/" + maxXpElement;

		// xp values into cell
		const xpWrapper = document.createElement("span");
		xpWrapper.className = "item-xp-wrapper";
		xpWrapper.append(currentXpElement, maxXpSuffix);

		// build row
		row.append(checkbox, nameElement, levelWrapper, xpWrapper);
		return row;
	}

	// star chart nodes are handled differentlyt than item ranks
	function createNodeRow(nodeName) {
	    const row = document.createElement("div");
	    row.className = "item-row";
	
	    const checkbox = document.createElement("input");
	    checkbox.type = "checkbox";
	    checkbox.className = "item-checkbox";
	    checkbox.setAttribute("aria-label", nodeName);
	
	    const nameElement = document.createElement("span");
	    nameElement.className = "item-name";
	    nameElement.textContent = nodeName;
	
	    row.append(checkbox, nameElement);
	    return row;
	}
	
	function createNodeList(parentDetails, notifyParent, dataPath, exportKey, productCategory, systemName) {
	    return fetch(dataPath)
	        .then(function (response) {
	            if (!response.ok) throw new Error("Failed to load " + dataPath);
	            return response.json();
	        })
	        .then(function (exportData) {
	            const nodeItems = (exportData[exportKey] || []).filter(function (item) {
	                if (productCategory !== undefined && item.productCategory !== productCategory) return false;
	                if (systemName !== undefined && item.systemName !== systemName) return false;
	                return true;
	            });
	
	            nodeItems.sort(function (a, b) {
	                return a.name.localeCompare(b.name);
	            });
	
	            const completedCount = 0;
	            const totalCount = nodeItems.length;
	
	            for (const node of nodeItems) {
	                parentDetails.append(createNodeRow(node.name));
	            }
	
	            notifyParent(completedCount, totalCount);
	        });
	}

	// build layout, pass second variable of true if category has subcategories 
	const { section: warframesSection, details: warframesDetails, updateCount: updateWarframesCount } = createCategoryCard("Warframes", false, updateOverviewItemCount)
	const { section: weaponsSection, details: weaponsDetails, updateCount: updateWeaponsCount } = createCategoryCard("Weapons", true, updateOverviewItemCount);
	const { section: companionsSection, details: companionsDetails, updateCount: updateCompanionsCount } = createCategoryCard("Companions", true, updateOverviewItemCount);
	const { section: vehiclesSection, details: vehiclesDetails, updateCount: updateVehiclesCount } = createCategoryCard("Vehicles", true, updateOverviewItemCount);
	const { section: intrinsicsSection, details: intrinsicsDetails, updateCount: updateIntrinsicsCount } = createCategoryCard("Intrinsics", true, updateOverviewItemCount);
	const { section: starchartSection, details: starchartDetails, updateCount: updateStarchartCount } = createCategoryCard("Star Chart", true, updateOverviewItemCount);
	
	listsContainer.replaceChildren(
		warframesSection,
		weaponsSection,
		companionsSection,
		vehiclesSection,
		intrinsicsSection,
		starchartSection);
	
	// bring in list of warframes
	createItemList(warframesDetails, updateWarframesCount, "data/ExportWarframes_en.json", 30, 200, "ExportWarframes", "Suits")
		.catch(function (error) {
			warframesDetails.append("Failed to load Warframe data.");
		});
	
	// build subcategories of weapons
	const { section: primarySection, details: primaryDetails, updateCount: updatePrimaryCount } = createCategoryCard("Primary", false, updateWeaponsCount);
	const { section: secondarySection, details: secondaryDetails, updateCount: updateSecondaryCount } = createCategoryCard("Secondary", false, updateWeaponsCount);
	const { section: meleeSection, details: meleeDetails, updateCount: updateMeleeCount } = createCategoryCard("Melee", false, updateWeaponsCount);
	const { section: archgunSection, details: archgunDetails, updateCount: updateArchgunCount } = createCategoryCard("Archgun", false, updateWeaponsCount);
	const { section: archmeleeSection, details: archmeleeDetails, updateCount: updateArchmeleeCount } = createCategoryCard("Archmelee", false, updateWeaponsCount);
	const { section: kitgunsSection, details: kitgunsDetails, updateCount: updateKitgunsCount } = createCategoryCard("Kitguns", false, updateWeaponsCount);
	const { section: zawsSection, details: zawsDetails, updateCount: updateZawsCount } = createCategoryCard("Zaws", false, updateWeaponsCount);
	const { section: ampsSection, details: ampsDetails, updateCount: updateAmpsCount } = createCategoryCard("Amps", false, updateWeaponsCount);
	const { section: companionWeaponsSection, details: companionWeaponsDetails, updateCount: updateCompanionWeaponsCount } = createCategoryCard("Companion Weapons", false, updateWeaponsCount);
	weaponsDetails.append(primarySection, secondarySection, meleeSection, archgunSection, archmeleeSection, kitgunsSection, zawsSection, ampsSection, companionWeaponsSection);
	
	// build each weaspon subcategory
	createItemList(primaryDetails, updatePrimaryCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "LongGuns")
		.catch(function (error) { primaryDetails.append("Failed to load Primary data."); });
	// secondaries gets complicated
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
	createItemList(secondaryDetails, updateSecondaryCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", secondaryPrefixes)
		.catch(function (error) { secondaryDetails.append("Failed to load Secondary data."); });
	// melee
	createItemList(meleeDetails, updateMeleeCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Melee")
		.catch(function (error) { meleeDetails.append("Failed to load Melee data."); });
	// archguns
	createItemList(archgunDetails, updateArchgunCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "SpaceGuns")
		.catch(function (error) { archgunDetails.append("Failed to load Archgun data."); });
	// archmelee
	createItemList(archmeleeDetails, updateArchmeleeCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "SpaceMelee")
		.catch(function (error) { archmeleeDetails.append("Failed to load Archmelee data."); });
	// kitguns
	const kitgunPrefixes = [
		"/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel",
		"/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/",
	];
	createItemList(kitgunsDetails, updateKitgunsCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", kitgunPrefixes)
  	  .catch(function (error) { kitgunsDetails.append("Failed to load Kitgun data."); });
	// zaws has three sublists and they are in the data as econdary not melee
	const zawPrefixes = [
	    "/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip",
	    "/Lotus/Weapons/Ostron/Melee/ModularMelee02/Tip",
	    "/Lotus/Weapons/Ostron/Melee/ModularMeleeInfested/Tips",
	];
	createItemList(zawsDetails, updateZawsCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", zawPrefixes)
	    .catch(function (error) { zawsDetails.append("Failed to load Zaw strike data."); });
	// amps
	const ampModularPrefixes = [
	    "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/SentAmpTrainingBarrel",
	    "/Lotus/Weapons/Sentients/OperatorAmplifiers/Set1/Barrel",
	    "/Lotus/Weapons/Sentients/OperatorAmplifiers/Set2/Barrel",
	    "/Lotus/Weapons/Corpus/OperatorAmplifiers/Set1/Barrel",
	];
	createItemList(ampsDetails, updateAmpsCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", ampModularPrefixes)
	    .catch(function (error) { ampsDetails.append("Failed to load Amp prism data."); });
	createItemList(ampsDetails, updateAmpsCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "OperatorAmps") // just sirocco
		.catch(function (error) { ampsDetails.append("Failed to load Amps data."); });
	// companion weapons includes all robots
	createItemList(companionWeaponsDetails, updateCompanionWeaponsCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "SentinelWeapons")
		.catch(function (error) { companionWeaponsDetails.append("Failed to load Sentinel Weapons data."); });
	
	// companions subcategory cards
	const { section: sentinelsSection, details: sentinelsDetails, updateCount: updateSentinelsCount } = createCategoryCard("Sentinels", false, updateCompanionsCount);
	const { section: beastsSection, details: beastsDetails, updateCount: updateBeastsCount } = createCategoryCard("Beasts", false, updateCompanionsCount);
	const { section: moasSection, details: moasDetails, updateCount: updateMoasCount } = createCategoryCard("MOAs", false, updateCompanionsCount);
	const { section: houndsSection, details: houndsDetails, updateCount: updateHoundsCount } = createCategoryCard("Hounds", false, updateCompanionsCount);
	companionsDetails.append(sentinelsSection, beastsSection, moasSection, houndsSection);
	createItemList(sentinelsDetails, updateSentinelsCount, "data/ExportSentinels_en.json", 30, 200, "ExportSentinels", "Sentinels")
		.catch(function (error) { sentinelsDetails.append("Failed to load Sentinels data."); });
	createItemList(beastsDetails, updateBeastsCount, "data/ExportSentinels_en.json", 30, 200, "ExportSentinels", "KubrowPets")
		.catch(function (error) { beastsDetails.append("Failed to load Beasts data."); });
	createItemList(moasDetails, updateMoasCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetHead") // somewhy these are secondary weapons
		.catch(function (error) { moasDetails.append("Failed to load MOA data."); });
	createItemList(houndsDetails, updateHoundsCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHead") // somewhy these are secondary weapons
		.catch(function (error) { houndsDetails.append("Failed to load Hound data."); });
	
	// vehicles subcategory cards
	const { section: archwingSection, details: archwingDetails, updateCount: updateArchwingCount } = createCategoryCard("Archwings", false, updateVehiclesCount);
	const { section: necramechSection, details: necramechDetails, updateCount: updateNecramechCount } = createCategoryCard("Necramechs", false, updateVehiclesCount);
	const { section: kDriveSection, details: kDriveDetails, updateCount: updateKDriveCount } = createCategoryCard("K-Drives", false, updateVehiclesCount);
	const { section: plexusSection, details: plexusDetails, updateCount: updatePlexusCount } = createCategoryCard("Plexus", false, updateVehiclesCount); // railjack plexus isn't a vehicle apparently
	vehiclesDetails.append(archwingSection, necramechSection, kDriveSection, plexusSection);
	// archwings
	createItemList(archwingDetails, updateArchwingCount, "data/ExportWarframes_en.json", 30, 200, "ExportWarframes", "SpaceSuits")
		.catch(function (error) { archwingDetails.append("Failed to load Archwing data."); });
	// necramechs, note they go up to 40 with 5 forma
	createItemList(necramechDetails, updateNecramechCount, "data/ExportWarframes_en.json", 40, 200, "ExportWarframes", "MechSuits")
		.catch(function (error) { necramechDetails.append("Failed to load Necramech data."); });
	// kdrives
	createItemList(kDriveDetails, updateKDriveCount, "data/ExportWeapons_en.json", 30, 200, "ExportWeapons", "Pistols", "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts/PartComponents")
	    .catch(function (error) { kDriveDetails.append("Failed to load K-Drive data."); });
	// railjack plexus not found in manifests, using placeholder file 
	createItemList(plexusDetails, updatePlexusCount, "data/ExportPlexus_en.json", 30, 200, "ExportPlexus", "RailjackPlexus")
    	.catch(function (error) { plexusDetails.append("Failed to load Plexus data."); });
	
	// intrinsics subcategory cards
	const { section: railjackSection, details: railjackDetails, updateCount: updateRailjackCount } = createCategoryCard("Railjack", false, updateIntrinsicsCount);
	const { section: drifterSection, details: drifterDetails, updateCount: updateDrifterCount } = createCategoryCard("Drifter", false, updateIntrinsicsCount);
	intrinsicsDetails.append(railjackSection, drifterSection);
	// intrinsics not found in manifests yet, using placeholder file
	createItemList(railjackDetails, updateRailjackCount, "data/ExportIntrinsics_en.json", 10, 1500, "ExportIntrinsics", "RailjackIntrinsics")
	    .catch(function (error) { railjackDetails.append("Failed to load Railjack intrinsics data."); });
	createItemList(drifterDetails, updateDrifterCount, "data/ExportIntrinsics_en.json", 10, 1500, "ExportIntrinsics", "DrifterIntrinsics")
	    .catch(function (error) { drifterDetails.append("Failed to load Drifter intrinsics data."); });
	
	// star chart
	// separate by system then by planet
	const { section: originSection, details: originDetails, updateCount: updateOriginCount } = createCategoryCard("Origin System", undefined, updateStarchartCount);
	const { section: proximaSection, details: proximaDetails, updateCount: updateProximaCount } = createCategoryCard("Empyrean Proxima", undefined, updateStarchartCount);
	const { section: duviriSection, details: duviriDetails, updateCount: updateDuviriCount } = createCategoryCard("Duviri", undefined, updateStarchartCount);
	const { section: hollvaniaSection, details: hollvaniaDetails, updateCount: updateHollvaniaCount } = createCategoryCard("Höllvania", undefined, updateStarchartCount);
	const { section: darkRefractorySection, details: darkRefractoryDetails, updateCount: updateDarkRefractoryCount } = createCategoryCard("Dark Refractory", undefined, updateStarchartCount);
	const { section: tauSection, details: tauDetails, updateCount: updateTauCount } = createCategoryCard("Tau", undefined, updateStarchartCount);
	starchartDetails.append(
		originSection,
		proximaSection,
		duviriSection,
		hollvaniaSection,
		darkRefractorySection,
		tauSection
	);

	const originSystems = [ // stage the regions within origin system
	    "Mercury", "Venus", "Earth", "Mars", "Phobos", "Ceres",
	    "Jupiter", "Europa", "Saturn", "Uranus", "Neptune", "Pluto",
	    "Eris", "Sedna", "Void", "Kuva Fortress", "Lua", "Zariman", "Deimos"
	];
	for (const system of originSystems) { // loop through the planets
	    createNodeList(originDetails, updateOriginCount, "data/ExportRegions_en.json", "ExportRegions", undefined, system)
	        .catch(function (error) { originDetails.append("Failed to load " + system + " data."); });
	}
	createNodeList(proximaDetails, updateProximaCount, "data/ExportProxima_en.json", "ExportProxima", "ProximaNode") // railjack
    .catch(function (error) { proximaDetails.append("Failed to load Empyrean Proxima data."); });
	createNodeList(duviriDetails, updateDuviriCount, "data/ExportRegions_en.json", "ExportRegions", undefined, "Duviri")
    	.catch(function (error) { duviriDetails.append("Failed to load Duviri data."); });
	createNodeList(hollvaniaDetails, updateHollvaniaCount, "data/ExportRegions_en.json", "ExportRegions", undefined, "Höllvania")
	    .catch(function (error) { hollvaniaDetails.append("Failed to load Höllvania data."); });
	createNodeList(darkRefractoryDetails, updateDarkRefractoryCount, "data/ExportRegions_en.json", "ExportRegions", undefined, "Dark Refractory, Deimos")
	    .catch(function (error) { darkRefractoryDetails.append("Failed to load Dark Refractory data."); });
	createNodeList(tauDetails, updateTauCount, "data/ExportTau_en.json", "ExportTau", "TauNode")
    	.catch(function (error) { tauDetails.append("Failed to load Tau data."); });
	// figure out how much each gives for XP
})();
