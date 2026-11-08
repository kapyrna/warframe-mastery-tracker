// lists every localStorage key saved for this domain
(function () {
	"use strict";

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
		try {
			for (let index = 0; index < localStorage.length; index++) {
				savedKeys.push(localStorage.key(index));
			}
		} catch (error) {
			statusElement.textContent = "Browser storage is unavailable.";
			return;
		}
		savedKeys.sort();

		statusElement.textContent = savedKeys.length === 0
			? "Nothing is saved in this browser."
			: savedKeys.length + (savedKeys.length === 1 ? " key saved." : " keys saved.");

		for (const savedKey of savedKeys) {
			const savedValue = localStorage.getItem(savedKey) || "";
			const tableRow = document.createElement("tr");
			const valueSizeCell = createCell(savedValue.length + " characters");
			valueSizeCell.className = "numeric-cell";
			tableRow.append(createCell(savedKey), valueSizeCell);
			tableBody.append(tableRow);
		}
	}

	renderSavedKeys();
	window.addEventListener("storage", renderSavedKeys); // update if another tab changes storage
})();
