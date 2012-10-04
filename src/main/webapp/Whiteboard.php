<HTML>
	<HEAD>
	</HEAD>
	<BODY>
		<script type="text/javascript" src="js/rest/RestConfig.js"></script>

		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="js/rest/RestQuery.js"></script>

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
		<script type="text/javascript" src="../../../lib/js/jquery.ba-bbq.js"></script>
	    <link type="text/css" rel="stylesheet" href="css/menu.css"/>

		<script type="text/javascript">

		//GUI.GetURLState();

		var results = null;
		
		var createChart = function()
		{
			var chartRequest = { 
				"requests" :[
				{
					"query" : {
                        "query" : {
                            "wildcard" :{
                                "status_whiteboard.tokenized" : "*regression*"
                            }

                        },
                        "from" : 0,
						"size" : 0,
						"sort" : [],
						"facets": {
							"Whiteboard Items": {
								"terms": {
							        "field": "status_whiteboard.tokenized",
							        "size": 1000000
								}
						    }
						}
					},
					"seriesName" : "Whiteboard"
				},

				]
			};

				//ES.InjectFilters( chartRequest.requests );

	    		
				this.request = $.ajax({
					url: window.ElasticSearchRestURL,
					type: "POST",
//						contentType: "application/json",
					data: JSON.stringify(chartRequest.requests[0].query),
					dataType: "json",
//						traditional: true,
//						processData: false,
						timeout: 10000,

					success: function( data ) {
						var html = "<ul>";

						var terms = data.facets['Whiteboard Items'].terms;

						for(i=0; i<terms.length; i++)
						{
							html += "<li><pre>" + terms[i].term;
							html += " (" + terms[i].count + ")</pre>"
							html += "</li>";
						}

						html += "</ul>";

						$("#chart").html(html);
					},

					error: function ( errorData, errorMsg, errorThrown ) { 
						//localObject.Error(errorData, errorMsg, errorThrown); 
					},
				});
		}

		//var filterUI = null;
		
		$(document).ready(function(){
				//filterUI = new ProductUI();
				//UpdateTextFields();
		    	createChart();
		});
		
		//Code for updating URL paramaters: window.location('address_goes_here');
		</script>
	
	<table>
	<tr>
	<td>    
		<table style="border: 1px solid black;">			
			<tr>
				<td style="width: 200px;">
					<div id="chart"></div>		
				</td>
			</tr>
		</table>
	</td>
	</tr>
	</table>
		<div id="info"></div>		
		<div id="description"></div>
			
	</BODY>
</HTML>
