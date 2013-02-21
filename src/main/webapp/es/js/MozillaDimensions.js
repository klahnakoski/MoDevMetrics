/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var Mozilla =
	{"name":"Mozilla", "edges":[
		{"name":"BugStatus", "partitions":[
			{"name":"Open", "partitions":[
				{"name":"New", "esfilter":{"term":{"bug_status":"new"}}},
				{"name":"Assigned", "esfilter":{"term":{"bug_status":"assigned"}}},
				{"name":"Unconfirmed", "esfilter":{"term":{"bug_status":"unconfirmed"}}},
				{"name":"Reopened", "esfilter":{"term":{"bug_status":"reopened"}}},
				{"name":"Other", "esfilter":{"not":{"terms":{"bug_status":["resolved", "verified", "closed"]}}}}
			]},
			{"name":"Closed", "partitions":[
				{"name":"Resolved", "esfilter":{"term":{"bug_status":"resolved"}}},
				{"name":"Verified", "esfilter":{"term":{"bug_status":"verified"}}},
				{"name":"Closed", "esfilter":{"term":{"bug_status":"closed"}}}
			]}
		]},

		{"name":"People", "partitions":[
			{"name":"MoCo", "esfilter":{}},
			{"name":"MoFo", "esfilter":{"not":{"term":{"<FIELD>":"nobody@mozilla.com"}}}}
		]},

		{"name": "Boot2Gecko (B2G)", "esfilter":{"term":{"cf_blocking_basecamp": "+"}}},
		{"name": "Metro MVP", "esfilter":{"term":{"status_whiteboard.tokenized": "metro-mvp"}}},

		{"name": "in-testsuite", "esfilter":
			{"or":[
				{"term":{"status_whiteboard.tokenized": "in-testsuite+"}},
				{"term":{"status_whiteboard.tokenized": "in-testsuite"}}
			]}
		},

		{"name": "testcase", "esfilter":
			{"or":[
				{"term":{"keywords": "testcase"}},
				{"term":{"keywords": "testcase-wanted"}}
			]}
		},

		{"name": "Crash", "partitions":[
			{"name":"Crash", "esfilter":{"term":{"keywords":"crash"}}},//Robert Kaiser PULLS HIS METRICS USING THIS
			{"name":"Top Crash", "esfilter":{"term":{"keywords": "topcrash"}}}
		]},

		{"name": "QA Wanted", "esfilter":{"term":{"keywords": "qawanted"}}},

		{"name": "Regression", "esfilter":
			{"or":[
				{"term":{"status_whiteboard.tokenized": "regression-window-wanted"}},
				{"term":{"status_whiteboard.tokenized": "regressionwindow-wanted"}},
				{"term":{"keywords": "regressionwindow-wanted"}},
				{"term":{"keywords": "regression"}}
			]}
		},

		{"name": "Snappy", "partitions":[
			{"name": "P1", "esfilter":{"term":{"status_whiteboard.tokenized": "snappy:p1"}}},
			{"name": "P2", "esfilter":{"term":{"status_whiteboard.tokenized": "snappy:p2"}}},
			{"name": "P3", "esfilter":{"term":{"status_whiteboard.tokenized": "snappy:p3"}}},
			{"name": "Other", "esfilter":{"prefix":{"status_whiteboard.tokenized": "snappy"}}}//Lawrence Mandel: JUST CATCH ALL SNAPPY
		]},

		{"name": "MemShrink", "partitions":[  //https://wiki.mozilla.org/Performance/MemShrink#Bug_Tracking
			{"name": "P1", "esfilter":{"term":{"status_whiteboard.tokenized": "memshrink:p1"}}},
			{"name": "P2", "esfilter":{"term":{"status_whiteboard.tokenized": "memshrink:p2"}}},
			{"name": "P3", "esfilter":{"term":{"status_whiteboard.tokenized": "memshrink:p3"}}},
			{"name":"other", "esfilter":{"prefix":{"status_whiteboard.tokenized": "memshrink"}}}//Nicholas Nethercote: CATCH memshrink (unconfirmed) AND ALL THE pX TOO
		]},

		{"name":"Fennec", "partitions":[
			{"name":"Fennec 1.0", "esfilter":
				{"or":[
					{"term":{"cf_blocking_fennec10": "+"}},
					{"term":{"cf_blocking_fennec10": "?"}}
				]}
			},
			{"name": "Fennec",  "esfilter":
				{"or":[
					{"term":{"cf_blocking_fennec": "+"}},
					{"term":{"cf_blocking_fennec": "?"}}
				]}
			}
		]},


		{"name":"Release Engineering", "edges":[
			{"name":"Tracking Firefox", "edges":[
				{"name": "21", "esfilter":{"term":{"cf_status_firefox21": "+"}}},
				{"name": "20", "esfilter":{"term":{"cf_status_firefox20": "+"}}},
				{"name": "19", "esfilter":{"term":{"cf_status_firefox19": "+"}}},
				{"name": "18", "esfilter":{"term":{"cf_status_firefox18": "+"}}},
				{"name": "17", "esfilter":{"term":{"cf_status_firefox17": "+"}}},
				{"name": "16", "esfilter":{"term":{"cf_status_firefox16": "+"}}},
				{"name": "15", "esfilter":{"term":{"cf_status_firefox15": "+"}}},
				{"name": "14", "esfilter":{"term":{"cf_status_firefox14": "+"}}},
				{"name": "13", "esfilter":{"term":{"cf_status_firefox13": "+"}}},
				{"name": "12", "esfilter":{"term":{"cf_status_firefox12": "+"}}},
				{"name": "11", "esfilter":{"term":{"cf_status_firefox11": "+"}}}
			]}
		]},

		{"name":"Security", "edges":[
			{"name":"Priority", "partitions":[
				{"name":"Critical", "weight":5, "color":"red", "esfilter":
					{"or":[
						{"term":{"status_whiteboard.tokenized": "sg:critical"}},
						{"term":{"keywords": "sec-critical"}}
					]}
				},
				{"name":"High", "weight":4, "color":"orange", "esfilter":
					{"or":[
						{"term":{"status_whiteboard.tokenized": "sg:high"}},
						{"term":{"keywords": "sec-high"}}
					]}
				},
				{"name":"Moderate", "weight":2, "color":"yellow", "esfilter":
					{"or":[
						{"term":{"status_whiteboard.tokenized": "sg:moderate"}},
						{"term":{"keywords": "sec-moderate"}}
					]}
				},
				{"name":"Low", "weight":1, "color":"green", "esfilter":
					{"or":[
						{"term":{"status_whiteboard.tokenized": "sg:low"}},
						{"term":{"keywords": "sec-low"}}
					]}
				}
			]},
			{"name":"Teams", "esfilter":
					{"terms":{"product":['Fennec','Firefox for Android', "Mozilla Services", "Boot2Gecko", "thunderbird", "mailnews core", 'JSS','NSS','NSPR', "core"]}},
				"partitions":[
				{"name": "Mobile", "esfilter":
					{"terms":{"product":['Fennec','Firefox for Android']}}
				},
				{"name": "Services", "esfilter":
					{"term":{"product":"Mozilla Services"}}
				},
				{"name": "Boot2Gecko", "esfilter":
					{"term":{"product":"Boot2Gecko"}}
				},
				{"name":  "Mail", "esfilter":
					{"or":[
						{"term":{"product":"mailnews core"}},
						{"term":{"product":"thunderbird"}},
						{"and":[
							{"term":{"product":"core"}},
							{"prefix":{"component":"mail"}}
						]}
					]}
				},
				{"name": "Crypto", "esfilter":
					{"or":[
						{"terms":{"product":['JSS','NSS','NSPR']}},
						{"and":[
							{"term":{"product":"core"}},
							{"terms":{"component":['Security: PSM','Security: S/MIME']}}
						]}
					]}
				},
				{"name": "Networking", "esfilter":
					{"and":[
						{"term":{"product":"core"}},
						{"prefix":{"component":"networking"}}
					]}
				},
				{"name": "Architecture", "esfilter":
					{"and":[
						{"term":{"product":"core"}},
						{"terms":{"component":['file handling','General','Geolocation','IPC','Java: OJI','jemalloc','js-ctypes','Plug-ins','Preferences: Backend','String','XPCOM','MFBT']}}
					]}
				},
				{"name": "Layout", "esfilter":
					{"and":[
						{"term":{"product":"core"}},
						{"or":[
							{"prefix":{"component":"layout"}},
							{"prefix":{"component":"printing"}},
							{"prefix":{"component":"webrtc"}},
							{"terms":{"component":['style system (css)','svg','video/audio','internationalization']}}
						]}
					]}
				},
				{"name":  "GFX", "esfilter":
					{"and":[
						{"term":{"product":"core"}},
						{"or":[
							{"prefix":{"component":"gfx"}},
							{"prefix":{"component":"canvas"}},
							{"prefix":{"component":"widget"}},
							{"terms":{"component":['Graphics','Image: Painting','ImageLib','MathML']}}
						]}
					]}
				},
				{"name":  "Frontend", "esfilter":
					{"and":[
						{"or":[
							{"term":{"product":"firefox"}},
							{"term":{"product":"toolkit"}},
							{"and":[
								{"term":{"product":"core"}},
								{"terms":{"component":['form manager','history: global','installer: xpinstall engine','security: ui','keyboard: navigation']}}
							]}
						]}
					]}
				},
				{"name": "JavaScript", "esfilter":
					{"and":[
						{"term":{"product":"core"}},
						{"or":[
							{"prefix":{"component":"javascript"}},
							{"term":{"component":"Nanojit"}}
						]}
					]}
				},
				{"name": "DOM", "esfilter":
					{"and":[
						{"term":{"product":"core"}},
						{"or":[
							{"prefix":{"component":"dom"}},
							{"prefix":{"component":"xp toolkit"}},
							{"terms":{"component":['document navigation','editor','embedding: docshell','event handling','html: form submission','html: parser','rdf','security','security: caps','selection','serializers','spelling checker','web services','xbl','xforms','xml','xpconnect','xslt','xul']}}
						]}
					]}
				}


//				{"name": "Other", "esfilter":
//					{"terms":{"product":["firefox", "thunderbird", "firefox for android", "firefox for metro", "boot2gecko", "core", "nspr", "jss", "nss", "toolkit"]}}
//				}
			]}
		]}
	]
};

//CONVERT INTO A MORE USEFUL FORMAT
{

	var convertPart=function(part){
		if (part.partitions){
			part.partitions.forall(function(p,i){
				convertPart(p);
				p.value=p.name;
			});
		}//endif

		if (part.esfilter){
			part.esfilter=CNV.JSON2Object(CNV.Object2JSON(part.esfilter).toLowerCase());
		}else{
			if (part.partitions){
				part.esfilter={"or":[]};
				part.partitions.forall(function(p,i){
					part.esfilter.or.push(p.esfilter);
				});
			}//endif
		}//endif

	};//method



	var convertDim=function(dim){
		if (dim.edges){
			//ALLOW ACCESS TO EDGE BY NAME
			dim.edges.forall(function(e, i){
				convertDim(e);
				dim[e.name]=e;
			});
		}//endif

		if (dim.partitions){
			dim.partitions.forall(function(v, i){
				dim[v.name]=v;
			});	
		}//endif

		convertPart(dim);

		dim.isFacet=true;		//FORCE TO BE A FACET IN ES QUERIES
		dim.type="set";
		dim.value="name";
	};

	convertDim(Mozilla);

	//ADD THE PEOPLE?
}

