// outputs the Export manifests list and their timestamps
(function () {
	"use strict";

	const body = document.getElementById("files-body");
	if (!body) return; // no card to display

	const formatTimestamp = t => t ? new Date(t).toLocaleString(undefined, { hourCycle: "h23" }) : "-";

	function cell(text) {
		const td = document.createElement("td");
		td.textContent = text;
		return td;
	}

	fetch("data/status.json")
		.then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
		.then(s => {
			const files = s.files || {};
			const names = Object.keys(files).filter(n => n !== "index_en.txt").sort();

			for (const name of names) {
				const v = files[name];
				const tr =  document.createElement("tr");

				const nameCell = document.createElement("td");
				const a = document.createElement("a");
				a.href = "data/" + name;
				a.textContent = name;
				nameCell.append(a);

				tr.append(nameCell, cell(formatTimestamp(v.last_changed)), cell(formatTimestamp(v.last_checked)));
				body.append(tr);
			}
		})
	.catch(err => {
		console.error("status load failed:", err);
		const tr = document.createElement("tr");
		const td = cell("Couldn't load the file list. Ordis is sorry.");
		td.colSpan = 3;
		tr.append(td);
		body.append(tr);
	});
})();
