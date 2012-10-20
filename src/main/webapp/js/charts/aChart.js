

var aChart={};


aChart.FAVORITE_COLOUR="#2BB8F0";//BLUE FROM FIREFOX OCEAN


//SHOW USING jqplot LIBRARY
aChart.showJQP=function(params){
	var divName=params.id;
	var type=params.type;
	var chartCube=params.cube;
	var colours=params.colours;

	if (chartCube.select instanceof Array) D.error("Can not chart when select clause is an array");


	////////////////////////////////////////////////////////////////////////////
	// COLOUR MANAGMENT
	////////////////////////////////////////////////////////////////////////////
	if (colours===undefined) colours=[aChart.FAVORITE_COLOUR];
	if (!(colours instanceof Array)) colours=[colours];
	var parts=chartCube.facets[0].domain.partitions;
	for(var i=0;i<parts.length;parts++) parts[i].colour=colours[i%colours.length];


	////////////////////////////////////////////////////////////////////////////
	// SERIES (ONLY IF MORE THAN ONE FACET)
	////////////////////////////////////////////////////////////////////////////
	var xaxis=chartCube.facets[chartCube.facets.length-1];
	var seriesLabels=[];
	if (chartCube.facets.length==2){
		seriesLabels=new SQL().calc2List({
			"from":
				chartCube.facets[0].domain.partitions,			//EACH SERIES NAMES
			"select":[
				{"name":"label", "value":"value"},
				{"name":"color", "value":"colour"}
			]
		}).list
	}//endif



	$.jqplot(
		divName,
		chartCube.data,
		{
			stackSeries: true,			//STACK
			title:chartCube.name,										//CHART NAME
			seriesDefaults:{
				renderer:(type=="bar"?$.jqplot.BarRenderer:undefined),
				fill: false,
				showMarker: false,

				markerOptions:{
					show:false
				},
				rendererOptions: {
					barPadding: 1,	  // number of pixels between adjacent bars in the same
					// group (same category or bin).
					barMargin: 3,	  // number of pixels between adjacent groups of bars.
					barDirection: 'vertical', // vertical or horizontal.
					barWidth: null,	 // width of the bars.  null to calculate automatically.
					shadowOffset: 2,	// offset from the bar edge to stroke the shadow.
					shadowDepth: 1,	 // nuber of strokes to make for the shadow.
					shadowAlpha: 0.1,   // transparency of the shadow.

					fillToZero: true
				}
			},
			series: seriesLabels,
			axes: {
				xaxis: {
					renderer: $.jqplot.CategoryAxisRenderer,
					label: xaxis.name,					//X AXIS NAME
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
					tickRenderer: $.jqplot.CanvasAxisTickRenderer,
					ticks:new SQL().calc2Array({
						"from":xaxis.domain.partitions,	//X AXIS TICK LABELS
						"select":{"value":"name"}
					}),
					tickOptions: {
						angle: -90,
						labelPosition: 'end',
						showLabel: true
					}
				},
				yaxis: {
					label: chartCube.select.name,						//Y AXIS NAME
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer
//							renderer: $.jqplot.LogAxisRenderer,
//							tickDistribution:'power'
				}
			},
			highlighter: {
				show: true,
				sizeAdjust: 7.5
			}
		}
	);


};

//PLOT USING THE Common Charting Components
aChart.showCCC=function(params){
	var divName=params.id;
	var type=params.type;
	var chartCube=params.cube;
	var colours=params.colours;

	if (chartCube.select instanceof Array) D.error("Can not chart when select clause is an array");


	////////////////////////////////////////////////////////////////////////////
	// COLOUR MANAGMENT
	////////////////////////////////////////////////////////////////////////////
	if (colours===undefined) colours=[aChart.FAVORITE_COLOUR];
	if (!(colours instanceof Array)) colours=[colours];
	var parts=chartCube.facets[0].domain.partitions;
	for(var i=0;i<parts.length;parts++) parts[i].colour=colours[i%colours.length];


	////////////////////////////////////////////////////////////////////////////
	// SERIES (ONLY IF MORE THAN ONE FACET)
	////////////////////////////////////////////////////////////////////////////
	var xaxis=chartCube.facets[chartCube.facets.length-1];
	var seriesLabels=[];
	if (chartCube.facets.length==2){
		seriesLabels=new SQL().calc2List({
			"from":
				chartCube.facets[0].domain.partitions,			//EACH SERIES NAMES
			"select":[
				{"name":"label", "value":"value"},
				{"name":"color", "value":"colour"}
			]
		}).list
	}//endif

	//STATIC MAP FROM MY CHART TYPES TO CCC CLASS NAMES
	var chartTypes={
		"line":"LineChart",
		"stackedline":"StackedAreaChart",
		"bar":"BarChart"
	};

	var chart = new pvc[chartTypes[type]]({
		canvas: divName,
		width: 800,
		height: 600,
		animate:false,
		title: chartCube.name,
		legend: true,
		legendPosition: "bottom",
		legendAlign: "center",

		orientation: 'vertical',
		timeSeries: (xaxis.domain.type=="time"),
		timeSeriesFormat: "%Y-%m-%d",

		showValues: false,
		originIsZero: this.originZero,
		yAxisPosition: "right",
		yAxisSize: 50,
		extensionPoints: {
			noDataMessage_text: "No Data To Chart",
			xAxisScale_dateTickFormat: "%Y/%m/%d",
			xAxisScale_dateTickPrecision: xaxis.domain.interval.milli
			//set in miliseconds
		}
	});

	var data=SQL.toTable(chartCube);


	var cccData = {
		"resultset":data,
		"metadata":[
			{
				"colIndex":1,
				"colType":"String",
				"colName":"Series"
			},
			{
				"colIndex":0,
				"colType":"String",
				"colName":"Categories"
			},
			{
				"colIndex":2,
				"colType":"Numeric",
				"colName":"Value"
			}
		]
	};

	chart.setData(cccData, {crosstabMode: false, seriesInRows: false});

	chart.render();


};
