<HTML>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
        <script type="text/javascript" src="src/test/js/CountPendingReviews.js"></script>
        <script type="text/javascript" src="../js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="../js/charts/HelperFunctions.js"></script>

		<script type="text/javascript" src="../js/Debug.js"></script>
		<script type="text/javascript" src="../js/util.js"></script>
		<script type="text/javascript" src="../js/CNV.js"></script>
		<script type="text/javascript" src="../js/aDate.js"></script>
		<script type="text/javascript" src="../js/MVEL.js"></script>
        <script type="text/javascript" src="../js/sql.js"></script>
        <script type="text/javascript" src="src/test/js/SQL.js"></script>


		<div id="info"></div>

		<script type="text/javascript">

       var startDate=Date.now().addDay(-30);


		var query = {
				"query": {
					"filtered" : {
                        "query": {
                            "match_all" : {}
                        },
                        "filter" : {
                            "and":[
                                {"or":[
                                    {"range":{"modified_ts":{"gte":startDate.floorDay().getMilli()}}},
                                    {"range":{"expires_on":{"gte":startDate.floorDay().getMilli()}}}
                                ]},
                                {"terms" : { "status_whiteboard.tokenized" : ["snappy:p1", "snappy:p2", "snappy:p3"]} },
                                {"script":{"script" :   //MAX ONE BUG PER DAY, AND ONLY THE LASTEST
                                    "var floorDay = function(value){\nMath.floor(value/(24*60*60*1000))*(24*60*60*1000);};\n"+
                                    'var field_func = function(doc){\n'+
                                        'if (doc.expires_on == null){\n'+
                                            'true;\n'+
                                        '}else{\n'+
                                            'floorDay(doc.modified_ts)!=floorDay(doc.expires_on);\n'+
                                        '};\n'+
                                    '}; field_func(_source)\n'
                                }}
                            ]
                        }
					}
				},
				"from":0,
				"size":20,
				"sort":[{ "bug_version_num" : {"order" : "asc"} }],

                "facets" : {

                    "bugs": {
                        "terms": {
                            "script_field":
                                new MVEL().code({
                                    "select" : [
                                        {"name":"bug_id", "value":"doc.bug_id"},
                                        {"name":"date", "value":"floorDay(doc.modified_ts)"},
                                        {"name":"state", "value": '(doc.bug_status=="resolved" || doc.bug_status=="verified" || doc.bug_status=="closed") ? "closed" : "open"'}
                                    ],
                                    "from":
                                        "doc"
                                }),
                            "size": 100000
                        }
                    },

//					"open bugs": {
//						"histogram": {
//							"key_script":
//                                "var floorDay = function(value){\nMath.floor(value/(24*60*60*1000))*(24*60*60*1000);};\n"+
//                                'var field_func = function(doc){\n'+
//                                    'if (doc.modified_ts<'+startDate.getMilli()+'){\n'+
//                                        ''+startDate.floorDay().getMilli()+';\n'+
//                                    '}else{\n'+
//                                        'floorDay(doc.modified_ts);\n'+
//                                    '}\n'+
//                                '}; field_func(_source)\n',
//                            "value_script" : "1",
//							"size": 10000,
//                            "facet_filter": {"not":{"terms" : { "bug_status" : ["resolved", "verified", "closed"] }}}
//						}
//					},
                    "all bugs": {
						"histogram": {
                            "key_script":
                                "var floorDay = function(value){ Math.floor(value/(24*60*60*1000))*(24*60*60*1000);};\n"+
                                'var field_func = function(doc){\n'+
                                    'if (doc.modified_ts<'+startDate.getMilli()+'){\n'+
                                        ''+startDate.floorDay().getMilli()+';\n'+
                                    '}else{\n'+
                                        'floorDay(doc.modified_ts);\n'+
                                    '}\n'+
                                '}; field_func(_source)\n',
                            "value_script" : "1",
							"size": 10000,
                            //"facet_filter": {"not":{"terms" : { "bug_status" : ["resolved", "verified", "closed"] }}}
						}
					}

//

                }
        };

//(function(doc){return {value: (doc.bug_severity.value=='normal' ? 'cool' : doc.bug_severity.value)};}(doc));
//(function(doc){return (doc.bug_severity.value=='normal' ? 'cool' : doc.bug_severity.value);}(doc));





//function

console.info(query.facets['bugs'].terms.script_field);
//console.info(query.facets['all bugs'].histogram.script_value);
Test.burndown();

document.getElementById("info").innerHTML = Test.burndown();



//		var request = $.ajax({
//			url: window.ElasticSearchRestURL,
//			type: "POST",
////				contentType: "application/json",
//			data: JSON.stringify(query),
//			dataType: "json",
////				traditional: true,
////				processData: false,
////				timeout: 100000,
//
//
//			success: function( data ) {
//				console.info(CNV.Object2JSON(data));
//
//                var esOpenBugs="";//CNV.ESFacet2List(data.facets["open bugs"]);
//                var esAllBugs=CNV.ESFacet2List(data.facets["bugs"]);
//
//
//
//
//
//				var result=new SQL().calc({
//					"from":
//						esAllBugs,
//					"select":[
//						{"name":"best_date", "value":"modified_ts", operation:"maximum", "sort":"descending"}
//					],
//					"facets":[
//                        {"name":"date", "test":"Date.newInstance(modified_ts)<time.max", domain:{"type": "time", "min":startDate, "max": Date.now().floorDay(), interval:"day"}},
//						{"name":"bug_id", "value":"bug_id"}
//					],
//                    "order":[
//                        "date"
//                    ]
//				});
//
//				var htmlESResult=CNV.List2HTMLTable(esOpenBugs)+"<br><br>"+CNV.List2HTMLTable(esAllBugs);
//                var htmlSummary="";//CNV.List2HTMLTable(result);
//				var htmlResults=CNV.List2HTMLTable(CNV.ESResult2List(data));
//
//				document.getElementById("info").innerHTML = htmlESResult+"<br><br>"+htmlSummary+"<br><br>"+htmlResults;
//			},
//
//			error: function ( errorData, errorMsg, errorThrown ) {
//				document.getElementById("info").innerHTML = "Response Error.  Make sure you are connected to the MPT network.";
//			}
//		});

		</script>

	</BODY>
</HTML>