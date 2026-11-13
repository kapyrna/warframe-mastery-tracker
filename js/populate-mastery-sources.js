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
		const heading = document.createElement("h3");
		heading.textContent = headingText;
	    summary.append(heading);
		details.append(summary);
	    section.append(details);
	    return { section, details };
	}
	
	// plan so that after each list load, total up quantities and xp potential

	// build layout
	const { section: warframesSection, details: warframesDetails } = createCategoryCard("Warframes");
	const { section: weaponsSection, details: weaponsDetails } = createCategoryCard("Weapons");
	const { section: companionsSection, details: companionsDetails } = createCategoryCard("Companions");
	const { section: vehiclesSection, details: vehiclesDetails } = createCategoryCard("Vehicles");
	const { section: intrinsicsSection, details: intrinsicsDetails } = createCategoryCard("Intrinsics");
	const { section: starChartSection, details: starchartDetails } = createCategoryCard("Star Chart");
	
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
