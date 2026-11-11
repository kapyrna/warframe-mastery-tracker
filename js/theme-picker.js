// This is what does the work underneath the radio buttons to pick the theme
(function () {
	"use strict";
	
	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker"; // from data-repository-name on the html element
	const STORAGE_KEY = repositoryName + "theme-choice"; // make a key
	const THEMECHOICES = ["light", "dark"]; // the current options
	const root = document.documentElement; // point back to the HTML element
	
	function browserdefaulttheme() {
		if ( window.matchMedia('(prefers-color-scheme: dark)').matches)
			return "dark";
		else return "light"; }
	
	function readStored() { // attempt to read saved pref
		try { return localStorage.getItem(STORAGE_KEY); }
		catch (exception) { return browserdefaulttheme();}
	}
	
	function writeStored(choice) { // attempt to write saved pref
		try { localStorage.setItem(STORAGE_KEY, choice); }
		catch (exception) { /* complain to Ordis then move on with your life */ }
	}
	
	function apply(choice) { // do the thing to the page
		root.setAttribute("data-theme", choice);
	}
	
	let choice = readStored(); //check for pre-existing choice and fallback to system
	apply(choice) // paint theme
 
	function bind() { // make the radio buttons active
		const radios = document.querySelectorAll('input[name="theme"]'); // select all the buttons in the toggle
		radios.forEach(function (radio) {
			radio.checked = radio.value === choice; // show the saved choice on the relevant toggle option
			radio.addEventListener("change", function () {
				if (!radio.checked) return; // skip if was already selected
				choice = radio.value; // read which one was slected
				writeStored(choice); // write to saved prefs in localStorage
				apply(choice); // paint again to apply new themea
			});
		});
	}
	
	if (document.readyState === "loading") // page still loading
		document.addEventListener("DOMContentLoaded", bind); // listen for load
	else bind();
})();
