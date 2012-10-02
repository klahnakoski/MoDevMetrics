<HTML>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
        <script type="text/javascript" src="src/test/js/CountPendingReviews.js"></script>
        <script type="text/javascript" src="../js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="../js/charts/HelperFunctions.js"></script>

		<script type="text/javascript" src="../js/util.js"></script>
		<script type="text/javascript" src="../js/CNV.js"></script>
        <script type="text/javascript" src="../js/aDate.js"></script>

		<div id="info"></div>

		<script type="text/javascript">          

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
//								{"term":{"bug_id":793609}},
                                {"not" : {
                                        "terms" : {
                                            "bug_status" : ["resolved", "verified", "closed"]
                                        }
                                    }
                                }
							]
						}
					}
				},
				"from":0,
				"size":100,
				"sort":[{ "bug_version_num" : {"order" : "asc"} }],

                "facets" : {
					//[Error: No field found for [attachments]]\n[Near : {... doc[\"attachments\"].values.size ....}]
//					"test1": {
//						"terms": {
//							"script_field": 'doc["attachments"].values.size()',
//							"size": 100000
//						}
//					}

					//[Error: No field found for [attachments]]\n[Near : {... doc[\"attachments\"].values.size ....}]
//					 "test2": {
//                        "terms": {
//                            "script_field": 'doc["attachments"].values.size()',
//                            "size": 100000
//                        },
//                        "nested":"attachments"
//                    }


					//OK
//					"test3": {
//						"terms": {
//							"script_field": '_source.attachments.size()',
//							"size": 100000
//						}
//					}

					// Query Failed [Failed to execute main query]]; nested: RuntimeException[cannot invoke method: size]; nested: }]","status":500}
					"test4": {
						"terms": {
							"script_field": '_source.attachments.size()',
							"size": 100000
						},
                        "nested":"attachments"
					}



                }
        };

//(function(doc){return {value: (doc.bug_severity.value=='normal' ? 'cool' : doc.bug_severity.value)};}(doc));
//(function(doc){return (doc.bug_severity.value=='normal' ? 'cool' : doc.bug_severity.value);}(doc));





//function

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