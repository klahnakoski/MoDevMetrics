/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript([
<<<<<<< HEAD
	"../../lib/webdetails/cdf/jquery.js",
	"../../lib/webdetails/cdf/jquery.tooltip.js",
	"../../lib/webdetails/lib/jquery.tipsy.js",
	"../../lib/webdetails/lib/protovis-d3.3.js",
	"../../lib/webdetails/lib/tipsy.js",
	"../../lib/webdetails/cdf/Base.js",

	"../../lib/webdetails/pvc/pvc.js",
	"../../lib/webdetails/pvc/pvcPanel.js",
	"../../lib/webdetails/pvc/pvcLegend.js",
	"../../lib/webdetails/pvc/pvcTimeseriesAbstract.js",
	"../../lib/webdetails/pvc/pvcCategoricalAbstract.js",
	"../../lib/webdetails/pvc/pvcWaterfall.js",
	"../../lib/webdetails/pvc/pvcPie.js",
	"../../lib/webdetails/pvc/pvcBar.js",
	"../../lib/webdetails/pvc/pvcLine.js",
	"../../lib/webdetails/pvc/pvcData.js",

	"../../lib/webdetails/pvcDocUtils.js"
=======

	"../../lib/ccc/cdf/jquery.js",
	"../../lib/ccc/lib/jquery.tipsy.js",
	"../../lib/ccc/lib/protovis-d3.3.js",
	"../../lib/ccc/lib/protovis-msie.js",
	"../../lib/ccc/lib/tipsy.js",
	"../../lib/ccc/def/def.js",

	"../../lib/ccc/pvc/pvc.js",
	"../../lib/ccc/pvc/pvc.text.js",
	"../../lib/ccc/pvc/pvc.color.js",
	"../../lib/ccc/pvc/pvc.trends.js",
	"../../lib/ccc/pvc/pvc.options.js",
	"../../lib/ccc/pvc/data/_data.js",
	"../../lib/ccc/pvc/data/meta/DimensionType.js",
	"../../lib/ccc/pvc/data/meta/ComplexType.js",
	"../../lib/ccc/pvc/data/meta/ComplexTypeProject.js",
	"../../lib/ccc/pvc/data/translation/TranslationOper.js",
	"../../lib/ccc/pvc/data/translation/MatrixTranslationOper.js",
	"../../lib/ccc/pvc/data/translation/CrosstabTranslationOper.js",
	"../../lib/ccc/pvc/data/translation/RelationalTranslationOper.js",
	"../../lib/ccc/pvc/data/Atom.js",
	"../../lib/ccc/pvc/data/Complex.js",
	"../../lib/ccc/pvc/data/ComplexView.js",
	"../../lib/ccc/pvc/data/Datum.js",
	"../../lib/ccc/pvc/data/Dimension.js",
	"../../lib/ccc/pvc/data/Data.js",
	"../../lib/ccc/pvc/data/Data.selected.js",
	"../../lib/ccc/pvc/data/GroupingSpec.js",
	"../../lib/ccc/pvc/data/DataOper.js",
	"../../lib/ccc/pvc/data/GroupingOper.js",
	"../../lib/ccc/pvc/data/LinearInterpolationOper.js",
	"../../lib/ccc/pvc/data/LinearInterpolationOperSeriesState.js",
	"../../lib/ccc/pvc/data/ZeroInterpolationOper.js",
	"../../lib/ccc/pvc/data/ZeroInterpolationOperSeriesState.js",
	"../../lib/ccc/pvc/data/Data.operations.js",
	"../../lib/ccc/pvc/data/Data.compat.js",
	"../../lib/ccc/pvc/visual/Role.js",
	"../../lib/ccc/pvc/visual/Scene.js",
	"../../lib/ccc/pvc/visual/Var.js",
	"../../lib/ccc/pvc/visual/sign/BasicSign.js",
	"../../lib/ccc/pvc/visual/sign/Sign.js",
	"../../lib/ccc/pvc/visual/sign/Panel.js",
	"../../lib/ccc/pvc/visual/sign/Label.js",
	"../../lib/ccc/pvc/visual/sign/Dot.js",
	"../../lib/ccc/pvc/visual/sign/Line.js",
	"../../lib/ccc/pvc/visual/sign/Area.js",
	"../../lib/ccc/pvc/visual/sign/Bar.js",
	"../../lib/ccc/pvc/visual/sign/PieSlice.js",
	"../../lib/ccc/pvc/visual/sign/Rule.js",
	"../../lib/ccc/pvc/visual/Context.js",
	"../../lib/ccc/pvc/visual/OptionsBase.js",
	"../../lib/ccc/pvc/visual/Axis.js",
	"../../lib/ccc/pvc/visual/CartesianAxis.js",
	"../../lib/ccc/pvc/visual/CartesianAxisRootScene.js",
	"../../lib/ccc/pvc/visual/CartesianAxisTickScene.js",
	"../../lib/ccc/pvc/visual/CartesianFocusWindow.js",
	"../../lib/ccc/pvc/visual/ColorAxis.js",
	"../../lib/ccc/pvc/visual/SizeAxis.js",
	"../../lib/ccc/pvc/visual/Legend.js",
	"../../lib/ccc/pvc/visual/legend/BulletRootScene.js",
	"../../lib/ccc/pvc/visual/legend/BulletGroupScene.js",
	"../../lib/ccc/pvc/visual/legend/BulletItemScene.js",
	"../../lib/ccc/pvc/visual/legend/BulletItemSceneSelection.js",
	"../../lib/ccc/pvc/visual/legend/BulletItemSceneVisibility.js",
	"../../lib/ccc/pvc/visual/legend/BulletItemRenderer.js",
	"../../lib/ccc/pvc/visual/legend/BulletItemDefaultRenderer.js",
	"../../lib/ccc/pvc/visual/plot/Plot.js",
	"../../lib/ccc/pvc/visual/plot/CartesianPlot.js",
	"../../lib/ccc/pvc/visual/plot/CategoricalPlot.js",
	"../../lib/ccc/pvc/visual/plot/BarPlotAbstract.js",
	"../../lib/ccc/pvc/visual/plot/BarPlot.js",
	"../../lib/ccc/pvc/visual/plot/NormalizedBarPlot.js",
	"../../lib/ccc/pvc/visual/plot/WaterfallPlot.js",
	"../../lib/ccc/pvc/visual/plot/PointPlot.js",
	"../../lib/ccc/pvc/visual/plot/MetricXYPlot.js",
	"../../lib/ccc/pvc/visual/plot/MetricPointPlot.js",
	"../../lib/ccc/pvc/visual/plot/PiePlot.js",
	"../../lib/ccc/pvc/visual/plot/HeatGridPlot.js",
	"../../lib/ccc/pvc/visual/plot/BoxPlot.js",
	"../../lib/ccc/pvc/visual/plot/BulletPlot.js",
	"../../lib/ccc/pvc/pvcAbstract.js",
	"../../lib/ccc/pvc/pvcBaseChart.js",
	"../../lib/ccc/pvc/pvcBaseChart.visualRoles.js",
	"../../lib/ccc/pvc/pvcBaseChart.data.js",
	"../../lib/ccc/pvc/pvcBaseChart.plots.js",
	"../../lib/ccc/pvc/pvcBaseChart.axes.js",
	"../../lib/ccc/pvc/pvcBaseChart.panels.js",
	"../../lib/ccc/pvc/pvcBaseChart.selection.js",
	"../../lib/ccc/pvc/pvcBaseChart.extension.js",
	"../../lib/ccc/pvc/pvcBasePanel.js",
	"../../lib/ccc/pvc/pvcPlotPanel.js",
	"../../lib/ccc/pvc/pvcMultiChartPanel.js",
	"../../lib/ccc/pvc/pvcTitlePanelAbstract.js",
	"../../lib/ccc/pvc/pvcTitlePanel.js",
	"../../lib/ccc/pvc/pvcLegendPanel.js",
	"../../lib/ccc/pvc/pvcCartesianAbstract.js",
	"../../lib/ccc/pvc/pvcGridDockingPanel.js",
	"../../lib/ccc/pvc/pvcCartesianGridDockingPanel.js",
	"../../lib/ccc/pvc/pvcCartesianAbstractPanel.js",
	"../../lib/ccc/pvc/pvcPlotBgPanel.js",
	"../../lib/ccc/pvc/pvcCategoricalAbstract.js",
	"../../lib/ccc/pvc/pvcCategoricalAbstractPanel.js",
	"../../lib/ccc/pvc/pvcAxisPanel.js",
	"../../lib/ccc/pvc/pvcAxisTitlePanel.js",
	"../../lib/ccc/pvc/pvcPiePanel.js",
	"../../lib/ccc/pvc/pvcPieChart.js",
	"../../lib/ccc/pvc/pvcBarAbstractPanel.js",
	"../../lib/ccc/pvc/pvcBarAbstract.js",
	"../../lib/ccc/pvc/pvcBarPanel.js",
	"../../lib/ccc/pvc/pvcBarChart.js",
	"../../lib/ccc/pvc/pvcNormalizedBarPanel.js",
	"../../lib/ccc/pvc/pvcNormalizedBarChart.js",
	"../../lib/ccc/pvc/visual/legend/WaterfallBulletGroupScene.js",
	"../../lib/ccc/pvc/pvcWaterfallPanel.js",
	"../../lib/ccc/pvc/pvcWaterfallChart.js",
	"../../lib/ccc/pvc/pvcPointPanel.js",
	"../../lib/ccc/pvc/pvcPoint.js",
	"../../lib/ccc/pvc/pvcHeatGridPanel.js",
	"../../lib/ccc/pvc/pvcHeatGridChart.js",
	"../../lib/ccc/pvc/pvcMetricXYAbstract.js",
	"../../lib/ccc/pvc/data/translation/MetricPointChartTranslationOper.js",
	"../../lib/ccc/pvc/pvcMetricPointPanel.js",
	"../../lib/ccc/pvc/pvcMetricPoint.js",
	"../../lib/ccc/pvc/pvcBulletChart.js",
	"../../lib/ccc/pvc/pvcParallelCoordinates.js",
	"../../lib/ccc/pvc/pvcDataTree.js",
	"../../lib/ccc/pvc/data/translation/BoxplotChartTranslationOper.js",
	"../../lib/ccc/pvc/pvcBoxplotPanel.js",
	"../../lib/ccc/pvc/pvcBoxplotChart.js"
>>>>>>> 20130316
]);


var aChart={};

aChart.FAVORITE_COLOUR="#2BB8F0";//BLUE FROM FIREFOX OCEAN


aChart.PVC_TIME_FORMAT="%y-%m-%d %H:%M:%S";
aChart.TIME_FORMAT="yyyy-MM-dd HH:mm:ss";


aChart.getAxisLabels=function(axis){
	var labels=[];
	if (axis.domain.type == "time"){
		if (axis.domain.allowNulls) D.error("Charting lib can not handle NULL domain value.");
//		var bestFormat = Date.getBestFormat(axis.domain.min, axis.domain.max, axis.domain.interval);
//		var bestFormat=aChart.TIME_FORMAT;  //WILL NOT WORK UNTIL ALL NULL PARTS ARE REMOVED
		axis.domain.partitions.forall(function(v, i){
			if (v instanceof String){
				labels.push(v);
			} else if (v instanceof Date){
				labels.push(v.format(aChart.TIME_FORMAT));
			} else{
				 var v2=v.name;
				labels.push(v2); 
			}//endif
		});
	} else if (axis.domain.type == "duration"){
		axis.domain.partitions.forall(function(v, i){
			if (v instanceof String){
				labels.push(v);
			} else if (v.milli === undefined){
				labels.push(v.value.toString());
			} else{
				labels.push(v.toString());
			}//endif
		});
	} else if (axis.domain.type == "linear"){
		axis.domain.partitions.forall(function(v, i){
			labels.push(v.name);
		});
	} else{
		axis.domain.partitions.forall(function(v, i){
			if (v instanceof String){
				labels.push(v);
			}else if (aMath.isNumeric(v)){
				labels.push(""+v);
			}else{
				labels.push(""+axis.domain.end(v));
			}//endif
		});
	}//endif
	if (axis.allowNulls) labels.push(axis.domain.NULL.name);
	return labels;
};//method


aChart.showPie=function(params){
	var divName=params.id;

	var type=params.type;
	var chartCube=params.cube;

	if (chartCube.edges.length!=1) D.error("Only one dimension suuported");
	if (chartCube.select instanceof Array) D.error("Can not chart when select clause is an array");


	var seriesLabels=aChart.getAxisLabels(chartCube.edges[0]);


	var chartParams={
		canvas: divName,
		width: 400,
		height: 400,
		animate:false,
		title: chartCube.name,
		legend: true,
		legendPosition: "right",
//		legendAlign: "center",
		legendSize:100,
		orientation: 'vertical',
		timeSeries: false, //(xaxis.domain.type=="time"),
//		timeSeriesFormat: aChart.PVC_TIME_FORMAT,

		showValues: false,
		extensionPoints: {
			noDataMessage_text: "No Data To Chart"
//			xAxisLabel_textAngle: aMath.PI/4,
//			xAxisLabel_textAlign: "left",
//			xAxisLabel_textBaseline: "top"
//			xAxisScale_dateTickFormat: "%Y/%m/%d",
//			xAxisScale_dateTickPrecision: xaxis.domain.interval.milli
			//set in miliseconds
		},
		"clickable": true,
		"clickAction":function(series, x, d, elem){bugClicker(chartCube, series, x, d, elem);}
	};
	Map.copy(params, chartParams);

	var chart = new pvc.PieChart(chartParams);

	//FILL THE CROSS TAB DATASTUCTURE TO THE FORMAT EXPECTED (2D array of rows
	//first row is series names, first column of each row is category name
	var data=chartCube.cube.map(function(v, i){return [seriesLabels[i], v]});
//	var metadata=[{"colName":"name"}, {"colName":"value"}];


//	var data=chartCube.cube.copy();
//	data.splice(0,0,"value");
//
////	data[0].splice(0,0,"value");
//
//	var metadata=seriesLabels.map(function(v, i){return {"colName":v};});
//	metadata.splice(0,0,{"colName":"x"});





	var cccData = {
		"resultset":data,
		"metadata":[{
			"colIndex":0,
			"colType":"String",
			"colName":"Categories"
		},{
			"colIndex":1,
			"colType":"Numeric",
			"colName":"Value"
		}]
	};

	chart.setData(cccData, {crosstabMode: false, seriesInRows: false});

	chart.render();

};//method






//PLOT USING THE Common Charting Components
aChart.show=function(params){
	var divName=params.id;

	var type=params.type;
	var chartCube=params.cube;
//	var colours=params.colours;


	////////////////////////////////////////////////////////////////////////////
	// SERIES (ONLY IF MORE THAN ONE EDGE)
	////////////////////////////////////////////////////////////////////////////
	var xaxis=chartCube.edges[chartCube.edges.length-1];
	var seriesLabels=aChart.getAxisLabels(xaxis);

	var categoryLabels;
	if (chartCube.edges.length==1 || chartCube.edges[0].domain.partitions.length==0){
		categoryLabels=CUBE.select2Array(chartCube.select).map(function(v, i){
			return v.name;
		});
	}else if (chartCube.edges.length==2){
		if (chartCube.select instanceof Array){
			D.error("Can not chart when select clause is an array");
		}//endif

		categoryLabels=aChart.getAxisLabels(chartCube.edges[0]);
	}//endif





	////////////////////////////////////////////////////////////////////////////
	// STYLES
	////////////////////////////////////////////////////////////////////////////
	var styles = [
		{"color":"#1f77b4"},
		{"color":"#ff7f0e"},
		{"color":"#2ca02c"},
		{"color":"#d62728"},
		{"color":"#9467bd"},
		{"color":"#8c564b"},
		{"color":"#e377c2"},
		{"color":"#7f7f7f"},
		{"color":"#bcbd22"},
		{"color":"#17becf"}
	];
	if (chartCube.edges.length==1){
		if (chartCube.select instanceof Array){
			for(let i=0;i<chartCube.select.length;i++){
				if (chartCube.select[i].color!==undefined) D.error("expecting color in style attribute (style.color)");
				if (chartCube.select[i].style!==undefined) styles[i]=chartCube.select[i].style;
			}//for
		}else{
			if (chartCube.select.color!==undefined) D.error("expecting color in style attribute (style.color)");
			if (chartCube.select.style!==undefined) styles[0]=chartCube.select.style;
		}//endif
	}else{
		let parts=chartCube.edges[0].domain.partitions;
		for(let i=0;i<parts.length;i++){
			if (parts[i].color!==undefined) D.error("expecting color in style attribute (style.color)");
			if (parts[i].style!==undefined) styles[i]=parts[i].style;
		}//for
	}//endif


	//STATIC MAP FROM MY CHART TYPES TO CCC CLASS NAMES
	var chartTypes={
		"line":"LineChart",
		"stackedarea":"StackedAreaChart",
		"stacked":"StackedAreaChart",
		"area":"StackedAreaChart",
		"stackedbar":"StackedBarChart",
		"bar":"BarChart",
		"bullet":"BulletChart"
	};

	var height;
	if (chartCube.edges.length>1){
		height=600+(chartCube.edges[0].domain.partitions.length/17*24);
	}else{
		height=600;
	}

	var chartParams={
		canvas: divName,
		width: 800,
		height: height,
		animate:false,
		title: chartCube.name,
		legend: (chartCube.edges.length!=1 || CUBE.select2Array(chartCube.select).length>1),		//DO NOT SHOW LEGEND IF NO CATEGORIES
		legendPosition: "bottom",
		legendAlign: "center",

		orientation: 'vertical',
		timeSeries: (xaxis.domain.type=="time"),
		timeSeriesFormat: aChart.JavaDateFormat2ProtoVisDateFormat(xaxis.domain.format),
		showDots:true,
		showValues: false,
		originIsZero: this.originZero,
		yAxisPosition: "right",
		yAxisSize: 50,
		xAxisSize: 100,
		"colors":styles.map(function(s){return s.color;}),
		extensionPoints: {
			noDataMessage_text: "No Data To Chart",
			xAxisLabel_textAngle: aMath.PI/4,
			xAxisLabel_textAlign: "left",
			xAxisLabel_textBaseline: "top",
//			xAxisScale_dateTickFormat: "%Y/%m/%d",
//			xAxisScale_dateTickPrecision: xaxis.domain.interval.milli
			//set in miliseconds
		    dot_shapeRadius: 1,
            dot_shape:"circle",
			line_lineWidth: 4
//			line_strokeStyle:
		},
		"clickable": true,
		"clickAction":function(series, x, d, elem){
			bugClicker(chartCube, series, x, d, elem);
			return true;
		}
	};

	{//COPY EXTENSION POINTS TO PARAMETERS
		var extPoints={};
		Map.copy(chartParams.extensionPoints, extPoints);
		if (params.extensionPoints) Map.copy(params.extensionPoints, extPoints);
		if (params.timeSeriesFormat) chartParams.timeSeriesFormat=aChart.JavaDateFormat2ProtoVisDateFormat(params.timeSeriesFormat);

		Map.copy(params, chartParams);
		chartParams.extensionPoints=extPoints;
	}
	var chart = new pvc[chartTypes[type]](chartParams);

	//FILL THE CROSS TAB DATA STRUCTURE TO THE FORMAT EXPECTED (2D array of rows
	//first row is series names, first column of each row is category name
	var data;
	if (chartCube.edges.length==1){
		if (chartCube.select instanceof Array){
			//GIVE EACH SELECT A ROW
			data=[];
			for(var s=0;s<chartCube.select.length;s++){
				var row=chartCube.cube.map(function(v, i){
					return v[chartCube.select[s].name];
				});
				data.push(row);
			}//for
		}else{
			data=[chartCube.cube];
		}//endif
	}else{
		data=chartCube.cube.copy();
	}//endif
	
	data.forall(function(v,i,d){
		v=v.copy();
		v.splice(0,0, categoryLabels[i]);
		d[i]=v;
	});

	var metadata=seriesLabels.map(function(v, i){ return {"colName":v};});
	metadata.splice(0,0,{"colName":"x"});


//	D.println(CNV.Object2JSON(data));

//	data=CNV.JSON2Object('[ [ 408284, "Oct 01", 5 ], [ 408284, "Oct 02", 7 ], [ 408284, "Oct 03", 7 ], [ 408284, "Oct 04", 7 ], [ 408284, "Oct 05", 7 ], [ 408284, "Oct 06", 0 ], [ 408284, "Oct 07", 0 ], [ 408284, "Oct 08", 0 ], [ 655877, "Oct 01", 0 ], [ 655877, "Oct 02", 0 ], [ 655877, "Oct 03", 0 ], [ 655877, "Oct 04", 0 ], [ 655877, "Oct 05", 3 ], [ 655877, "Oct 06", 4 ], [ 655877, "Oct 07", 6 ], [ 655877, "Oct 08", 6 ], [ 731974, "Oct 01", 2 ], [ 731974, "Oct 02", 2 ], [ 731974, "Oct 03", 2 ], [ 731974, "Oct 04", 2 ], [ 731974, "Oct 05", 2 ], [ 731974, "Oct 06", 3 ], [ 731974, "Oct 07", 4 ], [ 731974, "Oct 08", 4 ], [ 770144, "Oct 01", 1 ], [ 770144, "Oct 02", 1 ], [ 770144, "Oct 03", 1 ], [ 770144, "Oct 04", 1 ], [ 770144, "Oct 05", 1 ], [ 770144, "Oct 06", 1 ], [ 770144, "Oct 07", 1 ], [ 770144, "Oct 08", 1 ], [ 785662, "Oct 01", 0 ], [ 785662, "Oct 02", 0 ], [ 785662, "Oct 03", 0 ], [ 785662, "Oct 04", 1 ], [ 785662, "Oct 05", 1 ], [ 785662, "Oct 06", 1 ], [ 785662, "Oct 07", 0 ], [ 785662, "Oct 08", 0 ], [ 790265, "Oct 01", 0 ], [ 790265, "Oct 02", 0 ], [ 790265, "Oct 03", 0 ], [ 790265, "Oct 04", 0 ], [ 790265, "Oct 05", 1 ], [ 790265, "Oct 06", 1 ], [ 790265, "Oct 07", 0 ], [ 790265, "Oct 08", 0 ], [ 790505, "Oct 01", 15 ], [ 790505, "Oct 02", 20 ], [ 790505, "Oct 03", 28 ], [ 790505, "Oct 04", 28 ], [ 790505, "Oct 05", 28 ], [ 790505, "Oct 06", 28 ], [ 790505, "Oct 07", 28 ], [ 790505, "Oct 08", 28 ], [ 793923, "Oct 01", 0 ], [ 793923, "Oct 02", 0 ], [ 793923, "Oct 03", 1 ], [ 793923, "Oct 04", 1 ], [ 793923, "Oct 05", 1 ], [ 793923, "Oct 06", 1 ], [ 793923, "Oct 07", 1 ], [ 793923, "Oct 08", 1 ], [ 794602, "Oct 01", 0 ], [ 794602, "Oct 02", 0 ], [ 794602, "Oct 03", 1 ], [ 794602, "Oct 04", 1 ], [ 794602, "Oct 05", 1 ], [ 794602, "Oct 06", 1 ], [ 794602, "Oct 07", 1 ], [ 794602, "Oct 08", 1 ], [ 795657, "Oct 01", 0 ], [ 795657, "Oct 02", 0 ], [ 795657, "Oct 03", 0 ], [ 795657, "Oct 04", 0 ], [ 795657, "Oct 05", 1 ], [ 795657, "Oct 06", 1 ], [ 795657, "Oct 07", 1 ], [ 795657, "Oct 08", 1 ], [ 795674, "Oct 01", 0 ], [ 795674, "Oct 02", 0 ], [ 795674, "Oct 03", 0 ], [ 795674, "Oct 04", 0 ], [ 795674, "Oct 05", 1 ], [ 795674, "Oct 06", 1 ], [ 795674, "Oct 07", 1 ], [ 795674, "Oct 08", 1 ], [ 795812, "Oct 01", 6 ], [ 795812, "Oct 02", 6 ], [ 795812, "Oct 03", 6 ], [ 795812, "Oct 04", 6 ], [ 795812, "Oct 05", 0 ], [ 795812, "Oct 06", 0 ], [ 795812, "Oct 07", 0 ], [ 795812, "Oct 08", 0 ], [ 795892, "Oct 01", 1 ], [ 795892, "Oct 02", 2 ], [ 795892, "Oct 03", 2 ], [ 795892, "Oct 04", 2 ], [ 795892, "Oct 05", 0 ], [ 795892, "Oct 06", 0 ], [ 795892, "Oct 07", 0 ], [ 795892, "Oct 08", 0 ], [ 795899, "Oct 01", 0 ], [ 795899, "Oct 02", 1 ], [ 795899, "Oct 03", 1 ], [ 795899, "Oct 04", 1 ], [ 795899, "Oct 05", 1 ], [ 795899, "Oct 06", 1 ], [ 795899, "Oct 07", 1 ], [ 795899, "Oct 08", 1 ], [ 796115, "Oct 01", 2 ], [ 796115, "Oct 02", 2 ], [ 796115, "Oct 03", 2 ], [ 796115, "Oct 04", 2 ], [ 796115, "Oct 05", 2 ], [ 796115, "Oct 06", 2 ], [ 796115, "Oct 07", 2 ], [ 796115, "Oct 08", 2 ], [ 796183, "Oct 01", 0 ], [ 796183, "Oct 02", 1 ], [ 796183, "Oct 03", 1 ], [ 796183, "Oct 04", 1 ], [ 796183, "Oct 05", 0 ], [ 796183, "Oct 06", 0 ], [ 796183, "Oct 07", 0 ], [ 796183, "Oct 08", 0 ], [ 796839, "Oct 01", 0 ], [ 796839, "Oct 02", 0 ], [ 796839, "Oct 03", 0 ], [ 796839, "Oct 04", 7 ], [ 796839, "Oct 05", 7 ], [ 796839, "Oct 06", 7 ], [ 796839, "Oct 07", 7 ], [ 796839, "Oct 08", 7 ], [ 797120, "Oct 01", 0 ], [ 797120, "Oct 02", 1 ], [ 797120, "Oct 03", 1 ], [ 797120, "Oct 04", 1 ], [ 797120, "Oct 05", 1 ], [ 797120, "Oct 06", 1 ], [ 797120, "Oct 07", 1 ], [ 797120, "Oct 08", 1 ], [ 797255, "Oct 01", 0 ], [ 797255, "Oct 02", 3 ], [ 797255, "Oct 03", 3 ], [ 797255, "Oct 04", 3 ], [ 797255, "Oct 05", 3 ], [ 797255, "Oct 06", 3 ], [ 797255, "Oct 07", 3 ], [ 797255, "Oct 08", 3 ], [ 797393, "Oct 01", 0 ], [ 797393, "Oct 02", 0 ], [ 797393, "Oct 03", 1 ], [ 797393, "Oct 04", 1 ], [ 797393, "Oct 05", 1 ], [ 797393, "Oct 06", 0 ], [ 797393, "Oct 07", 0 ], [ 797393, "Oct 08", 0 ], [ 797797, "Oct 01", 0 ], [ 797797, "Oct 02", 0 ], [ 797797, "Oct 03", 0 ], [ 797797, "Oct 04", 1 ], [ 797797, "Oct 05", 1 ], [ 797797, "Oct 06", 1 ], [ 797797, "Oct 07", 1 ], [ 797797, "Oct 08", 1 ], [ 798653, "Oct 01", 0 ], [ 798653, "Oct 02", 0 ], [ 798653, "Oct 03", 0 ], [ 798653, "Oct 04", 0 ], [ 798653, "Oct 05", 2 ], [ 798653, "Oct 06", 2 ], [ 798653, "Oct 07", 2 ], [ 798653, "Oct 08", 2 ], [ 798691, "Oct 01", 0 ], [ 798691, "Oct 02", 0 ], [ 798691, "Oct 03", 0 ], [ 798691, "Oct 04", 0 ], [ 798691, "Oct 05", 0 ], [ 798691, "Oct 06", 3 ], [ 798691, "Oct 07", 4 ], [ 798691, "Oct 08", 4 ]]')

	var cccData = {
		"resultset":data,
		"metadata":metadata
	};

	chart.setData(cccData, {crosstabMode: true, seriesInRows: true});
	chart.render();

	//STARTS AS VISIBLE, SO TOGGLE TO HIDE
	styles.forall(function(s, i){ if (s.visibility && s.visibility=="hidden") chart.legendPanel.toggleVisibility(i);});

//	chart.basePanel.chart.legendPanel

	//ADD BUTTON TO SHOW SHEET
	if (params.sheetDiv){


		var sheetButtonID=divName+"-showSheet";
		var html='<div id='+CNV.String2Quote(sheetButtonID)+' class="toolbutton" style="right:3;bottom:3" title="Show Table"><img src="'+Settings.imagePath+'/Spreadsheet.png"></div>';


		$("#"+divName).append(html);
		$("#"+sheetButtonID).click(function(){
			var oldHtml=$("#"+params.sheetDiv).html();
			var newHtml=CNV.Cube2HTMLTable(chartCube);
			
			if (oldHtml!=""){
				$("#"+params.sheetDiv).html("");
			}else{
				$("#"+params.sheetDiv).html(newHtml);
			}//endif
		});
	}//endif


};

var BZ_SHOW_BUG_LIMIT=1000;
var bugClicker=function(query, series, x, d, elem){
	try{
		//We can decide to drilldown, or show a bug list.
		//Sometimes drill down is not available, and bug list is too big, so nothing happens
		//When there is a drilldown, the decision to show bugs is made at a lower count (prefering drilldown)
		aThread.run(function(){
			var specific;
			if (query.edges.length==2){
				specific=CUBE.specificBugs(query, [series, x]);
			}else{
				specific=CUBE.specificBugs(query, [x]);
			}//endif



//			var specific=CUBE.specificBugs(query, [series, x]);
			var buglist=(yield (ESQuery.run(specific))).list;
//			buglist=buglist.list.map(function(b){return b.bug_id;});
			
			if (buglist.length>BZ_SHOW_BUG_LIMIT){
				D.alert("Too many bugs. Truncating to "+BZ_SHOW_BUG_LIMIT+".", function(){
					Bugzilla.showBugs(buglist.substring(0, BZ_SHOW_BUG_LIMIT));
				});
			}else{
				Bugzilla.showBugs(buglist);
			}//endif

		});



	}catch(e){
		//DO NOTHING
	}//try
};


aChart.JavaDateFormat2ProtoVisDateFormat=function(format){
	if (format===undefined) return undefined;
	return format
		.replaceAll('yyyy', '%y')
		.replaceAll('MM', '%m')
		.replaceAll('dd', '%d')
		.replaceAll('HH', '%H')
		.replaceAll('mm', '%M')
		.replaceAll('ss', '%S')
	;
};