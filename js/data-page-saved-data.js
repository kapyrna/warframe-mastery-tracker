// lists every localStorage key saved for this domain
(function () {
	"use strict";

	const repositoryName = document.documentElement.dataset.repositoryName || "warframe-mastery-tracker";
	const keyPrefix = repositoryName + ":";
	const tableBody = document.getElementById("saved-data-body");
	const statusElement = document.getElementById("saved-data-status");
	if (!tableBody) return; // no card to display

	function createCell(text) {
		const tableCell = document.createElement("td");
		tableCell.textContent = text;
		return tableCell;
	}

	function renderSavedKeys() {
		tableBody.replaceChildren();

		let savedKeys = [];
		let otherKeys = 0;
		try {
			for (let index = 0; index < localStorage.length; index++) {
				if ( localStorage.key(index).startsWith(keyPrefix) ) {
					savedKeys.push(localStorage.key(index));}
				else otherKeys++
			}
		} catch (error) {
			statusElement.textContent = "Browser storage is unavailable.";
			return;
		}
		savedKeys.sort();

		if (savedKeys.length === 0) {
			statusElement.textContent = "Nothing is saved for this browser.";
		} else if (savedKeys.length === 1) {
			statusElement.textContent = "1 key saved for this tracker";
		} else {
			statusElement.textContent = savedKeys.length + " keys saved for this tracker";
		}
		if ( otherKeys > 0 ) {
			statusElement.textContent = statusElement.textContent + " and " + otherKeys + " from other projects."; }
		else statusElement.textContent = statusElement.textContent + ".";

		for (const savedKey of savedKeys) {
			const savedValue = localStorage.getItem(savedKey) || "";
			const tableRow = document.createElement("tr");
			
			const keyCell = document.createElement("td");
			keyCell.append(savedKey);
			
			const valueLine = document.createElement("div");
			valueLine.className = "muted small saved-value";
			valueLine.textContent = savedValue;
			keyCell.append(valueLine);
			
			const deleteCell = document.createElement("td");
			deleteCell.className = "numeric-cell";
			const deleteButton = document.createElement("button");
			deleteButton.type = "button";
			deleteButton.className = "danger";
			deleteButton.textContent = "Delete";
			deleteButton.setAttribute("aria-label", "Delete saved key " + savedKey);
			deleteButton.addEventListener("click", function () {
				const confirmed = window.confirm("Delete the saved key \"" + savedKey + "\"? This can't be undone.");
				if (!confirmed) return;
				try { localStorage.removeItem(savedKey); }
				catch (error) { /* storage blocked */ }
				renderSavedKeys(); // the storage event only fires in other tabs, so refresh here
			});
			deleteCell.append(deleteButton);
			
			tableRow.append(keyCell, deleteCell);
			tableBody.append(tableRow);
		}
	}

	renderSavedKeys();
	window.addEventListener("storage", renderSavedKeys); // update if another tab changes storage
})();
