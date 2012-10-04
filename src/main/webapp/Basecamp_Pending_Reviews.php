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
                                            { "and" : [
												{"terms" : {"attachments.flags.request_status" : ["?"]}},//, "D"]}},
												{"terms" : {"attachments.flags.request_type" : ["review", "superreview"]}}
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
												 { "and" : [
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


                }
        };





		var request = $.ajax({
			url: window.ElasticSearchRestURL,
			type: "POST",
			data: JSON.stringify(query),
			dataType: "json",

			success: function( data ) {
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

			    var htmlSummary=CNV.List2HTMLTable(result);

				document.getElementById("info").innerHTML =htmlSummary;
			},

			error: function ( errorData, errorMsg, errorThrown ) {
				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network.";
			}
		});
		
		</script>
	
	</BODY>
</HTML>