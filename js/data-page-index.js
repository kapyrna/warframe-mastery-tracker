// outputs the index_en.txt into the card on the data page then updates the last changed and checked lines
(function () {
	"use strict";
	const textElement = document.getElementById("index-text"); // for the index txt file
	const statusElement = document.getElementById("index-status"); // for the timestampss
	if (!textElement) return; // no card to display
	
	const formatTimestamp = timestamp => timestamp ? new Date(t).toLocaleString(undefined, { hourCycle: "h23" }) : "-";
	
	fetch("data/index_en.txt")
		.then(response => { if (!response.ok) throw new Error(response.status); return response.text(); })
		.then(indexText => { textElement.textContent = indexText; })
		.catch(() => { textElement.textContent = "Couldn't load the index."; });
	
	fetch("data/status.json")
		.then(response => { if (!response.ok) throw new Error(response.status); return response.json(); })
		.then(statusData => {
			const indexEntry = (statusData.files || {})["index_en.txt"];
			if (statusElement && indexEntry && indexEntry.last_checked) {
				statusElement.textContent = `Last changed: ${formatTimestamp(indexEntry.last_changed)} · Last checked: ${formatTimestamp(indexEntry.last_checked)}`;
			}
		})
		.catch(() => {});
})();	
