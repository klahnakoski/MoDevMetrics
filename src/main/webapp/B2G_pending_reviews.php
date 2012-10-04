<HTML>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
        <script type="text/javascript" src="js/CNV.js"></script>
        <script type="text/javascript" src="src/test/js/CountPendingReviews.js"></script>
        <script type="text/javascript" src="js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>
		<script type="text/javascript" src="js/charts/HelperFunctions.js"></script>

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
                                            { "term" : {"attachments.flags.request_type" : "feedback"}},
                                            { "and" : [
                                                 { "or" : [
                                                        { "term" : {"attachments.flags.request_status" : "?"}},
                                                        { "term" : {"attachments.flags.request_status" : "D"}}
                                                ]},
                                                { "or" : [
                                                        { "term" : {"attachments.flags.request_type" : "review"}},
                                                        { "term" : {"attachments.flags.request_type" : "superreview"}}
                                                ]}
                                            ]}
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
                    "requestee": {
                        "terms": {
                            "field": "attachments.flags.requestee",
                            "size": 100000
                        },
                        "nested":"attachments.flags",
//                        "scope": "under_review" ,
                        "facet_filter" : {
                            "or" : [
                                { "term" : {"attachments.flags.request_type" : "feedback"}},
                                { "and" : [
                                     { "or" : [
                                            { "term" : {"attachments.flags.request_status" : "?"}},
                                            { "term" : {"attachments.flags.request_status" : "D"}}
                                    ]},
                                    { "or" : [
                                            { "term" : {"attachments.flags.request_type" : "review"}},
                                            { "term" : {"attachments.flags.request_type" : "superreview"}}
                                    ]}
                                ]}
                            ]
                        }
                    }
                }
        };

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

                console.info(JSON.stringify( data, null, "  " ) );
                console.info(CNV.List2Tab(CountPendingReviewers(data)) );


//                var test=[];
//                test.push({"testname": "testvalue1"});
//                test.push({"testname": "testvalue2"});
//                test.testkey="testvalue3";
//                var text=CNV.JSON2String(test);


                var text = '{ "data" : [' + CNV.List2HTMLTable(CountPendingReviewers(data)) + ']}';
			
				document.getElementById("info").innerHTML = text; 
//				document.getElementById("info").innerHTML = JSON.stringify(data); 
			},

			error: function ( errorData, errorMsg, errorThrown ) { 
				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network."; 
			}
		});
		
		</script>
	
	</BODY>
</HTML>