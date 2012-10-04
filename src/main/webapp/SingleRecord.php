<HTML>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
		<script type="text/javascript" src="js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="js/charts/HelperFunctions.js"></script>

		<script type="text/javascript" src="js/Debug.js"></script>
		<script type="text/javascript" src="js/util.js"></script>
		<script type="text/javascript" src="js/CNV.js"></script>
		<script type="text/javascript" src="js/aDate.js"></script>
		<script type="text/javascript" src="js/MVEL.js"></script>
        <script type="text/javascript" src="js/sql.js"></script>
        <script type="text/javascript" src="../../test/js/SQL.js"></script>


		<div id="info"></div>

		<script type="text/javascript">          
//		var query = {
//
//            "query": {
//					"filtered" : {
//                        "query": {
//                            "match_all" : {}
//                        },
//                        "filter" : {
//                            "and":[
//                                {"terms" : { "status_whiteboard.tokenized" : ["snappy:p1", "snappy:p2", "snappy:p3"]} },
//                                {"or":[
//                                    {"term" : {"bug_version_num" : 1}},
//                                    {"and":[
//                                        {"terms" : { "bug_status" : ["resolved", "verified", "closed"] }},
////                                        {"nested": {
////                                            "path": "changes",
////                                            "filter" : {
////                                                "and" : [
//                                                    {"term" : { "changes.field_name" : ["bug_status"] }},
//                                                    {"not": {"terms":{"changes.field_value": ["resolved", "verified", "closed"]}}}
////                                                ]
////                                            }
////                                        }}
//                                    ]}
//                                ]}
//                            ]
//                        }
//					}
//				},
//                "size":100
//        };

        var query = {
            "query" : {
                "filtered" : {
                    "query": {
                        "match_all":{}
                    },
                    "filter" : {
                        "and":[
                            { "range" : { "expires_on" : { "gt" : Date.now().getMilli() } } },
                            {"not" : {"terms" : { "bug_status" : ["resolved", "verified", "closed"] }}}
                        ]
                    }
                }
            },
            "from": 0,
            "size": 0,
            "sort": [],
            "facets": {
                "Products": {
                    "terms": {
                        "field": "product",
                        "size": 100000
                    }
                }
            }
	    };




//            "query":{
//                "filtered": {
//                    "query" : {
//						"match_all" : {}
//					},
//                    "filter" : {
//							"and" : [
////								{"not" : {"term" : {"keywords" : "meta"}}},
////								{"term" : {"bug_version_num" : 667}},
//								{"terms" : {"bug_id" : [740722]}},
//								//694690, 783582, 757408, 710398, 774688, 790777, 744063, 728017, 673922, 668449, 641025, 712978, 746794, 785175, 709061, 749998, 721607, 748548, 749721, 74711, 651872, 653140, 653550, 654023, 654721, 656778, 657131, 658344, 658368, 659625, 660784, 669603,  671460, 672183, 672748, 674229, 697762, 742441, 735091, 735471]}}
//                                { "range" : { "expires_on" : { "gt" : Date.now().addDay(1) } } },
//                                { "term" : {"cf_blocking_basecamp": "+"}},
////								{"term" : {"bug_id":786295}},
//                                {"not" : {
//                                        "terms" : {
//                                            "bug_status" : ["resolved", "verified", "closed"]
//                                        }
//                                    }
//                                },
//                                {"nested" : {
//					                "path": "attachments.flags",
//                                    "filter" : {
//                                        "or" : [
//                                            //{ "term" : {"attachments.flags.request_type" : "feedback"}},
//                                            { "and" : [
////												{"term" : {"attachments.flags.requestee": "philipp@weitershausen.de"}},
//												{"terms" : {"attachments.flags.request_status" : ["?"]}},//, "D"]}},
//												{"terms" : {"attachments.flags.request_type" : ["review", "superreview"]}}
//
////                                                 { "or" : [
////                                                        { "term" : {"attachments.flags.request_status" : "?"}},
////                                                        { "term" : {"attachments.flags.request_status" : "D"}}
////                                                ]},
////                                                { "or" : [
////                                                        { "term" : {"attachments.flags.request_type" : "review"}},
////                                                        { "term" : {"attachments.flags.request_type" : "superreview"}}
////                                                ]}
//                                            ]}
//                                        ]
//                                    }
//							    }},
//								{"nested" : {
//								   "path": "attachments",
//									"filter" : {
//										"and" : [
//											{"term":{"attachments.attachments.isobsolete" : 0}}
//
//										]
//									}
//								}}
//							]
//					}
//                }
//            },
//            "size": 1500,
//            "sort": [],
//			"facets": {
//					"numChanges": {
//						"terms": {
//							"field": "bug_version_num",
//							"size": 1000000
//						},
////						"sort" : [{ "bug_version_num" : {"order" : "asc"} }]
//					}
//			}
//		};

//            "query":{
//                "filtered": {
//                    "query" : {
//							"wildcard" :{"status_whiteboard" : "*regression*"}
//
//					},
//                    "filter" : {
//                         "and":[
//							{"not": {  "terms" : { "bug_status" : ["resolved", "verified", "closed"] }}},
//							{"terms" : {"product" : ["core", "firefox", "toolkit"]}},
//							{ "range" : { "expires_on" : { "gt" : getTomorrowsUTC() } } },
//                         ]
//
//                    }
//                }
//            },
//            "size": 20,
//            "sort": [],




//                "Bug Age2": {
//                    "range": {
//                        "key_script": "(new java.util.Date().getTime() - doc['created_ts'].value) / 86400000",
//                        "value_script": "1",
//                        "ranges": [
//                            { "from": 0, "lt": 1 },
//                            { "from": 1, "lt": 2 },
//                            { "from": 2, "lt": 3 },
//                            { "from": 3, "lt": 4 },
//                            { "from": 4, "lt": 8 },
//                            { "from": 8, "lt": 15 },
//                            { "from": 15, "lt": 31 },
//                            { "from": 31, "lt": 61 },
//                            { "from": 61, "lt": 181 },
//                            { "from": 181, "lt": 366 },
//                            { "from": 366, "lt": 731 },
//                            { "from": 731 }
//                        ],
//                        "size": 100000
//                    }
//                }




//                "query" : {
//                   "match_all" : {}
//                },
//                "filter" : {
//                    "and":[
//                        { "range" : { "expires_on" : { "gt" : getTomorrowsUTC() } } },
//                        { "term" : {"cf_blocking_basecamp": "+"}},
//                        {"not" : {
//                                "terms" : { "bug_status" : ["resolved", "verified", "closed"] }
//                            }
//                        },
//                        //{ "term" : { "flags" : "blocking-basecamp+" } }
//                    ]
//                },
//                "from" : 0,
//                "size" : 10,
//                "sort" : []





//                "query": {
//                     "bool" : {
//                        "must" : [
//                            {
//                                "wildcard" : { "status_whiteboard" : "*[snappy*" }
//                            }
//                        ]
//                    }
//                },
//                "filter": {
//                    "and":[
//                        { "range" : { "expires_on" : { "gt" : getTomorrowsUTC() } } },
//                        {"not" : { "term" : { "status_whiteboard.tokenized" : "snappy:?" } }},
//                        {"not" : { "term" : { "status_whiteboard.tokenized" : "snappy" } }},
//                        {"not" : { "term" : { "status_whiteboard.tokenized" : "snappy:p1" } }},
//                        {"not" : { "term" : { "status_whiteboard.tokenized" : "snappy:p2" } }},
//                        {"not" : { "term" : { "status_whiteboard.tokenized" : "snappy:p3" } }},
//                        {"not" : { "term" : { "status_whiteboard.tokenized" : "snappy:p4" } }},
//                        {"not" : {
//                                "terms" : { "bug_status" : ["resolved", "verified", "closed"] }
//                            }
//                        }
//                    ]},
//                "from" : 0,
//                "size" : 100,
//                "sort" : []


		
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
                
                var htmlSummary=CNV.ESResult2HTMLSummaries(data);
				var htmlResults=CNV.List2HTMLTable(CNV.ESResult2List(data));

				document.getElementById("info").innerHTML = htmlSummary+"<br><br>"+htmlResults;
			},

			error: function ( errorData, errorMsg, errorThrown ) { 
				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network."; 
			}
		});
		
		</script>
	
	</BODY>
</HTML>