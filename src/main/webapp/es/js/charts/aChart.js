

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
	var parts=chartCube.edges[0].domain.partitions;
	for(var i=0;i<parts.length;parts++) parts[i].colour=colours[i%colours.length];


	////////////////////////////////////////////////////////////////////////////
	// SERIES (ONLY IF MORE THAN ONE EDGE)
	////////////////////////////////////////////////////////////////////////////
	var xaxis=chartCube.edges[chartCube.edges.length-1];
	var seriesLabels=[];
	if (chartCube.edges.length==2){
		seriesLabels=new CUBE().calc2List({
			"from":
				chartCube.edges[0].domain.partitions,			//EACH SERIES NAMES
			"select":[
				{"name":"label", "value":"value"},
				{"name":"color", "value":"Util.coalesce(colour, aChart.FAVORITE_COLOUR)"}
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
					ticks:new CUBE().calc2Array({
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
	var parts=chartCube.edges[0].domain.partitions;
	for(var i=0;i<parts.length;parts++) parts[i].colour=colours[i%colours.length];


	////////////////////////////////////////////////////////////////////////////
	// SERIES (ONLY IF MORE THAN ONE EDGE)
	////////////////////////////////////////////////////////////////////////////
	var xaxis=chartCube.edges[chartCube.edges.length-1];
	var seriesLabels=[];
	if (chartCube.edges.length==2){
		seriesLabels=new CUBE().calc2List({
			"from":
				chartCube.edges[0].domain.partitions,			//EACH SERIES NAMES
			"select":[
				{"name":"label", "value":"value"},
				{"name":"color", "value":"Util.coalesce(colour, aChart.FAVORITE_COLOUR)"}
			]
		}).list
	}//endif

	//STATIC MAP FROM MY CHART TYPES TO CCC CLASS NAMES
	var chartTypes={
		"line":"LineChart",
		"stacked":"StackedAreaChart",
		"bar":"BarChart"
	};

	var chart = new pvc[chartTypes[type]]({
		canvas: divName,
		width: 800,
		height: 600+(chartCube.edges[0].domain.partitions.length/17*24),
		animate:false,
		title: chartCube.name,
		legend: true,
		legendPosition: "bottom",
		legendAlign: "center",

		orientation: 'vertical',
		timeSeries: false,// (xaxis.domain.type=="time"),
		timeSeriesFormat: "%Y-%m-%d",

		showValues: false,
		originIsZero: this.originZero,
		yAxisPosition: "right",
		yAxisSize: 50,
		extensionPoints: {
			noDataMessage_text: "No Data To Chart"
//			xAxisScale_dateTickFormat: "%Y/%m/%d",
//			xAxisScale_dateTickPrecision: xaxis.domain.interval.milli
			//set in miliseconds
		}
	});

	var data=CUBE.toTable(chartCube);

//	D.println(CNV.Object2JSON(data));

//	data=CNV.JSON2Object('[ [ 408284, "Oct 01", 5 ], [ 408284, "Oct 02", 7 ], [ 408284, "Oct 03", 7 ], [ 408284, "Oct 04", 7 ], [ 408284, "Oct 05", 7 ], [ 408284, "Oct 06", 0 ], [ 408284, "Oct 07", 0 ], [ 408284, "Oct 08", 0 ], [ 655877, "Oct 01", 0 ], [ 655877, "Oct 02", 0 ], [ 655877, "Oct 03", 0 ], [ 655877, "Oct 04", 0 ], [ 655877, "Oct 05", 3 ], [ 655877, "Oct 06", 4 ], [ 655877, "Oct 07", 6 ], [ 655877, "Oct 08", 6 ], [ 731974, "Oct 01", 2 ], [ 731974, "Oct 02", 2 ], [ 731974, "Oct 03", 2 ], [ 731974, "Oct 04", 2 ], [ 731974, "Oct 05", 2 ], [ 731974, "Oct 06", 3 ], [ 731974, "Oct 07", 4 ], [ 731974, "Oct 08", 4 ], [ 770144, "Oct 01", 1 ], [ 770144, "Oct 02", 1 ], [ 770144, "Oct 03", 1 ], [ 770144, "Oct 04", 1 ], [ 770144, "Oct 05", 1 ], [ 770144, "Oct 06", 1 ], [ 770144, "Oct 07", 1 ], [ 770144, "Oct 08", 1 ], [ 785662, "Oct 01", 0 ], [ 785662, "Oct 02", 0 ], [ 785662, "Oct 03", 0 ], [ 785662, "Oct 04", 1 ], [ 785662, "Oct 05", 1 ], [ 785662, "Oct 06", 1 ], [ 785662, "Oct 07", 0 ], [ 785662, "Oct 08", 0 ], [ 790265, "Oct 01", 0 ], [ 790265, "Oct 02", 0 ], [ 790265, "Oct 03", 0 ], [ 790265, "Oct 04", 0 ], [ 790265, "Oct 05", 1 ], [ 790265, "Oct 06", 1 ], [ 790265, "Oct 07", 0 ], [ 790265, "Oct 08", 0 ], [ 790505, "Oct 01", 15 ], [ 790505, "Oct 02", 20 ], [ 790505, "Oct 03", 28 ], [ 790505, "Oct 04", 28 ], [ 790505, "Oct 05", 28 ], [ 790505, "Oct 06", 28 ], [ 790505, "Oct 07", 28 ], [ 790505, "Oct 08", 28 ], [ 793923, "Oct 01", 0 ], [ 793923, "Oct 02", 0 ], [ 793923, "Oct 03", 1 ], [ 793923, "Oct 04", 1 ], [ 793923, "Oct 05", 1 ], [ 793923, "Oct 06", 1 ], [ 793923, "Oct 07", 1 ], [ 793923, "Oct 08", 1 ], [ 794602, "Oct 01", 0 ], [ 794602, "Oct 02", 0 ], [ 794602, "Oct 03", 1 ], [ 794602, "Oct 04", 1 ], [ 794602, "Oct 05", 1 ], [ 794602, "Oct 06", 1 ], [ 794602, "Oct 07", 1 ], [ 794602, "Oct 08", 1 ], [ 795657, "Oct 01", 0 ], [ 795657, "Oct 02", 0 ], [ 795657, "Oct 03", 0 ], [ 795657, "Oct 04", 0 ], [ 795657, "Oct 05", 1 ], [ 795657, "Oct 06", 1 ], [ 795657, "Oct 07", 1 ], [ 795657, "Oct 08", 1 ], [ 795674, "Oct 01", 0 ], [ 795674, "Oct 02", 0 ], [ 795674, "Oct 03", 0 ], [ 795674, "Oct 04", 0 ], [ 795674, "Oct 05", 1 ], [ 795674, "Oct 06", 1 ], [ 795674, "Oct 07", 1 ], [ 795674, "Oct 08", 1 ], [ 795812, "Oct 01", 6 ], [ 795812, "Oct 02", 6 ], [ 795812, "Oct 03", 6 ], [ 795812, "Oct 04", 6 ], [ 795812, "Oct 05", 0 ], [ 795812, "Oct 06", 0 ], [ 795812, "Oct 07", 0 ], [ 795812, "Oct 08", 0 ], [ 795892, "Oct 01", 1 ], [ 795892, "Oct 02", 2 ], [ 795892, "Oct 03", 2 ], [ 795892, "Oct 04", 2 ], [ 795892, "Oct 05", 0 ], [ 795892, "Oct 06", 0 ], [ 795892, "Oct 07", 0 ], [ 795892, "Oct 08", 0 ], [ 795899, "Oct 01", 0 ], [ 795899, "Oct 02", 1 ], [ 795899, "Oct 03", 1 ], [ 795899, "Oct 04", 1 ], [ 795899, "Oct 05", 1 ], [ 795899, "Oct 06", 1 ], [ 795899, "Oct 07", 1 ], [ 795899, "Oct 08", 1 ], [ 796115, "Oct 01", 2 ], [ 796115, "Oct 02", 2 ], [ 796115, "Oct 03", 2 ], [ 796115, "Oct 04", 2 ], [ 796115, "Oct 05", 2 ], [ 796115, "Oct 06", 2 ], [ 796115, "Oct 07", 2 ], [ 796115, "Oct 08", 2 ], [ 796183, "Oct 01", 0 ], [ 796183, "Oct 02", 1 ], [ 796183, "Oct 03", 1 ], [ 796183, "Oct 04", 1 ], [ 796183, "Oct 05", 0 ], [ 796183, "Oct 06", 0 ], [ 796183, "Oct 07", 0 ], [ 796183, "Oct 08", 0 ], [ 796839, "Oct 01", 0 ], [ 796839, "Oct 02", 0 ], [ 796839, "Oct 03", 0 ], [ 796839, "Oct 04", 7 ], [ 796839, "Oct 05", 7 ], [ 796839, "Oct 06", 7 ], [ 796839, "Oct 07", 7 ], [ 796839, "Oct 08", 7 ], [ 797120, "Oct 01", 0 ], [ 797120, "Oct 02", 1 ], [ 797120, "Oct 03", 1 ], [ 797120, "Oct 04", 1 ], [ 797120, "Oct 05", 1 ], [ 797120, "Oct 06", 1 ], [ 797120, "Oct 07", 1 ], [ 797120, "Oct 08", 1 ], [ 797255, "Oct 01", 0 ], [ 797255, "Oct 02", 3 ], [ 797255, "Oct 03", 3 ], [ 797255, "Oct 04", 3 ], [ 797255, "Oct 05", 3 ], [ 797255, "Oct 06", 3 ], [ 797255, "Oct 07", 3 ], [ 797255, "Oct 08", 3 ], [ 797393, "Oct 01", 0 ], [ 797393, "Oct 02", 0 ], [ 797393, "Oct 03", 1 ], [ 797393, "Oct 04", 1 ], [ 797393, "Oct 05", 1 ], [ 797393, "Oct 06", 0 ], [ 797393, "Oct 07", 0 ], [ 797393, "Oct 08", 0 ], [ 797797, "Oct 01", 0 ], [ 797797, "Oct 02", 0 ], [ 797797, "Oct 03", 0 ], [ 797797, "Oct 04", 1 ], [ 797797, "Oct 05", 1 ], [ 797797, "Oct 06", 1 ], [ 797797, "Oct 07", 1 ], [ 797797, "Oct 08", 1 ], [ 798653, "Oct 01", 0 ], [ 798653, "Oct 02", 0 ], [ 798653, "Oct 03", 0 ], [ 798653, "Oct 04", 0 ], [ 798653, "Oct 05", 2 ], [ 798653, "Oct 06", 2 ], [ 798653, "Oct 07", 2 ], [ 798653, "Oct 08", 2 ], [ 798691, "Oct 01", 0 ], [ 798691, "Oct 02", 0 ], [ 798691, "Oct 03", 0 ], [ 798691, "Oct 04", 0 ], [ 798691, "Oct 05", 0 ], [ 798691, "Oct 06", 3 ], [ 798691, "Oct 07", 4 ], [ 798691, "Oct 08", 4 ]]')

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
