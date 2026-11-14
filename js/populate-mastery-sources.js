// build the manifests into cards on the main page
(async function () {
	"use strict";

	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
  	const listsContainer = document.getElementById("lists");
  	const placeholderElement = document.getElementById("list-placeholder");

	if (!listsContainer) return;

	function createCategoryCard(headingText) {
	    const section = document.createElement("section");
	    section.className = "card";
		const details = document.createElement("details");
		details.className = "mastery-panel";
		const summary = document.createElement("summary");

		const headingSpan = document.createElement("span");
		headingSpan.textContent = headingText;

		const separatorSpan = document.createElement("span");
		separatorSpan.textContent = " | ";

		const countSpan = document.createElement("span");
		countSpan.className = "category-count";
		countSpan.textContent = "0 / 0";
		
		summary.append(headingSpan, separatorSpan, countSpan);
	    section.append(details);

		const headerRow = document.createElement("div");
		headerRow.className = "item-row item-row-header";
		
		const headerCheckbox = document.createElement("span");
		headerCheckbox.className = "item-checkbox";
		
		const headerName = document.createElement("span");
		headerName.className = "item-name";
		headerName.textContent = "Item";
		
		const headerLevel = document.createElement("span");
		headerLevel.className = "item-current-level numeric-cell";
		headerLevel.textContent = "Level";
		
		const headerXp = document.createElement("span");
		headerXp.className = "item-current-xp numeric-cell";
		headerXp.textContent = "XP";
		
		headerRow.append(headerCheckbox, headerName, headerLevel, headerXp);
		details.append(summary, headerRow);

		function updateCount(completed, available) {
			countSpan.textContent = completed + " / " + available;
		}
		
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

	// build layout
	const { section: warframesSection, details: warframesDetails, updateCount: updateWarframesCount } = createCategoryCard("Warframes")
	const { section: weaponsSection, details: weaponsDetails, updateCount: updateWeaponsCount } = createCategoryCard("Weapons");
	const { section: companionsSection, details: companionsDetails, updateCount: updateCompanionsCount } = createCategoryCard("Companions");
	const { section: vehiclesSection, details: vehiclesDetails, updateCount: updateVehiclesCount } = createCategoryCard("Vehicles");
	const { section: intrinsicsSection, details: intrinsicsDetails, updateCount: updateIntrinsicsCount } = createCategoryCard("Intrinsics");
	const { section: starchartSection, details: starchartDetails, updateCount: updateStarchartCount } = createCategoryCard("Star Chart");
	
	listsContainer.replaceChildren(
		warframesSection,
		weaponsSection,
		companionsSection,
		vehiclesSection,
		intrinsicsSection,
		starchartSection);
	
	// bring in list of warframes
	try {
		const filenameWarframes = "data/ExportWarframes_en.json";
		const fileLoadResponse = await fetch(filenameWarframes);
		if (!fileLoadResponse.ok) {
			throw new Error("Failed to load " + filenameWarframes);}

		const exportData = await fileLoadResponse.json();
		const warframeItems = (exportData.ExportWarframes || []).filter(function (item) {
				return item.productCategory === "Suits";});// ignore archwings and necramechs in this file
		
		const xpPerLevel = 200; // per Wiki
		const maxLevel = 30; // per Wiki
		let completedCount = 0; // baseline to be incremented when loading player data
		const totalCount = warframeItems.length;
			
		warframeItems.sort(function (firstItem, secondItem) {
			return firstItem.name.localeCompare(secondItem.name);
		});
		
		for (const warframeItem of warframeItems) {
			const currentLevel = 0;
			const itemRow = createItemRow(warframeItem.name, currentLevel, xpPerLevel, maxLevel);
			warframesDetails.append(itemRow);
			updateWarframesCount(completedCount, totalCount);
		}
	} catch (error) {
		warframesDetails.append("Failed to load warframe data.");
		}
	
	// bring in list of weapons
		// make sure modulars make it in here somehow
	
	// bring in companions
		// sentinels
		// beasts
		// moa and hounds
	
	// vehicles
		// archwing
		// necramech
	
	// intrinsics
		// railjack
		// drifter
	
	// star chart
		// separate by system
		// separate by planet
		// column for normal and steel path
		// figure out how much each gives for XP
	
	// after all sources are loaded, total the categories
})();
