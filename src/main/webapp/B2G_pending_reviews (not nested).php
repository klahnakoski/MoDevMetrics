<HTML>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
        <script type="text/javascript" src="../../test/js/CountPendingReviews.js"></script>
        <script type="text/javascript" src="../js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="../js/charts/HelperFunctions.js"></script>

		<script type="text/javascript" src="../js/Debug.js"></script>
		<script type="text/javascript" src="../js/util.js"></script>
		<script type="text/javascript" src="../js/CNV.js"></script>
		<script type="text/javascript" src="../js/aDate.js"></script>
		<script type="text/javascript" src="../js/MVEL.js"></script>
        <script type="text/javascript" src="../js/sql.js"></script>
        <script type="text/javascript" src="../../test/js/SQL.js"></script>


		<div id="info"></div>

		<script type="text/javascript">          
/*
		var query = {
			"query" : {
				"filtered" : {
					"query" : {
						"match_all" : {}
					},
					"filter" : {
						"and" : [
							{
							    "nested" : {
							         "path" : "attachments",
							         "query" : {
							            "nested": {
							               "path": "attachments.flags",
							               "query": {
					               				"filtered" : {
	               									"query" : {
									   					"match_all" : {}
													},
													"filter" : {
														"and" : [
														    { "range" : { "bug_id" : {"from" : 500000, "to" : 600000 }}},
															{ "or" : [
										                      		{ "term" : {"attachments.flags.request_type" : "review"}},
										                      		{ "term" : {"attachments.flags.request_type" : "superreview"}},
		//								                          	{ "term" : {"attachments.flags.request_status" : "?"}}																									
															]}
														]
													}
												}
							               }
							            }
							         }
							     }
							},
//							{ 
//								"not" : {
//									"terms" : { 
//										"bug_status" : ["resolved", "verified", "closed"]
//									}
//								}
//							}									
						]
					}
				}
			},
			"fields" : ["bug_id", "attachments"],
			"from" : 0,
			"size" : 100000,
			"sort" : []
		}
*/		
		var query = {
				"query": {
					"filtered" : {
						"query": {
                            "match_all" : {}
						},
						"filter": {
							"and":[
                                { "range" : { "expires_on" : { "gt" : Date.now().addDay(1) } } },
                                { "term" : {"cf_blocking_basecamp": "+"}},
//								{"term" : {"bug_id":786295}},
                                {"not" : {
                                        "terms" : {
                                            "bug_status" : ["resolved", "verified", "closed"]
                                        }
                                    }
                                },
                                {"nested" : {
					                "path": "attachments.flags",
                                    "filter" : {
                                        "or" : [
                                            //{ "term" : {"attachments.flags.request_type" : "feedback"}},
                                            { "and" : [
//												{"term" : {"attachments.flags.requestee": "philipp@weitershausen.de"}},
												{"terms" : {"attachments.flags.request_status" : ["?"]}},//, "D"]}},
												{"terms" : {"attachments.flags.request_type" : ["review", "superreview"]}}

//                                                 { "or" : [
//                                                        { "term" : {"attachments.flags.request_status" : "?"}},
//                                                        { "term" : {"attachments.flags.request_status" : "D"}}
//                                                ]},
//                                                { "or" : [
//                                                        { "term" : {"attachments.flags.request_type" : "review"}},
//                                                        { "term" : {"attachments.flags.request_type" : "superreview"}}
//                                                ]}
                                            ]}
                                        ]
                                    }
							    }},
								{"nested" : {
								   "path": "attachments",
									"filter" : {
										"and" : [
											{"term":{"attachments.attachments.isobsolete" : 0}}

										]
									}
								}}

							]
						}
					}
				},
				"from":0,
				"size":100,
				"sort":[{ "bug_version_num" : {"order" : "asc"} }],

                "facets" : {
//					"requestee": {
//						"terms": {
//							"script_field":
//									"var String2Quote = function(value){\nvalue+\"\";\n};\n"+
////									"String2Quote(_source.bug_id);",
//									'var cool_func = function(doc){\n'+
//										'output = "";\n'+
//										'for(loop1 : doc.attachments){\n'+
//											'for(loop2 : loop1.flags){\n'+
////												"if (output!=\"\") output+=\", \";\n"+
////												"output=output+(\"doc.attachments.flags.requestee\":+String2Quote(loop2.requestee));\n"+
//												"output+=\"doc.attachments.flags.requestee:\"+String2Quote(loop2.requestee);\n"+
//											'}\n'+
//										'}\n'+
//										'return output;\n'+
//									'}; cool_func(_source)\n',
//							"size": 100000
//						}
//					},

//					"requestee": {
//						"terms": {
//							"script_field": "_source.attachments[1].flags.size()",
//							"size": 100000
//						}
//					},

					"requestee": {
						"terms": {
							"script_field":
								new MVEL().code({
									"select" : [
										{"name":"bug_id", "value":"doc.bug_id"},
										{"name":"requestee", "value":"doc.attachments.flags.requestee"}
									],
									"from":
										"doc.attachments.flags",
									"where":
										{"and" : [
											{"or" : [
												 //{ "term" : {"doc.attachments.flags.request_type" : "feedback"}},
												 { "and" : [
	//												{"term" : {"doc.attachments.flags.requestee": "philipp@weitershausen.de"}},
													 {"terms" : {"doc.attachments.flags.request_status" : ["?"]}},//, "D"]}},
													 {"terms" : {"doc.attachments.flags.request_type" : ["review", "superreview"]}}
												 ]}
											]},
											{"term":{"doc.attachments[\"attachments.isobsolete\"]" : 0}}
										 ]}
								}),
							"size": 100000
						}
					}


//		            "requestee2": {
//                        "terms": {
//                            "field": "attachments.flags.requestee",
//                            "size": 100000
//                        },
//                        "nested":"attachments.flags",
////                        "scope": "under_review" ,
//                        "facet_filter" : {
//                            "or" : [
//                                //{ "term" : {"attachments.flags.request_type" : "feedback"}},
//                                { "and" : [
//                                     { "or" : [
//                                            { "term" : {"attachments.flags.request_status" : "?"}}//,
////                                            { "term" : {"attachments.flags.request_status" : "D"}}
//                                    ]},
//                                    { "or" : [
//                                            { "term" : {"attachments.flags.request_type" : "review"}},
//                                            { "term" : {"attachments.flags.request_type" : "superreview"}}
//                                    ]},
////									{"term":{"attachments.isobsolete" : 0}}
//                                ]}
//                            ]
//                        }
//                    }

                }
        };

//(function(doc){return {value: (doc.bug_severity.value=='normal' ? 'cool' : doc.bug_severity.value)};}(doc));
//(function(doc){return (doc.bug_severity.value=='normal' ? 'cool' : doc.bug_severity.value);}(doc));





//function

console.info(query.facets.requestee.terms.script_field);

//document.getElementById("info").innerHTML = Test.ReviewQueuesOverTime();



		var request = $.ajax({
			url: window.ElasticSearchRestURL,
			type: "POST",
//				contentType: "application/json",
			data: JSON.stringify(query),
			dataType: "json",
//				traditional: true,
//				processData: false,
//				timeout: 100000,


			success: function( data ) {
				console.info(CNV.Object2JSON(data));

				var esResult=CNV.ESFacet2List(data.facets.requestee);





				var result=new SQL().calc({
					"from":
						//REQUESTEE AND BUG_ID CAN SHOW UP MORE THAN ONCE, CONDENSE
						new SQL().calc({
							"from":
								esResult,
							"select":[
							],
							"facets":[
								{"name":"requestee", "value":"requestee"},
								{"name":"bug_id", "value":"bug_id"}
							]
						}),
					"select":[
						{"name":"numPending", "value":"1", operation:"count", "sort":"descending"},
						{"name":"bugs", "value":"bug_id", operation:"join", "separator":","}
					],
					"facets":[
						{"name":"requestee", "value":"requestee"}
					],
                    "order":[
                        "numPending"
                    ]
				});

				var htmlESResult=CNV.List2HTMLTable(esResult);
                var htmlSummary=CNV.List2HTMLTable(result);
				var htmlResults=CNV.List2HTMLTable(CNV.ESResult2List(data));

				document.getElementById("info").innerHTML = htmlESResult+"<br><br>"+htmlSummary+"<br><br>"+htmlResults;
			},

			error: function ( errorData, errorMsg, errorThrown ) {
				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network.";
			}
		});
		
		</script>
	
	</BODY>
</HTML>