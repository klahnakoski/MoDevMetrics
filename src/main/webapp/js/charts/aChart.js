

var aChart={};


aChart.FAVORITE_COLOUR="#2BB8F0";//BLUE FROM FIREFOX OCEAN


aChart.show=function(params){
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
