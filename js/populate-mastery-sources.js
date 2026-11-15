// build the manifests into cards on the main page
(function () {
	"use strict";

	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
  	const listsContainer = document.getElementById("lists");
  	const placeholderElement = document.getElementById("list-placeholder");

	if (!listsContainer) return;

	function createItemListHeader(details) {
		const headerRow = document.createElement("div");
		headerRow.className = "item-row item-row-header";
		
		const headerCheckbox = document.createElement("span");
		headerCheckbox.className = "item-checkbox";
		
		const headerName = document.createElement("span");
		headerName.className = "item-name";
		headerName.textContent = "Item";
		
		const headerLevel = document.createElement("span");
		headerLevel.className = "item-current-level numeric-cell";
		headerLevel.textContent = "Rank";
		
		const headerXp = document.createElement("span");
		headerXp.className = "item-current-xp numeric-cell";
		headerXp.textContent = "XP";
		
		headerRow.append(headerCheckbox, headerName, headerLevel, headerXp);
		details.append(headerRow);
	}

	async function createItemList(details, updateCount, filenameCurrentCard, maxLevel, xpPerLevel, exportKey, productCategories){
		try {
		const fileLoadResponse = await fetch(filenameCurrentCard);
		if (!fileLoadResponse.ok) {
			throw new Error("Failed to load " + filenameCurrentCard);}

		const exportData = await fileLoadResponse.json();
		const cardItems = (exportData[exportKey] || []).filter(function (item) {
				return item.productCategory === productCategories;}); // filter to specified and exclude others like warframes versus archwing/necramech
		
		let completedCount = 0; // baseline to be incremented when loading player data
		const totalCount = cardItems.length;
			
		cardItems.sort(function (firstItem, secondItem) {
			return firstItem.name.localeCompare(secondItem.name);
		});
		
		for (const cardItem of cardItems) {
			const currentLevel = 0;
			const itemRow = createItemRow(cardItem.name, currentLevel, xpPerLevel, maxLevel);
			details.append(itemRow);
		}

		updateCount(completedCount, totalCount);
		
		} catch (error) {
			details.append("Failed to load " + exportKey + " from " + filenameCurrentCard);
			}
		}
	
	function createCategoryCard(headingText, hasSubcategories) {
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
		
		function updateCount(completed, available) {
			countSpan.textContent = completed + "/" + available;
		}

		if (hasSubcategories) {
			// skip the item table header
		}
		else createItemListHeader(details);
		
	    return { section, details , updateCount};
	}

	// template for each item's row
	function createItemRow(itemName, currentLevel, xpPerLevel, maxLevel) {
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
		const maxXpSuffix = document.createElement("span");
		maxXpSuffix.className = "item-max-xp-suffix";
		maxXpSuffix.textContent = "/" + maxLevel * xpPerLevel;

		// xp values into cell
		const xpWrapper = document.createElement("span");
		xpWrapper.className = "item-xp-wrapper";
		xpWrapper.append(currentXpElement, maxXpSuffix);

		// build row
		row.append(checkbox, nameElement, levelWrapper, xpWrapper);
		return row;
	}
	// plan so that after each list load, total up quantities and xp potential

	// build layout, pass second variable of true if category has subcategories 
	const { section: warframesSection, details: warframesDetails, updateCount: updateWarframesCount } = createCategoryCard("Warframes", false)
	const { section: weaponsSection, details: weaponsDetails, updateCount: updateWeaponsCount } = createCategoryCard("Weapons", true);
	const { section: companionsSection, details: companionsDetails, updateCount: updateCompanionsCount } = createCategoryCard("Companions", true);
	const { section: vehiclesSection, details: vehiclesDetails, updateCount: updateVehiclesCount } = createCategoryCard("Vehicles", true);
	const { section: intrinsicsSection, details: intrinsicsDetails, updateCount: updateIntrinsicsCount } = createCategoryCard("Intrinsics", true);
	const { section: starchartSection, details: starchartDetails, updateCount: updateStarchartCount } = createCategoryCard("Star Chart", true);
	
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
	const { section: primarySection, details: primaryDetails, updateCount: updatePrimaryCount } = createCategoryCard("Primary", false);
	const { section: secondarySection, details: secondaryDetails, updateCount: updateSecondaryCount } = createCategoryCard("Secondary", false);
	const { section: meleeSection, details: meleeDetails, updateCount: updateMeleeCount } = createCategoryCard("Melee", false);
	const { section: archgunSection, details: archgunDetails, updateCount: updateArchgunCount } = createCategoryCard("Archgun", false);
	const { section: archmeleeSection, details: archmeleeDetails, updateCount: updateArchmeleeCount } = createCategoryCard("Archmelee", false);
	const { section: modularsSection, details: modularsDetails, updateCount: updateModularsCount } = createCategoryCard("Modulars", false);
	const { section: ampsSection, details: ampsDetails, updateCount: updateAmpsCount } = createCategoryCard("Amps", false);
	const { section: sentinelWeaponsSection, details: sentinelWeaponsDetails, updateCount: updateSentinelWeaponsCount } = createCategoryCard("Sentinel Weapons", false);
	weaponsDetails.append(primarySection, secondarySection, meleeSection, archgunSection, archmeleeSection, modularsSection, ampsSection, sentinelWeaponsSection);

	// build each subcategory
	
	// companions subcategory cards
	const { section: roboticsSection, details: roboticsDetails, updateCount: updateRoboticsCount } = createCategoryCard("Robotics", false);
	const { section: beastsSection, details: beastsDetails, updateCount: updateBeastsCount } = createCategoryCard("Beasts", false);
	companionsDetails.append(roboticsSection, beastsSection);
	
	// vehicles subcategory cards
	const { section: archwingSection, details: archwingDetails, updateCount: updateArchwingCount } = createCategoryCard("Archwings", false);
	const { section: necramechSection, details: necramechDetails, updateCount: updateNecramechCount } = createCategoryCard("Necramechs", false);
	const { section: kDriveSection, details: kDriveDetails, updateCount: updateKDriveCount } = createCategoryCard("K-Drives", false);
	const { section: plexusSection, details: plexusDetails, updateCount: updatePlexusCount } = createCategoryCard("Plexus", false);
	vehiclesDetails.append(archwingSection, necramechSection, kDriveSection, plexusSection);

	createItemList(archwingDetails, updateArchwingCount, "data/ExportWarframes_en.json", 30, 200, "ExportWarframes", "SpaceSuits")
		.catch(function (error) {
			archwingDetails.append("Failed to load Archwing data.");
		});
	createItemList(necramechDetails, updateNecramechCount, "data/ExportWarframes_en.json", 30, 200, "ExportWarframes", "MechSuits")
		.catch(function (error) {
			necramechDetails.append("Failed to load Necramech data.");
		});
	// kdrives
	// railjack plexus
	
	// intrinsics subcategory cards
	const { section: railjackSection, details: railjackDetails, updateCount: updateRailjackCount } = createCategoryCard("Railjack", false);
	const { section: drifterSection, details: drifterDetails, updateCount: updatDrifterCount } = createCategoryCard("Drifter", false);
	intrinsicsDetails.append(railjackSection, drifterSection);
	
	// star chart
		// separate by system
		// separate by planet
		// column for normal and steel path
		// figure out how much each gives for XP
	
	// after all sources are loaded, total the categories
})();
