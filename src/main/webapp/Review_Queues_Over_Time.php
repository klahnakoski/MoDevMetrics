<HTML>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
        <script type="text/javascript" src="src/test/js/CountPendingReviews.js"></script>
        <script type="text/javascript" src="../js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="../js/charts/HelperFunctions.js"></script>

		<script type="text/javascript" src="../js/Debug.js"></script>
		<script type="text/javascript" src="../js/util.js"></script>
		<script type="text/javascript" src="../js/CNV.js"></script>
		<script type="text/javascript" src="../js/aDate.js"></script>
		<script type="text/javascript" src="../js/MVEL.js"></script>
		<script type="text/javascript" src="../js/sql.js"></script>


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
								{"nested" : {
					                "path": "attachments.flags",
                                    "filter" : {
                                        "or" : [
                                            { "and" : [
												{"range":{"attachments.flags.modified_ts":{"gt":Date.now().addMonth(-3)}}},
												{"terms" : {"attachments.flags.request_type" : ["review", "superreview"]}},
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
				"size":0,
				"sort":[{ "bug_version_num" : {"order" : "asc"} }],

                "facets" : {

					"requestee": {
						"terms": {
							"script_field":
								new MVEL().code({
									"select" : [
										{"name" : "bug_id", value : "doc.bug_id"},
										{"name" : "modified_ts", value : "doc.attachments.flags.modified_ts"},
										{"name" : "previous_modified_ts", value : "doc.attachments.flags.previous_modified_ts"},
										{"name" : "request_status", value : "doc.attachments.flags.request_status"}
									],
									"from" :
										"doc.attachments.flags",
                                    "where" :
                                        {"and" : [
                                            {"terms" : {"doc.attachments.flags.request_type" : ["review", "superreview"]}},
                                            {"range":{"doc.attachments.flags.modified_ts":{"gt":Date.now().addMonth(-3).getTime()}}},
                                            {"or" : [
                                                { "and" : [
                                                    {"terms" : {"doc.attachments.flags.request_status" : ["+", "-", "D"]}},
                                                    {"terms" : {"doc.attachments.flags.previous_status" : ["?"]}}
                                                ]},
                                                //											{ "and" : [
                                                //												{"terms" : {"doc.attachments.flags.request_status" : ["?"]}}
                                                //											]},
                                            ]},
                                            {"term":{"doc.attachments[\"attachments.isobsolete\"]" : 0}}
                                        ]}
								}),
							"size": 100
						}
					}


                }
        };


//function

console.info(query.facets.requestee.terms.script_field);
//new Date(modified_ts).floorMonth()


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


				var range = new SQL().calc({
					"from" :
						esResult,
					"select" : [
						{"name":"max", "operation": "maximum", "value": "Date.newInstance(modified_ts).floorWeek()"},
						{"name":"min", "operation": "minimum", "value": "Date.newInstance(modified_ts).floorWeek()"}
					],
					"facets" : [
						{"name":"interval", "value" : "'week'"},
						{"name":"type", "value":"'time'"}
					]
				})[0];




				var result2=new SQL().calc({
					"from" :
						esResult,
					"select" : [
						{"name":"duration_max", "operation":"maximum", "value": "modified_ts-previous_modified_ts"},
						{"name":"duration_avg", "operation":"average", "value": "modified_ts-previous_modified_ts"},
						{"name":"duration_min", "operation":"minimum", "value": "modified_ts-previous_modified_ts"},
						{"name":"count", "operation":"count", "value":"1"}
					],
					"facets" : [
						{"name" : "week", "value": "Date.newInstance(modified_ts)", "domain" : range}
					],
                    "order":[
                        "week"
                    ]
				});




				var htmlSummary=CNV.ESResult2HTMLSummaries(data);
				var htmlResults=CNV.List2HTMLTable(CNV.ESResult2List(data));

				document.getElementById("info").innerHTML = CNV.List2HTMLTable(result2)+"<br><br>"+htmlSummary+"<br><br>"+htmlResults;
			},

			error: function ( errorData, errorMsg, errorThrown ) { 
				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network."; 
			}
		});
		
		</script>
	
	</BODY>
</HTML>