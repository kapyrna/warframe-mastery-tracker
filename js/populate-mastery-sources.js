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
	    const heading = document.createElement("h3");
	    heading.textContent = headingText;
	    section.append(heading);
	    return section;
	}
	
	// plan so that after each list load, total up quantities and xp potential

	// build layout
	const warframesCard = createCategoryCard("Warframes");
    const weaponsCard = createCategoryCard("Weapons");
    const companionsCard = createCategoryCard("Companions");
    const vehiclesCard = createCategoryCard("Vehicles");
    const intrinsicsCard = createCategoryCard("Intrinsics");
    const starChartCard = createCategoryCard("Star Chart");
	
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
