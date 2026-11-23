// validate and store the account identifier to reference when pulling profile data
(function () {
	"use strict";
	
	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
	const storageKeyAccountIdentifier = repositoryName + ":accountid";
	const regexAccountIdentifier = /^[A-Za-z0-9]{24}$/; // regex sorcery

	// reference the relevant HTML elements
	const inputElement = document.getElementById("player-id");
	const buttonElementManual = document.getElementById("button-fetch-manual");
	const buttonElementAutomated = document.getElementById("button-fetch-automated");
	const profileJsonInput = document.getElementById("profile-json-input");
	const saveProfileButton = document.getElementById("button-save-profile");

	if (!inputElement || !buttonElementManual || !buttonElementAutomated) return; //exit if the page didn't fully load

	function isValid(value) {
		return regexAccountIdentifier.test(value);
	}

	function readStoredAccountIdentifier() {
		try {
			return localStorage.getItem(storageKeyAccountIdentifier) || "";
		}
		catch (error) {
			return "";
		}
	}

	function writeStoredAccountIdentifier(accountIdentifier) {
		try {
			localStorage.setItem(storageKeyAccountIdentifier, accountIdentifier);
		}
		catch (error) {}
	}

	 function updateButtonState() {
		 buttonElementManual.disabled = !isValid(inputElement.value.trim());
		 buttonElementAutomated.disabled = !isValid(inputElement.value.trim());
	}

	inputElement.value = readStoredAccountIdentifier();
	updateButtonState();

	inputElement.addEventListener("input", updateButtonState);

	buttonElementManual.addEventListener("click", function () {
		const accountIdentifier = inputElement.value.trim();
		if (!isValid(accountIdentifier)) return;
		writeStoredAccountIdentifier(accountIdentifier);
	
		const profileUrl = "https://api.warframe.com/cdn/getProfileViewingData.php?playerId=" + accountIdentifier;
		
		window.open(profileUrl, "_blank");
	});

	if (profileJsonInput && saveProfileButton) {
		profileJsonInput.addEventListener("input", function () {
			saveProfileButton.disabled = profileJsonInput.value.trim() === "";
		});
	
		saveProfileButton.addEventListener("click", function () {
			const profileStorageKey = repositoryName + ":tennoData";
			try {
				localStorage.setItem(profileStorageKey, profileJsonInput.value.trim());
			} catch (error) {}
			profileJsonInput.value = "";
			saveProfileButton.disabled = true;
		});
	}

	// importer method picker — show/hide rows based on selection
    var importerMethodKey = repositoryName + ":importerMethod";
    var importerRadios = document.querySelectorAll('input[name="importer-method"]');
	var rowImporterInstructions = document.getElementById("row-importer-instructions");
	var rowPlayerId = document.getElementById("row-player-id");
	var rowJsonPaste = document.getElementById("row-json-paste");

    function applyImporterMethod(method) {
		if (rowImporterInstructions) {
			// set the none instructions unhidden only for method == none
			document.getElementById("instruction-element-none").hidden = (method !== "none");
			// set the fetch instructions unhidden when method != none
			document.getElementById("instruction-element-fetch").hidden = (method === "none");
			// set the fetch manual instructions unhidden when method == manual
			document.getElementById("instruction-element-fetch-json").hidden = (method !== "manual");
			// set the fetch automatic instructions unhidden when method == worker
			document.getElementById("instruction-element-fetch-automatic").hidden = (method !== "worker");
		}
        if (rowPlayerId) rowPlayerId.hidden = (method === "none");
        if (rowJsonPaste) rowJsonPaste.hidden = (method !== "manual");
        if (buttonElementManual) buttonElementManual.hidden = (method !== "manual");
        if (buttonElementAutomated) buttonElementAutomated.hidden = (method !== "worker");
    }

    // restore saved selection, default to "none"
    var savedMethod = localStorage.getItem(importerMethodKey) || "none";
    var savedRadio = document.querySelector('input[name="importer-method"][value="' + savedMethod + '"]');
    if (savedRadio) savedRadio.checked = true;
    applyImporterMethod(savedMethod);

    importerRadios.forEach(function (radio) {
        radio.addEventListener("change", function () {
            localStorage.setItem(importerMethodKey, radio.value);
            applyImporterMethod(radio.value);
        });
    });

	const buttonClearStorage = document.getElementById("button-clear-localstorage");
	if (buttonClearStorage) {
		buttonClearStorage.addEventListener("click", function () {
			try {
				const keysToRemove = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key && key.startsWith(repositoryName + ":")) {
						keysToRemove.push(key);
					}
				}
				keysToRemove.forEach(function (key) { localStorage.removeItem(key); });
			} catch (error) {}
		});
	}
})();
