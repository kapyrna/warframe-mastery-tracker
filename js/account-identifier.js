// validate and store the account identifier to reference when pulling profile data
(function () {
	"use strict";
	
	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
	const STORAGE_KEY = repositoryName + ":accountid";
	const VALID_PATTERN = /^[A-Za-z0-9]{24}$/; // regex sorcery

	// reference the relevant HTML elements
	const inputElement = document.getElementById("player-id");
	const buttonElement = document.getElementById("button-fetch");

	if (!inputElement || !buttonElement) return; //exit if the page didn't fully load

	function isValid(value) {
		return VALID_PATTERN.test(value);
	}

	function readStoredAccountIdentifier() {
		try {
			return localStorage.getItem(STORAGE_KEY) || "";
		}
		catch (error) {
			return "";
		}
	}

	function writeStoredAccountIdentifier(accountIdentifier) {
		try {
			localStorage.setItem(STORAGE_KEY, accountIdentifier);
		}
		catch (error) {}
	}

	 function updateButtonState() {
		 buttonElement.disabled = !isValid(inputElement.value.trim());
	}

	inputElement.value = readStoredAccountIdentifier();
	updateButtonState();

	inputElement.addEventListener("input", updateButtonState);

	buttonElement.addEventListener("click", function () {
		const accountIdentifier = inputElement.value.trim();
		if (!isValid(accountIdentifier)) return;
		writeStoredAccountIdentifier(accountIdentifier);
	});
})();
