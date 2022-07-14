// Code for interfacing with the s3blocks iframe, which would override our sb3.6.0 instance if it was on the main page
(() => {
	"use strict";
	
	const frameEl = document.getElementById("s3b-iframe");
	if (!frameEl) return;
	window.s3bFrame = frameEl.contentWindow;
	if (!s3bFrame) return;
	if (s3bFrame.document.readyState === "complete") {
		setHTML();
	} else {
		frameEl.addEventListener("load", setHTML);
	}
	
	function setHTML() {
		s3bFrame.document.documentElement.innerHTML = `
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
				:root, body, #s3blocks {
					font-family: sans-serif;
					background-color: transparent;
					margin: 0;
					padding: 0;
				}
			</style>
		</head>

		<body>
			<pre class="output" id="s3blocks"></pre>
		</body>`;
		
		s3bFrame.s3blocks = window.s3blocks;
		const s3blocksStyleEl = s3bFrame.document.createElement("style");
		s3blocksStyleEl.textContent = window.s3blocksStyle;
		s3bFrame.document.head.appendChild(s3blocksStyleEl);
		
		const script = `
		window.output = document.getElementById("s3blocks");
		
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
						
		function parseSB(value, whitebg) {
			return new Promise((resolve, reject) => {
				output.innerHTML = "";
				
				if (value.trim() === "") return;
							
				const s3bDoc = s3blocks.parse(value, {});
							
				s3bDoc.render(function(svg) {
					svg.style.backgroundColor = whitebg ? "#fff" : "";
					s3bDoc.exportPNG(async function(pngDataURL) {
						const blob = await (await fetch(pngDataURL)).blob();
						const url = await blobToDataURL(blob);
						
						resolve(url);
					}, 0);
				}, 0);
			});
		}
		`;
		s3bFrame.eval(script);
	}
})();