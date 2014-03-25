/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("Dimension.js");
importScript("qb/ESQuery.js");

if (!Mozilla) var Mozilla={"name":"Mozilla", "edges":[]};

Dimension.addEdges(true, Mozilla, [
		{"name":"B2G",
		    "esfilter":{"or":[
		        {"terms":{"cf_blocking_b2g":["1.3+", "1.4+", "1.4t+", "1.5+", "1.3?", "1.4?", "1.4t?", "1.5?"]}},
		        {"term":{"product":"firefox os"}}
		    ]},
		    "edges":[
		        {"name":"Age", "index":"bugs", "isFacet":true, "partitions":[
		            {"name":"Old", "style":{"color":"red"}, "esfilter":{"range":{"modified_ts":{"lt":Date.eod().add("-4day").getMilli()}}}},
		            {"name":"Close", "style":{"color":"orange"}, "esfilter":{"range":{"modified_ts":{"lt":Date.eod().add("-3day").getMilli()}}}},
		            {"name":"Young", "style":{"color":"green"}, "esfilter":{"range":{"modified_ts":{"lt":Date.eod().getMilli()}}}}
		        ]},

		        {"name":"State", "index":"bugs",  "isFacet":true,
		            "partitions":[
		                {"name":"Unassigned", "esfilter":{"and":[
		                    {"term":{"assigned_to":"nobody@mozilla.org"}},
		                    {"not":{"term":{"keywords":"regression"}}},
		                    {"not":{"terms":{"cf_blocking_b2g":["1.3+", "1.4+", "1.4t+", "1.5+", "1.3?", "1.4?", "1.4t?", "1.5?"]}}}
		                ]}},
		                {"name":"Open", "esfilter":{"and":[
		                    {"not":{"term":{"assigned_to":"nobody@mozilla.org"}}},
		                    {"not":{"term":{"keywords":"regression"}}},
		                    {"not":{"terms":{"cf_blocking_b2g":["1.3+", "1.4+", "1.4t+", "1.5+", "1.3?", "1.4?", "1.4t?", "1.5?"]}}}
		                ]}},
		                {"name":"Nominated", "esfilter":{"and":[
		                    {"terms":{"cf_blocking_b2g":["1.3?", "1.4?", "1.4t?", "1.5?"]}},
		                    {"not":{"term":{"keywords":"regression"}}}
		                ]}},
		                {"name":"Blocker", "esfilter":{"and":[
		                    {"terms":{"cf_blocking_b2g":["1.3+", "1.4+", "1.4t+", "1.5+"]}},
		                    {"not":{"term":{"keywords":"regression"}}}
		                ]}},
		                {"name":"Regression", "esfilter":{"term":{"keywords":"regression"}}}
		            ]},

		        {"name":"Project", "index":"bugs", "isFacet":true, "partitions":[
		            {"name":"Firefox OS", "esfilter":{"and":[
		                {"term":{"product":"firefox os"}},
		                {"not":{"terms":{"cf_blocking_b2g":["1.3+", "1.4+", "1.4t+", "1.5+", "1.3?", "1.4?", "1.4t?", "1.5?"]}}}
		            ]}},
		            {"name":"1.5", "esfilter":{"or":[
		                {"and":[
		                    {"exists":{"field":"target_milestone"}},
		                    {"prefix":{"target_milestone":"1.5"}},
		                    {"not":{"term":{"product": "instantbird"}}},
		                    {"not":{"term":{"product": "chat core"}}}
		                ]},
		                {"terms":{"cf_blocking_b2g":["1.5+", "1.5?"]}}
		            ]}},
		            {"name":"1.4", "esfilter":{"or":[
		                {"and":[
		                    {"exists":{"field":"target_milestone"}},
		                    {"prefix":{"target_milestone":"1.4"}},
		                    {"not":{"term":{"product": "instantbird"}}},
		                    {"not":{"term":{"product": "chat core"}}}
		                ]},
		                {"terms":{"cf_blocking_b2g":["1.4+", "1.4?"]}}
		            ]}},
		            {"name":"1.3", "esfilter":{"or":[
		                {"and":[
		                    {"exists":{"field":"target_milestone"}},
		                    {"prefix":{"target_milestone":"1.3"}},
		                    {"not":{"term":{"product": "instantbird"}}},
		                    {"not":{"term":{"product": "chat core"}}}
		                ]},
		                {"terms":{"cf_blocking_b2g":["1.3+", "1.3t+", "1.3?", "1.3t?"]}}
		            ]}}
//                {"name":"KOI", "esfilter":{"or":[
////                    {"and":[
////                        {"exists":{"field":"target_milestone"}},
////                        {"prefix":{"target_milestone":"1.2"}},
////                        {"not":{"term":{"product": "instantbird"}}},
////                        {"not":{"term":{"product": "chat core"}}}
////                    ]},
//                    {"terms":{"cf_blocking_b2g":["koi+", "koi?"]}}
//                ]}},
//                {"name":"LEO", "esfilter":{"terms":{"cf_blocking_b2g":["leo+", "leo?"]}}},
//                {"name":"HD", "esfilter":{"terms":{"cf_blocking_b2g":["hd+", "hd?"]}}}
		        ]}
		    ]
	}
]);

