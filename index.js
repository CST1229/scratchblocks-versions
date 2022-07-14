(() => {
	const s3bFrame = document.getElementById("s3b-iframe").contentWindow;
	
	// thanks stackoverflow
	async function blobToDataURL(blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function(e) {
				resolve(reader.result);
			}
			reader.onerror = function(e) {
				reject(reader.error);
			}
			reader.readAsDataURL(blob);
		});
	}
	
	// style is 1, 2, 3, s3b, 2f, null or an array
	window.parseSB = async function(value, style = null, whitebg) {
		const shouldGenStyle = function(_style) {
			return style === null || _style === style || (Array.isArray(style) && style.includes(_style));
		}
		const gen = {
			s1: shouldGenStyle("s1"),
			s2: shouldGenStyle("s2"),
			s3: shouldGenStyle("s3"),
			s3b: shouldGenStyle("s3b"),
			s2f: shouldGenStyle("s2f"),
		}
		
		const blocks1 = document.querySelector(".blocks1");
		
		const promises = {
			s1: null,
			s2: null,
			s3: null,
			s3b: null,
			s2f: null,
		};
		
		if (gen.s1) {
			let parsedValue = value;
			parsedValue = parsedValue.replaceAll("&", "&amp;");
			parsedValue = parsedValue.replaceAll("<", "&lt;");
			parsedValue = parsedValue.replaceAll(">", "&gt;");
			parsedValue = parsedValue.replaceAll('"', "&quot;");
			parsedValue = parsedValue.replaceAll("'", "&apos;");
			
			document.querySelector(".blocks1").innerHTML = parsedValue;
		}
		
		if (s3bFrame) {
			s3bFrame.output.innerHTML = "";
		}
		
		const emptyUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUCJljYAACAAAFAAFiVTKIAAAAAElFTkSuQmCC";
		
		if (value.trim() === "") {
			return {
				s1: emptyUrl,
				s2: emptyUrl,
				s3: emptyUrl,
				s3b: emptyUrl,
				s2f: emptyUrl,
			};
		}
		
		if (gen.s1) {
			promises.s1 = new Promise(async (resolve, reject) => {
				scratchblocks1.parse({
					containerTag: "pre",
					containerClass: "blocks1",
					staticDir: "./scratchblocks/1.4/"
				});
				
				html2canvas(blocks1, {
					backgroundColor: whitebg ? "#fff" : null
				}).then(
					async function (canvas) {
						try {
							document.body.appendChild(canvas);

							let dataUrl = canvas.toDataURL();
							if (dataUrl === "data:,") dataUrl = emptyUrl;
							canvas.remove();
							blocks1.innerHTML = "";

							resolve(dataUrl);
						} catch(e) {
							canvas.remove();
							blocks1.innerHTML = "";
							reject(e);
						}

					}
				).catch(reject);
			});
		}
		
		if (gen.s2) {
			promises.s2 = new Promise((resolve, reject) => {
				const s2Doc = scratchblocks360.parse(value, {});
				const s2View = scratchblocks360.newView(s2Doc, {
					style: "scratch2"
				})
				s2View.render();
				s2View.el.style.backgroundColor = whitebg ? "#fff" : "";
				s2View.exportPNG(async function(pngDataURL) {
					const blob = await (await fetch(pngDataURL)).blob();
					const url = await blobToDataURL(blob);
					resolve(url);
				}, 0);
			});
		}
		
		if (gen.s2f) {
			promises.s2f = new Promise((resolve, reject) => {
				const s2fDoc = scratchblocks360.parse(value, {});
				const s2fView = scratchblocks360.newView(s2fDoc, {
					style: "scratch2"
				})
				s2fView.render();
				s2fView.el.style.backgroundColor = whitebg ? "#fff" : "";
				s2fView.el.appendChild(Object.assign(
					document.createElement("style"),
					{textContent: document.getElementById("s2fStyles").textContent}
				));
				
				s2fView.exportPNG(async function(pngDataURL) {
					const blob = await (await fetch(pngDataURL)).blob();
					const url = await blobToDataURL(blob);
					resolve(url);
				}, 0);
			});
		}
		
		if (gen.s3) {
			promises.s3 = new Promise((resolve, reject) => {
				const s3Doc = scratchblocks360.parse(value, {});
				const s3View = scratchblocks360.newView(s3Doc, {
					style: "scratch3",
					scale: 0.675
				})
				s3View.render();
				s3View.el.style.backgroundColor = whitebg ? "#fff" : "";
				s3View.exportPNG(async function(pngDataURL) {
					const blob = await (await fetch(pngDataURL)).blob();
					const url = await blobToDataURL(blob);
					resolve(url);
				}, 0);
			});
		}
		
		if (gen.s3b) {
			promises.s3b = s3bFrame.parseSB(value, whitebg);
		}
		
		const alled = await Promise.all([
			promises.s1,
			promises.s2,
			promises.s3,
			promises.s3b,
			promises.s2f,
		]);
		
		return {
			s1: alled[0],
			s2: alled[1],
			s3: alled[2],
			s3b: alled[3],
			s2f: alled[4],
		};
	}

	const styleSelect = document.getElementById("style-select");
	const input = document.getElementById("input");
	const whiteBg = document.getElementById("white-bg");

	input.value = "";
	let oldVal = input.value;
	let running = false;

	async function doParse(force) {
		if (!force && oldVal === input.value) {
			return;
		};
		oldVal = input.value;

		try {
			running = true;

			const outputDiv = document.getElementById("output-div");
			const output = document.getElementById("output");

			const style = styleSelect.value;

			outputDiv.classList.add("hidden");

			const parsed = await parseSB(input.value, style, whiteBg.checked);
			output.src = parsed[style];

			outputDiv.classList.remove("hidden");
			running = false;
		} catch(e) {
			console.error(e);
			running = false;
		}
	}

	styleSelect.addEventListener("change", () => doParse(true));
	whiteBg.addEventListener("click", () => doParse(true));
	setInterval(doParse, 1000);
	doParse();
})();