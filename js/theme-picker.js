// This is what does the work underneath the radio buttons to pick the theme at the top of the page
(function () {
	"use strict";
	
	const STORAGE_KEY = "wf-mr-tracker-theme-v1"; // make a key, leave room for future improvements and backwards compatibility
	const CHOICES = ["light", "system", "dark"]; // the current options
	const root = document.documentElement; // point back to the HTML element
	
	function normalize(choice) {
		return CHOICES.includes(choice) ? choice : "system"; } // handle NULL
	
	function readStored() { // attempt to read saved pref
		try { return normalize(localStorage.getItem(STORAGE_KEY)); } // fall back to system if OS or browser is unheplful
		catch (e) { return "system";}
	}
	
	function writeStored() { // attempt to write saved pref
		try { localStorage.setItem(STORAGE_KEY, choice); }
		catch (e) { /* complain to Ordis then move on with your life */ }
	}
	
	function apply(choice) { // do the thing to the page
		if (choice === "light" || choice === "dark") // if selecting a manual option
			root.setAttribute("data-theme", choice);
		else root.removeAttribute("data-theme");
	}
	
	let choice = readStored(); //check for pre-existing choice and fallback to system
	apply(choice) // paint theme
 
	function bind() { // make the radio buttons active
		const radios = document.querySelectorAll('input[name="theme"]'); // select all the buttons in the toggle
		radios.forEach(function (radio) {
			radio.checked = radio.value === choice; // show the saved choice on the relevant toggle option
			radio.addEventListener("change", function () {
				if (!radio.checked) return; // skip if was already selected
				choice = normalize(radio.value); // read which one was slected
				writeStored(choice); // write to saved prefs in localStorage
				apply(choice); // paint again to apply new themea
			});
		});
	}
	
	if (document.readyState === "loading") // page still loading
		document.addEventListener("DOMContentLoaded", bind); // listen for load
	else bind();
})();
