/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("Dimension.js");

if (!Mozilla) var Mozilla={"name":"Mozilla", "edges":[]};


Dimension.addEdges(false, Mozilla, [

	{"name":"Telemetry", "index":"raw_telemetry", "edges":[

		{"name":"User Defined", "edges":[
			{"name":"Ordered Startup", "partitions":[
				{"name":"Orderly", esfilter:{"and":[
					{"term":{"simpleMeasurements.startupInterrupted":0}},
					{"term":{"simpleMeasurements.debuggerAttached":0}},
					{"script":{"script":"doc[\"simpleMeasurements.start\"].value <= doc[\"simpleMeasurements.main\"].value"}},
					{"script":{"script":"doc[\"simpleMeasurements.main\"].value <= doc[\"simpleMeasurements.createTopLevelWindow\"].value"}},
					{"script":{"script":"doc[\"simpleMeasurements.createTopLevelWindow\"].value <= doc[\"simpleMeasurements.firstPaint\"].value"}},
					{"script":{"script":"doc[\"simpleMeasurements.firstPaint\"].value <= doc[\"simpleMeasurements.sessionRestored\"].value"}},
					{"or":[
						{"not":{"exists":{"field":"doc[\"simpleMeasurements.firstLoadURI\"].value"}}},
						{"script":{"script":"doc[\"simpleMeasurements.firstPaint\"].value <= doc[\"simpleMeasurements.firstLoadURI\"].value"}},
						{"script":{"script":"doc[\"simpleMeasurements.firstLoadURI\"].value <= doc[\"simpleMeasurements.sessionRestored\"].value"}}
					]}
					]}
				},
				{"name":"Unorderly"}
			]},

			{"name":"Warm/Cold", "partitions":[
				{"name":"Warm", "esfilter": {"script":{"script":"doc[\"simpleMeasurements.main\"].value - doc[\"simpleMeasurements.start\"].value <= 100"}}},
				{"name":"Cold", "esfilter": {"script":{"script":"doc[\"simpleMeasurements.main\"].value - doc[\"simpleMeasurements.start\"].value > 100"}}}
			]}
		]},

		{"name":"Instance", "edges":[
			{"name":"reason", "field":"info.reason", "type":"set"},
			{"name":"addons", "field":"info.addons", "type":"set"}
		]},

		{"name":"Application", "edges":[
			{"name":"ID", "field":"info.appID", "type":"set"},
			{"name":"Name", "field":"info.appName", "type":"set"},
			{"name":"Update Channel", "field":"info.appUpdateChannel", "type":"set"},
			{"name":"Version", "field":"info.appVersion", "type":"set"},
			{"name":"Build ID", "field":"info.appBuildID", "type":"set"},
			{"name":"Platform Build ID", "field":"info.platformBuildID", "type":"set"}
		]},

		{"name":"Environment", "edges":[
			{"name":"OS", "field":"info.OS", "type":"set"},
			{"name":"OS Version", "field":"info.version", "type":"set"},
			{"name":"Flash Version", "field":"info.flashVersion", "type":"set"},
			{"name":"Arch", "field":"info.arch", "type":"set"},
			{"name":"Locale", "field":"info.locale", "type":"set"},
			{"name":"MemSize", "field":"info.memsize", "type":"linear"},
			{"name":"cpucount", "field":"info.cpucount", "type":"linear"},
			{"name":"DWriteVersion", "field":"info.DWriteVersion", "type":"set"},
			{"name":"DWriteEnabled", "field":"info.DWriteEnabled", "type":"boolean"},

			{"name":"Flags", "edges":[
				{"name":"has MMX", "field":"info.hasMMX", "type":"boolean"},
				{"name":"has EDSP", "field":"info.hasEDSP", "type":"boolean"},
				{"name":"has NEON", "field":"info.hasNEON", "type":"boolean"},
				{"name":"has ARMv6", "field":"info.hasARMv6", "type":"boolean"},
				{"name":"has ARMv7", "field":"info.hasARMv7", "type":"boolean"},
				{"name":"has SSE", "field":"info.hasSSE", "type":"boolean"},
				{"name":"has SSE2", "field":"info.hasSSE2", "type":"boolean"},
				{"name":"has SSE3", "field":"info.hasSSE3", "type":"boolean"},
				{"name":"has SSE4A", "field":"info.hasSSE4A", "type":"boolean"},
				{"name":"has SSE4_1", "field":"info.hasSSE4_1", "type":"boolean"},
				{"name":"has SSE4_2", "field":"info.hasSSE4_2", "type":"boolean"}
			]}

		]},

		{"name":"Adapter", "edges":[
			{"name":"Device ID", "field":"info.adapterDeviceID", "type":"set"},
			{"name":"Description", "field":"info.adapterDescription", "type":"set"},
			{"name":"Vendor ID", "field":"info.adapterVendorID", "type":"set"},
			{"name":"RAM", "field":"info.adapterRAM", "type":"set"},
			{"name":"Driver", "field":"info.adapterDriver", "type":"set"},
			{"name":"DriverVersion", "field":"info.adapterDriverVersion", "type":"set"},
			{"name":"DriverDate", "field":"info.adapterDriverDate", "type":"set"}
		]}
	]}
]);


