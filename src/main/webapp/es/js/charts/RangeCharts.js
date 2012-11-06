RangeChart = function(chartRequest){
	this.defaults();
	this.queries = chartRequest.requests;
	Util.copy(chartRequest, this);
	
	this.interval=Duration.newInstance(this.interval);
	this.groupSize = ("groupSize" in chartRequest) ? (chartRequest.groupSize - 1) : 0;
	this.request = null;
	this.dataSet = new DataSet();

	if (this.iterator == 'date'){
		this.startDate = convertStringToDate(chartRequest.startDate + "T00:00:00.000Z");
		this.endDate = convertStringToDate(chartRequest.endDate + "T00:00:00.000Z");
		this.dataSet.maxIndex = Math.floor(this.endDate.subtract(this.startDate, this.interval).divideBy(this.interval))-1;

	}
	else if (this.iterator == "integer"){
		this.iterateField = ("chartType" in chartRequest) ? chartRequest.iterateField : "days_open_accumulated";
		this.dataSet.maxIndex = chartRequest["iterations"] - 1;
	}

	D.println("ChangeChart Called.");
};

RangeChart.prototype.defaults=function(){
	this.evaluations = null;
	this.showSeries = [];
	this.chartTitle = "No chart title set.";
	this.originZero = false;
	this.chartType = "LineChart";
	this.groupSize = 0;
	this.groupCombine = "none";
	this.iterator = "date";
	this.track = false;
	this.baseline = [];
	this.interval=Duration.newInstance("day");
	this.useWindow=false;
};//endif


RangeChart.prototype.run = function(){
	if (this.iterator == 'date'){
		this.request = new DateRangeIterator({
			"callbackObject":this,
			"startDate":this.startDate,
			"endDate":this.endDate,
			"useWindow":this.useWindow,
			"interval":this.interval,
			"queries":this.queries
		});
	}
	else if (this.iterator == 'integer'){
		this.request = new RangeIterator(this, this.queries);
	}
};

RangeChart.prototype.renderChart = function(){
	document.getElementById(this.canvas).innerHTML = "";

	var timeSeries = true;
	var dateTick = getNumberOfDays(this.startDate, this.endDate);

	if (this.iterator == "integer")
		timeSeries = false;


	if (this.chartType == "LineChart" || this.chartType == undefined){
		chart = new pvc.LineChart(
			{
				canvas: this.canvas,
				width: 800,
				height: 600,
				animate:false,
				title: this.chartTitle,
				legend: true,
				legendPosition: "bottom",
				legendAlign: "center",

				orientation: 'vertical',
				timeSeries: timeSeries,
				timeSeriesFormat: "%Y-%m-%d",

				showValues: false,
				originIsZero: this.originZero,
				yAxisPosition: "right",
				yAxisSize: 50,
				extensionPoints: {
					noDataMessage_text: "No Data To Chart",
					xAxisScale_dateTickFormat: "%Y/%m/%d",
					xAxisScale_dateTickPrecision: dateTick / 25 * 1000 * 60 * 60 * 24
					//set in miliseconds
				}
			});
	}
	else if (this.chartType == "StackedAreaChart"){

		chart = new pvc.StackedAreaChart(
			{
				canvas: this.canvas,
				width: 800,
				height: 600,
				animate:false,
				title: this.chartTitle,
				legend: true,
				legendPosition: "bottom",
				legendAlign: "center",

				orientation: 'vertical',
				timeSeries: timeSeries,
				timeSeriesFormat: "%Y-%m-%d",

				showValues: false,
				originIsZero: this.originZero,
				yAxisPosition: "right",
				yAxisSize: 50,
				extensionPoints: {
					noDataMessage_text: "No Data To Chart",
					xAxisScale_dateTickFormat: "%Y/%m/%d",
					xAxisScale_dateTickPrecision: dateTick / 25 * 1000 * 60 * 60 * 24
					//set in miliseconds
				}
			});
	}
	chart.setData(this.ConvertToChartData(),
		{crosstabMode: false,
			seriesInRows: false});

	chart.render();
};

RangeChart.prototype.kill = function(){
	if (this.request != undefined){
		this.request.kill();
		this.request = null;
		return true;
	}

	return false;
};


//CAN NOLY HANDLE SERIES NAMES THE ARE VALID JAVASCRIPT VARIABLE NAMES
RangeChart.prototype.compileEvaluations = function(){
	for(var i=0;i<this.evaluations.length;i++){
		var name = this.evaluations[i].seriesName;
		var code = this.evaluations[i].code;

		var pre = "";
		var post = "";
		for(var q=0;q<this.queries.length;q++){
			var n = this.queries[q].seriesName;
			pre += "var " + n + "=__row[\"" + n + "\"];\n";
			post += "__row[\"" + n + "\"]=" + n + ";\n";
		}//for

		var f =
			"function(__row){\n" +
				pre +
				"__row." + name + "=(" + code + ");\n" +
				post +
				"}";

		this.evaluations[i] = eval(f);
	}//for
};//method


RangeChart.prototype.BuildEquationString = function(seriesName){
	var equationString = "";

	for(var i = 0; i < this.evaluations[seriesName].length; i++){
		var element = this.evaluations[seriesName][i];

		if (element == "")
			continue;

		if (isEven(i)){
			if (Math.isNumeric(element)){
				equationString += element;
			} else{
				equationString += "this.dataSet.store['" + element + "'][i].total ";
			}//endif
		} else{
			equationString += element + " ";
		}//endif

	}

	equationString += ";";

	return equationString;
};

RangeChart.prototype.Evaluate = function(){
	if (this.evaluations == null)
		return;
	//D.println("Evaluation Called.")

	for(var e=0;e<this.evaluations.length;e++){
		if (e in this.dataSet.store) this.dataSet.store[e] = {};

		var equation = this.BuildEquationString(e);

		//D.println("Build Equation: " + equation);

		var firstSeries = null;

		for(var k=0;k<this.dataSet.store.length;k++){
			var firstSeries = this.dataSet.store[k]
			break;
		}

		for(var i=0;i<firstSeries.length;i++){
			var value = eval(equation);

			//D.println("Evaluated String: " + value);
			if (this.iterator == "date")
				this.dataSet.addData(e, i, "date", firstSeries[i].date);

			this.dataSet.addData(e, i, "total", value);
		}
	}
};

RangeChart.prototype.Baseline = function(){
//	if (this.baseline.length == 0)
//		return;

	for(var i = 0; i < this.baseline.length; i++){
		var name = this.baseline[i].name;
		var data = this.baseline[i].data;
		var start = this.baseline[i].start;

		var startValue = this.dataSet.store[start][0].total;
		var baseline = startValue - this.dataSet.store[data][0].total;

		var dataSetStoreKeys=Object.keys(this.dataSet.store[data]);
		for(var ii=0;ii<dataSetStoreKeys.length;ii++){
			var x=dataSetStoreKeys[ii];
			if (this.iterator == "date") this.dataSet.addData(name, x, "date", this.dataSet.store[data][x].date);
			this.dataSet.addData(name, x, "total", this.dataSet.store[data][x].total + baseline);
		}
	}
}//231

RangeChart.prototype.Burndown = function(){
	if (!this.track)
		return;

	var startValue = 0;
	for(var k=0;k<this.dataSet.store.length;k++){
		if (!(this.showSeriesCheck(k)))
			continue;

		if (startValue < this.dataSet.store[k][0].total)
			startValue = this.dataSet.store[k][0].total;
	}

	this.dataSet.addData("track", 0, "date", convertDateToString(this.startDate));
	this.dataSet.addData("track", 0, "total", startValue);

	this.dataSet.addData("track", 1, "date", convertDateToString(this.endDate));
	this.dataSet.addData("track", 1, "total", 0);
};

RangeChart.prototype.ConvertToChartData = function(){

	this.Evaluate();
	this.Baseline();
	this.Burndown();

	var chartData = {
		"resultset":[],
		"metadata":[
			{
				"colIndex":0,
				"colType":"String",
				"colName":"Series"
			},
			{
				"colIndex":1,
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

	var dataSetKeys=Object.keys(this.dataSet.store);
	for(var kk=0;kk<dataSetKeys.length;kk++){
		var seriesName=dataSetKeys[kk];
		if (!(this.showSeriesCheck(seriesName))) continue;

		var groupCount = 0;
		var group = [];


		var dataSetStoreKeys=Object.keys(this.dataSet.store[seriesName]);
		for(var ii=0;ii<dataSetStoreKeys.length;ii++){
			var idName=dataSetStoreKeys[ii];
			var value = this.dataSet.store[seriesName][idName].total;

			if (this.groupSize > 1){
				if (groupCount < this.groupSize){
					group.push(value);
					groupCount++;
					continue;
				} else{
					groupCount = 0;

					for(var y = 0; y < group.length; y++){
						value += group[y];
					}

					if (this.groupCombine == "average"){
						value = value / (group.length + 1)
					}

					group = [];
				}
			}

			if (isNaN(value))
				value = 0;

			if (this.iterator == "date"){
				var dateString = this.dataSet.store[seriesName][idName].date.slice(0, 10);
				chartData.resultset.push([seriesName , dateString, value]);
			}
			else if (this.iterator == "integer"){
				chartData.resultset.push([ seriesName , parseInt(idName) + 1, value]);
			}
		}
	}

	//D.println( JSON.stringify( chartData ));

	return chartData;
};

RangeChart.prototype.showSeriesCheck = function(seriesName){
	if (this.showSeries.length == 0)
		return true;

	for(var j = 0; j < this.showSeries.length; j++){
		if (this.showSeries[j] == seriesName)
			return true;
	}

	return false;
};

RangeChart.prototype.success = function(requestObject, data){

	//D.println( JSON.stringify( data ));

//	var text = '{ "date": "' + convertDateToString(requestObject.currentDate) + '", "data : [';
//
//	for(var x = 0; x < data[0].hits.hits.length; x++)
//		text += JSON.stringify(data[0].hits.hits[x].fields) + ",";
//
//	text += ']}';
//
//	report.addMessage(text);

	for(var i = 0; i < data.length; i++){
		if (this.iterator == "date")
			this.dataSet.addData(requestObject.request.chartRequests[i].seriesName, requestObject.request.id, "date", convertDateToString(requestObject.currentDate));

		this.dataSet.addData(requestObject.request.chartRequests[i].seriesName, requestObject.request.id, "total", data[i].hits.total);
	}

	if (this.dataSet.currentIndex <= this.dataSet.maxIndex){

		status.message("Processing Query: " + ( this.dataSet.currentIndex + 1 ) + " out of " + parseInt(this.dataSet.maxIndex + 1));

		var progress = (this.dataSet.currentIndex + 1 ) / ( this.dataSet.maxIndex + 1 ) * 100;

		$("#progressbar").progressbar({
			"value" : progress
		});
	}
	else{
		status.message("Chart Rendering Complete");
	}

	this.renderChart();
};

RangeChart.prototype.error = function(requestObject, errorData, errorMsg, errorThrown){
	D.println(errorMsg + ": " + errorThrown);
};

chart = null;
report = new Status("report")