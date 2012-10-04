<HTML>
	<HEAD>
	</HEAD>
	<BODY>
		<script type="text/javascript" src="../../js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../../lib/js/jquery-1.7.js"></script>
		<script type="text/javascript" src="../../js/charts/HelperFunctions.js"></script>

		<div id="info"></div>

		<script type="text/javascript">          
		var query = {
			"query" : {
				"filtered" : {
					"query" : {
						"match_all" : {}
					},
					"filter" : {
						"and" : [
						    { "range" : { "created_ts" : {"gte" : 1268870400000 }}},
						    { "or" : [
							    { "term" : { "product" : "firefox" }},
							    { "term" : { "product" : "core" }},
						    ]},
							{
							    "nested" : {
							         "path" : "attachments",
							         "query" : {
						         		"bool" : {
				         					"must" : [
							         			{ "term" : { "attachments.ispatch": "1" }}, 
				         						{
									            "nested": {
									               "path": "attachments.flags",
									               "query": {
							               				"filtered" : {
			               									"query" : {
											   					"match_all" : {}
															},
															"filter" : {
																"and" : [
																	{ "or" : [
												                      		{ "term" : {"attachments.flags.request_type" : "review"}},
												                      		{ "term" : {"attachments.flags.request_type" : "superreview"}},
																	]}
																]
															}
														}
									               }
				         						}
				         					}]
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
			"from" : 1000,
			"size" : 2000,
			"sort" : []
		}
/*
 
 		var query = 
			 {
				"query": {
					"match_all" : {}
				},
//				"fields" : ["expires_on"],
				"from":0,
				"size":100,
				"sort":[{ "_id" : {"order" : "asc"} }],
				"filter": {
					"and":[
//						{ "or":[
//								{"term":{"product":"firefox"}},
//								{"term":{"product":"core"}}
//						]},
						{ "term" : { "bug_id" : "733668" }},
						{ "range" : { "expires_on" : { "gt" : getTomorrowsUTC() } } }
//						{ "term" : { "keywords" : "crash" }}
//						{ "prefix" : { "flags" : "blocking" }}
					]
				},
			};
*/
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
				var text = '{ "data" : [';

				//console.info(JSON.stringify( data ) );
				
				for(x=0; x<data.hits.hits.length; x++)
					text += JSON.stringify( data.hits.hits[x].fields ) + ",";
			
				text += ']}';
			
				console.info( text );
				//document.getElementById("info").innerHTML = text; 
//				document.getElementById("info").innerHTML = JSON.stringify(data); 
			},

			error: function ( errorData, errorMsg, errorThrown ) { 
				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network."; 
			},
		});
		
		</script>
	
	</BODY>
</HTML>