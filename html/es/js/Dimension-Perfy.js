/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("Dimension.js");

if (!Mozilla) var Mozilla={"name":"Mozilla", "edges":[]};

Dimension.addEdges(false,  Mozilla, [
	{"name":"Perfy", "index":"perfy", "edges":[
		{
			"name":"Date",
			"type":"time",
			"format": "yyyy-MM-dd HH:mm:ss.ffffff",
			"interval":Duration.DAY,
			"field":"info.started"
		},
		{
			"name":"Benchmark",
			"type":"set",
			"field":["info.benchmark", "info.test"],
//			"esfilter":MVEL.TrueFilter,
//			"partitions":[
//				{
//					"name":"CanvasMark",
//					"value":"canvasmark",
//					"path":function(v){
//						return [{
//							"name":v,
//							"esfilter":{"term":{"info.test": v}}
//						}];
//					}
//				},
//				{
//					"name":"Octane",
//					"value":"octane",
//					"path":function(v){
//						return [{
//							"name":v,
//							"esfilter":{"term":{"info.test": v}}
//						}];
//					}
//				},
//				{
//					"name":"sunspider-1.0",
//					"value":"sunspider-1.0",
//					"path":function(v){
//						//CONVERT FROM "math-spectral-norm" => ["math"]["spectral-norm"]
//						var path=v.split("-");
//						return [
//							{"name":path[0], "esfilter":{"prefix":{"info.test": path[0]}}},
//							{"name":path.rightBut(1).join("-"), "esfilter":{"term":{"info.test": v}}}
//						];
//					}
//				},
//				{
//					"name":"Kraken",
//					"value":"kraken",
//					"path":function(v){
//						return [{
//							"name":v,
//							"esfilter":{"term":{"info.test": v}}
//						}];
//					}
//				}
//			]
		},

//count	info.benchmark	info.test
//1760	canvasmark	total
//1760	canvasmark	section-Plasma
//1760	canvasmark	section-Pixel blur
//1760	canvasmark	section-Asteroids
//1760	canvasmark	section-Arena5
//1760	canvasmark	section-3D Rendering
//1760	canvasmark	Plasma - Maths- canvas shapes
//1760	canvasmark	Pixel blur - Math- getImageData- putImageData
//1760	canvasmark	Asteroids - Vectors
//1760	canvasmark	Asteroids - Shapes- shadows- blending
//1760	canvasmark	Asteroids - Bitmaps- shapes- text
//1760	canvasmark	Asteroids - Bitmaps
//1760	canvasmark	Arena5 - Vectors- shadows- bitmaps- text
//1760	canvasmark	3D Rendering - Maths- polygons- image transforms
//
//
//count	info.benchmark	info.test
//1781	octane	Splay
//1781	octane	Richards
//1781	octane	RegExp
//1781	octane	RayTrace
//1781	octane	PdfJS
//1781	octane	Octane
//1781	octane	NavierStokes
//1781	octane	Mandreel
//1781	octane	Gameboy
//1781	octane	EarleyBoyer
//1781	octane	DeltaBlue
//1781	octane	Crypto
//1781	octane	CodeLoad
//1781	octane	Box2D
//
//count	info.benchmark	info.test
//1781	sunspider-1.0	total
//1781	sunspider-1.0	string-validate-input
//1781	sunspider-1.0	string-unpack-code
//1781	sunspider-1.0	string-tagcloud
//1781	sunspider-1.0	string-fasta
//1781	sunspider-1.0	string-base64
//1781	sunspider-1.0	section-string
//1781	sunspider-1.0	section-regexp
//1781	sunspider-1.0	section-math
//1781	sunspider-1.0	section-date
//1781	sunspider-1.0	section-crypto
//1781	sunspider-1.0	section-controlflow
//1781	sunspider-1.0	section-bitops
//1781	sunspider-1.0	section-access
//1781	sunspider-1.0	section-3d
//1781	sunspider-1.0	regexp-dna
//1781	sunspider-1.0	math-spectral-norm
//1781	sunspider-1.0	math-partial-sums
//1781	sunspider-1.0	math-cordic
//1781	sunspider-1.0	date-format-xparb
//1781	sunspider-1.0	date-format-tofte
//1781	sunspider-1.0	crypto-sha1
//1781	sunspider-1.0	crypto-md5
//1781	sunspider-1.0	crypto-aes
//1781	sunspider-1.0	controlflow-recursive
//1781	sunspider-1.0	bitops-nsieve-bits
//1781	sunspider-1.0	bitops-bitwise-and
//1781	sunspider-1.0	bitops-bits-in-byte
//1781	sunspider-1.0	bitops-3bit-bits-in-byte
//1781	sunspider-1.0	access-nsieve
//1781	sunspider-1.0	access-nbody
//1781	sunspider-1.0	access-fannkuch
//1781	sunspider-1.0	access-binary-trees
//1781	sunspider-1.0	3d-raytrace
//1781	sunspider-1.0	3d-morph
//
//
//count	info.benchmark	info.test
//1423	kraken	stanford-crypto-sha256-iterative
//1423	kraken	stanford-crypto-pbkdf2
//1423	kraken	stanford-crypto-ccm
//1423	kraken	stanford-crypto-aes
//1423	kraken	json-stringify-tinderbox
//1423	kraken	json-parse-financial
//1423	kraken	imaging-gaussian-blur
//1423	kraken	imaging-desaturate
//1423	kraken	imaging-darkroom
//1423	kraken	audio-oscillator
//1423	kraken	audio-fft
//1423	kraken	audio-dft
//1423	kraken	audio-beat-detection
//1423	kraken	ai-astar
//1423	kraken	Kraken

		



		{
			"name":"Browser",
			"value":"name",
			"partitions":[
				{"name":"Firefox23", "style":{"color":"#f9cb9c"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":23}}]}},
				{"name":"Firefox24", "style":{"color":"#f6b26b"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":24}}]}},
				{"name":"Firefox25", "style":{"color":"#e06666"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":25}}]}},
				{"name":"Firefox26", "style":{"color":"#cc0000"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":26}}]}},
				{"name":"Firefox27", "style":{"color":"#cc0000"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":27}}]}},
				{"name":"Firefox28", "style":{"color":"#cc0000"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":28}}]}},
				{"name":"Firefox29", "style":{"color":"#cc0000"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":29}}]}},
				{"name":"Firefox30", "style":{"color":"#cc0000"}, "esfilter":{"and":[{"term":{"browser.name":"Firefox"}}, {"term":{"version":30}}]}},
				{"name":"Chrome28", "style":{"color":"#b4a7d6"}, "esfilter":{"and":[{"term":{"browser.name":"Chrome"}}, {"term":{"version":28}}]}},
				{"name":"Chrome29", "style":{"color":"#8e7cc3"}, "esfilter":{"and":[{"term":{"browser.name":"Chrome"}}, {"term":{"version":29}}]}},
				{"name":"Chrome30", "style":{"color":"#8e7cc3"}, "esfilter":{"and":[{"term":{"browser.name":"Chrome"}}, {"term":{"version":30}}]}},
				{"name":"Chrome31", "style":{"color":"#8e7cc3"}, "esfilter":{"and":[{"term":{"browser.name":"Chrome"}}, {"term":{"version":31}}]}}
			]
		}
	]}
]);


