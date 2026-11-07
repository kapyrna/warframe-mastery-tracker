// outputs the index_en.txt into the card on the data page then updates the last changed and checked lines
(function () {
	"use strict";
	const textElement = document.getElementById("index-text"); // for the index txt file
	const statusElement = document.getElementById("index-status"); // for the timestampss
	if (!textElement) return; // no card to display
	
	const formatTimestamp = t => t ? new Date(t).toLocaleString(undefined, { hourCycle: "h23" }) : "-";
	
	fetch("data/index_en.txt")
		.then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
		.then(t => { textElement.textContent = t; })
		.catch(() => { textEl.textContent = "Couldn't load the index."; });
	
	fetch("data/status.json")
		.then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
		.then(s => {
			const idx = (s.files || {})["index_en.txt"];
			if (statusElement && idx && idx.last_checked) {
				statusElement.textContent = `Last changed: ${formatTimestamp(idx.last_changed)} · Last checked: ${formatTimestamp(idx.last_checked)}`;
			}
		})
		.catch(() => {});
})();	
