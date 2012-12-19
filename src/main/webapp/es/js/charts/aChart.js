

importScript("../../lib/webdetails/cdf/Base.js");
importScript("../../lib/webdetails/cdf/jquery.tooltip.js");
importScript("../../lib/webdetails/data/q01-01.js");
importScript("../../lib/webdetails/lib/protovis-d3.3.js");
importScript("../../lib/webdetails/lib/jquery.tipsy.js");
importScript("../../lib/webdetails/lib/tipsy.js");


importScript("../../lib/webdetails/pvc/pvc.js");
importScript("../../lib/webdetails/pvc/pvcPanel.js");
importScript("../../lib/webdetails/pvc/pvcLegend.js");
importScript("../../lib/webdetails/pvc/pvcTimeseriesAbstract.js");
importScript("../../lib/webdetails/pvc/pvcCategoricalAbstract.js");
importScript("../../lib/webdetails/pvc/pvcWaterfall.js");
importScript("../../lib/webdetails/pvc/pvcPie.js");
importScript("../../lib/webdetails/pvc/pvcBar.js");
importScript("../../lib/webdetails/pvc/pvcLine.js");
importScript("../../lib/webdetails/pvc/pvcData.js");


importScript("../../lib/webdetails/pvcDocUtils.js");


var aChart={};

aChart.FAVORITE_COLOUR="#2BB8F0";//BLUE FROM FIREFOX OCEAN


aChart.PVC_TIME_FORMAT="%y-%m-%d %H:%M:%S";
aChart.TIME_FORMAT="yyyy-MM-dd HH:mm:ss";


aChart.getAxisLabels=function(axis){
	var labels=[];
	if (axis.domain.type == "time"){
		if (axis.domain.allowNulls) D.error("Charting lib can not handle NULL domain value.");
//		var bestFormat = Date.getBestFormat(axis.domain.min, axis.domain.max, axis.domain.interval);
		var bestFormat=aChart.TIME_FORMAT;  //WILL NOT WORK UNTIL ALL NULL PARTS ARE REMOVED
		axis.domain.partitions.forall(function(v, i){
			if (v instanceof String){
				labels.push(v);
			} else if (v instanceof Date){
				labels.push(v.format(bestFormat));
			} else{
				labels.push(v.value.format(bestFormat));
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
			}else if (Math.isNumeric(v)){
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
//			xAxisLabel_textAngle: Math.PI/4,
//			xAxisLabel_textAlign: "left",
//			xAxisLabel_textBaseline: "top"
//			xAxisScale_dateTickFormat: "%Y/%m/%d",
//			xAxisScale_dateTickPrecision: xaxis.domain.interval.milli
			//set in miliseconds
		},
		"clickable": true,
		"clickAction":function(series, x, d, elem){bugClicker(chartCube, series, x, d, elem);}
	};
	Util.copy(params, chartParams);

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





//	////////////////////////////////////////////////////////////////////////////
//	// COLOUR MANAGMENT
//	////////////////////////////////////////////////////////////////////////////
//	if (colours===undefined) colours=[aChart.FAVORITE_COLOUR];
//	if (!(colours instanceof Array)) colours=[colours];
//	var parts=chartCube.edges[0].domain.partitions;
//	for(var i=0;i<parts.length;parts++) parts[i].colour=colours[i%colours.length];


	//STATIC MAP FROM MY CHART TYPES TO CCC CLASS NAMES
	var chartTypes={
		"line":"LineChart",
		"stacked":"StackedAreaChart",
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
		legend: chartCube.edges.length!=1,		//DO NOT SHOW LEGEND IF NO CATEGORIES
		legendPosition: "bottom",
		legendAlign: "center",

		orientation: 'vertical',
		timeSeries: (xaxis.domain.type=="time"),
		timeSeriesFormat: aChart.PVC_TIME_FORMAT,
//		showDots:true,
		showValues: false,
		originIsZero: this.originZero,
		yAxisPosition: "right",
		yAxisSize: 50,
		xAxisSize: 100,
		extensionPoints: {
			noDataMessage_text: "No Data To Chart",
			xAxisLabel_textAngle: Math.PI/4,
			xAxisLabel_textAlign: "left",
			xAxisLabel_textBaseline: "top"
//			xAxisScale_dateTickFormat: "%Y/%m/%d",
//			xAxisScale_dateTickPrecision: xaxis.domain.interval.milli
			//set in miliseconds
		},
		"clickable": true,
		"clickAction":function(series, x, d, elem){
			bugClicker(chartCube, series, x, d, elem);
			return true;
		}
	};
	Util.copy(params, chartParams);

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


};


var bugClicker=function(query, series, x, d, elem){
	try{
		//We can decide to drilldown, or show a bug list.
		//Someimes drill down is not available, and bug list is too big, so nothing happens
		//When there is a drilldown, the decision to show bugs is made at a lower count (prefering drilldown)
		if (d>300){
			D.alert("Too many bugs (>300)");
			return;
		}//endif
		aThread.run(function(){
			var specific;
			if (query.edges.length==2){
				specific=CUBE.specificBugs(query, [series, x]);
			}else{
				specific=CUBE.specificBugs(query, [x]);
			}//endif
			var buglist=(yield (ESQuery.run(specific)));
			buglist=buglist.list.map(function(b){return b.bug_id;});
			Bugzilla.showBugs(buglist);
		});
	}catch(e){
		//DO NOTHING
	}//try
};
