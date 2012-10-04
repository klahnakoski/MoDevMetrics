<HTML>
	<HEAD>
	</HEAD>
	<BODY>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>
		<script type="text/javascript" src="js/Test2.js"></script>

	    <script type="text/javascript" src="../../../lib/webdetails/cdf/Base.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/cdf/jquery.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/cdf/jquery.tooltip.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/data/q01-01.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/lib/protovis-d3.3.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/lib/jquery.tipsy.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/lib/tipsy.js"></script>
	    <link type="text/css" href="../../../lib/webdetails/lib/tipsy.css" rel="stylesheet"/>
	
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvc.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcPanel.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcLegend.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcTimeseriesAbstract.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcCategoricalAbstract.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcWaterfall.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcPie.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcBar.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcLine.js"></script>
	    <script type="text/javascript" src="../../../lib/webdetails/pvc/pvcData.js"></script>
	    <link type="text/css" rel="stylesheet" href="../../../lib/webdetails/cdf/jquery.tooltip.css"/>
	    <link type="text/css" rel="stylesheet" href="../../../lib/webdetails/pvcComponent.css"/>
			
	    <script type="text/javascript" src="../../../lib/webdetails/pvcDocUtils.js"></script>

		<link type="text/css" href="css/start/jquery-ui-1.8.16.custom.css" rel="stylesheet" />	
		<script type="text/javascript" src="../../../lib/js/jquery-ui-1.8.16.custom.min.js"></script>

		<script type="text/javascript">
		$(function() {
			$( "#progressbar" ).progressbar({
				value: 0
			});
		});				
	    </script>
	    
		<table style="margin-left: auto; margin-right: auto; border: 0px solid black;">			
			<tr>
				<td style="width: 800px; height: margin-left: auto; margin-right: auto; border: 1px solid black;">
					<div id="test">Not Running</div>		
				</td>
			</tr>
				<td>
					<div id="info" font:15px arial,sans-serif;"></div>
				</td>
			</tr>
		</table>

		<script type="text/javascript">          
	    	$(document).ready(function(){

	    		var Test1 = { 
	    	    	"Compare" :
	    			{
	    	    		"ElasticSearch" : {
							"query" : {
								"bool" : {
									"must" : [
										{ "term" : { "_type" : "bug" } },
										{ "term" : { "expiration_date" : "2199-12-31T08:00:00.000Z" } },
//										{ "term" : { "major_status" : "OPEN" } },
										{ "term" : { "flags" : "blocking-fennec1.0+" } }
									]
								}
							},
							"fields" : ["bug_id"],
							"from" : 0,
							"size" : 1000000,
							"sort" : []
						},
	    	    		"Bugzilla" : "https://api-dev.bugzilla.mozilla.org/1.1/bug?cf_blocking_fennec10=%2B&include_fields=id",
		    		},
					"name" : "blocking-fennec1.0+ Flag Test"
	    		};


	    		var integreityTest = new IntegrityTest();
	    		integreityTest.run(Test1);	    	

	    		var Test2 = { 
		    	    	"Compare" :
		    			{
		    	    		"ElasticSearch" : {
								"query" : {
									"bool" : {
										"must" : [
											{ "term" : { "_type" : "bug" } },
											{ "term" : { "expiration_date" : "2199-12-31T08:00:00.000Z" } },
//											{ "term" : { "major_status" : "OPEN" } },
											{ "term" : { "flags" : "blocking-fennec1.0-beta+" } }
										]
									}
								},
								"fields" : ["bug_id"],
								"from" : 0,
								"size" : 1000000,
								"sort" : []
							},
		    	    		"Bugzilla" : "https://api-dev.bugzilla.mozilla.org/1.1/bug?cf_blocking_fennec10=beta%2B&include_fields=id",
			    		},
						"name" : "blocking-fennec1.0-beta+ Flag Test"
		    		};

	    	var integreityTest2 = new IntegrityTest();
    		integreityTest2.run( Test2 );	    	
	    	});
    	</script>
	
	</BODY>
</HTML>