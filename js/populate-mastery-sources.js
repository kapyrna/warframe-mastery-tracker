// build the manifests into cards on the main page
(function () {
	"use strict";

	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
  	const listsContainer = document.getElementById("lists");
  	const placeholderElement = document.getElementById("list-placeholder");

	if (!listsContainer) return;

	function createCategoryCard(headingText) {
	    const section = document.createElement("section");
	    section.className = "card";
	    const details = document.createElement("details");
		const summary = document.createElement("summary");
		summary.textContent = headingText;
		details.append(summary);
	    section.append(details);
	    return { section, details };
	}

	// template for each item's row
	function createItemRow(itemName, currentLevel, xpPerLevel, maxLevel) {
		const row = document.createElement("div");
		row.className = "item-row";
	
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "item-checkbox";
		checkbox.checked = currentLevel >= maxLevel;
		checkbox.setAttribute("aria-label", itemName);
	
		const nameElement = document.createElement("span");
		nameElement.className = "item-name";
		nameElement.textContent = itemName;
	
		const currentLevelElement = document.createElement("span");
		currentLevelElement.className = "item-current-level numeric-cell";
		currentLevelElement.textContent = currentLevel;
	
		const xpPerLevelElement = document.createElement("span");
		xpPerLevelElement.className = "item-xp-per-level numeric-cell";
		xpPerLevelElement.textContent = xpPerLevel;
	
		const maxLevelElement = document.createElement("span");
		maxLevelElement.className = "item-max-level numeric-cell";
		maxLevelElement.textContent = maxLevel;
	
		row.append(checkbox, nameElement, currentLevelElement, xpPerLevelElement, maxLevelElement);
		return row;
	}
	// plan so that after each list load, total up quantities and xp potential

	// build layout
	const { section: warframesSection, details: warframesDetails } = createCategoryCard("Warframes");
	const { section: weaponsSection, details: weaponsDetails } = createCategoryCard("Weapons");
	const { section: companionsSection, details: companionsDetails } = createCategoryCard("Companions");
	const { section: vehiclesSection, details: vehiclesDetails } = createCategoryCard("Vehicles");
	const { section: intrinsicsSection, details: intrinsicsDetails } = createCategoryCard("Intrinsics");
	const { section: starchartSection, details: starchartDetails } = createCategoryCard("Star Chart");
	
	listsContainer.replaceChildren(
		warframesSection,
		weaponsSection,
		companionsSection,
		vehiclesSection,
		intrinsicsSection,
		starchartSection);
	
	// bring in list of warframes
	
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
