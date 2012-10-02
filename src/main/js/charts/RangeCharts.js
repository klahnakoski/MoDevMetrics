RangeChart = function(chartRequest)
{
	this.queries = chartRequest.requests;
	this.canvas = chartRequest.canvas;
	this.evaluations = ("evaluations" in chartRequest)?chartRequest.evaluations:null;
	this.showSeries = ("showSeries" in chartRequest)?(chartRequest.showSeries):[];
	this.chartTitle = ("chartTitle" in chartRequest)?chartRequest.chartTitle:"No chart title set.";
	this.originZero = ("originZero" in chartRequest)?chartRequest.originZero:false; 
	this.chartType = ("chartType" in chartRequest)?chartRequest.chartType:"LineChart";
	this.groupSize = ("groupSize" in chartRequest)?(chartRequest.groupSize - 1):0;
	this.groupCombine = ("groupCombine" in chartRequest)?(chartRequest.groupCombine):"none";
	this.iterator = ("iterator" in chartRequest)?chartRequest.iterator:"date";
	this.track = ("track" in chartRequest)?chartRequest.track:false;
	this.baseline = ("baseline" in chartRequest)?chartRequest.baseline:[];
	
	this.request = null;
	this.dataSet = new DataSet();
	
	if( this.iterator == 'date')
	{
		this.startDate = convertStringToDate(chartRequest.startDate + "T00:00:00.000Z");
		this.endDate = convertStringToDate(chartRequest.endDate + "T00:00:00.000Z");
		if( getNumberOfDays(this.endDate, today) > 0)
			this.dataSet.maxIndex = getNumberOfDays(this.startDate, this.endDate)
		else 
			this.dataSet.maxIndex = getNumberOfDays(this.startDate, today)

	} 
	else if (this.iterator == "integer")
	{
		this.iterateField = ("chartType" in chartRequest)?chartRequest.iterateField:"days_open_accumulated";
		this.dataSet.maxIndex = chartRequest["iterations"]-1;		
	}
	
	//console.info("ChangeChart Called.");
};

RangeChart.prototype.run = function()
{
	if( this.iterator == 'date')
	{
		this.request = new DateRangeIterator(this, this.startDate, this.endDate, this.queries);
	} 
	else if ( this.iterator == 'integer')
	{
		this.request = new RangeIterator(this, this.queries);		
	}
};

RangeChart.prototype.renderChart = function(){
	document.getElementById(this.canvas).innerHTML = "";
	
	var timeSeries = true;
	var dateTick = getNumberOfDays(this.startDate, this.endDate);

	if( this.iterator == "integer")
		timeSeries = false;
	
	
	if( this.chartType == "LineChart" || this.chartType == undefined )
	{
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
				xAxisScale_dateTickPrecision: dateTick / 25 * 1000*60*60*24
		        //set in miliseconds
	    	}
	    });
	} 
	else if ( this.chartType == "StackedAreaChart")
	{
		
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
				xAxisScale_dateTickPrecision: dateTick / 25 * 1000*60*60*24
		        //set in miliseconds
	    	}
	    });		
	}
    chart.setData(this.ConvertToChartData(), 
		    {crosstabMode: false,
		     seriesInRows: false});
	
	chart.render();	
};

RangeChart.prototype.Kill = function()
{
	if( this.request != undefined)
	{
		this.request.Kill();
		this.request = null;
		return true;
	}
	
	return false;
};

RangeChart.prototype.BuildEquationString = function(seriesName) {
	var equationString = ""

	for(i=0;i<this.evaluations[seriesName].length;i++)
	{
		var element = this.evaluations[seriesName][i];
		
		if( element == "")
			continue;
		
		if( isEven(i)){
			if (Math.isNumeric(element)){
				equationString += element;
			}else{
				equationString += "this.dataSet.store['" + element + "'][i].total ";
			}//endif
		}else{
			equationString += element + " ";
		}//endif
		
	}
	
	equationString += ";";					

	return equationString;
};

RangeChart.prototype.Evaluate = function() {
	if( this.evaluations == null)
		return;
	//console.info("Evaluation Called.")
	
	for( e in this.evaluations)
	{
		if(e in this.dataSet.store) this.dataSet.store[e] = {};
		
		var equation = this.BuildEquationString(e);		

		//console.info("Build Equation: " + equation);

		var firstSeries = null;
		
		for( k in this.dataSet.store)
		{
			var firstSeries = this.dataSet.store[k]
			break;
		}
		
		for( i in firstSeries)
		{
			var value = eval(equation);

			//console.info("Evaluated String: " + value);
			if( this.iterator == "date")
						this.dataSet.addData( e, i, "date", firstSeries[i].date );
				
			this.dataSet.addData( e, i, "total", value);
		}
	}
}

RangeChart.prototype.Baseline = function() {
	if( this.baseline.length == 0)
		return;
	
	for( i=0; i<this.baseline.length; i++)
	{
		var name = this.baseline[i].name;
		var data = this.baseline[i].data;
		var start = this.baseline[i].start;

		var startValue = this.dataSet.store[start][0].total;
		var baseline = startValue - this.dataSet.store[data][0].total;

		for( x in this.dataSet.store[data])
		{
			if( this.iterator == "date")
						this.dataSet.addData( name, x, "date", this.dataSet.store[data][x].date );
				
			this.dataSet.addData( name, x, "total", this.dataSet.store[data][x].total + baseline);
		}
	}
}

RangeChart.prototype.Burndown = function() {
	if( !this.track )
		return;

	var startValue = 0;
	for( k in this.dataSet.store )
	{
		if( !(this.showSeriesCheck(k)))
			continue;
		
		if( startValue < this.dataSet.store[k][0].total)
			startValue = this.dataSet.store[k][0].total;
	}
	
	this.dataSet.addData( "track", 0, "date", convertDateToString(this.startDate) );
	this.dataSet.addData( "track", 0, "total", startValue);
	
	this.dataSet.addData( "track", 1, "date", convertDateToString(this.endDate) );
	this.dataSet.addData( "track", 1, "total", 0);
}

RangeChart.prototype.ConvertToChartData = function() {

	this.Evaluate();
	this.Baseline();
	this.Burndown();
	
	var chartData = {
	  "resultset":[],
	  "metadata":[{
	    "colIndex":0,
	    "colType":"String",
	    "colName":"Series"
	  },{
	    "colIndex":1,
	    "colType":"String",
	    "colName":"Categories"
	  },{
	    "colIndex":2,
	    "colType":"Numeric",
	    "colName":"Value"
	  }]
	};
	
	for( k in this.dataSet.store)
	{
		
		if( !(this.showSeriesCheck(k))) continue;
		
		var groupCount = 0;
		var group = [];
		
		for( i in this.dataSet.store[k]) {		

			var value = this.dataSet.store[k][i].total;

			if( this.groupSize > 1)
			{
				if( groupCount < this.groupSize )
				{
					group.push(value);
					groupCount++;
					continue;
				} else {
					groupCount = 0;

					for(y=0;y<group.length;y++)
					{
						value += group[y];
					}

					if(this.groupCombine == "average")
					{
						value = value / (group.length+1)
					}

					group = [];
				}
			} 					

			if( isNaN(value) )
				value=0;
			
			if( this.iterator == "date")
			{			
				var dateString = this.dataSet.store[k][i].date.slice(0,10);
				chartData.resultset.push( [k , dateString, value] );
			} 
			else if( this.iterator == "integer" )
			{
				chartData.resultset.push( [ k , parseInt(i)+1, value] );
			}
		}
	}
	
	//console.info( JSON.stringify( chartData ));
	
	return chartData;
};

RangeChart.prototype.showSeriesCheck = function( seriesName ) {
	if( this.showSeries.length == 0)
		return true;
		
	for(j=0; j<this.showSeries.length; j++)
	{
		if( this.showSeries[j] == seriesName)
			return true;
	}
	
	return false;
};

RangeChart.prototype.Success = function( requestObject, data ) {
	
	//console.info( JSON.stringify( data ));

	var text = '{ "date": "' + convertDateToString(requestObject.currentDate) + '", "data : [';
	
	for(x=0; x<data[0].hits.hits.length; x++)
		text += JSON.stringify( data[0].hits.hits[x].fields ) + ",";
	
	text += ']}';
	
	report.addMessage( text );

	for(i=0;i<data.length; i++)
	{
		if( this.iterator == "date")
			this.dataSet.addData( requestObject.request.queries[i].seriesName, requestObject.request.id, "date", convertDateToString(requestObject.currentDate) );

		this.dataSet.addData( requestObject.request.queries[i].seriesName, requestObject.request.id, "total", data[i].hits.total);
	}

	if( this.dataSet.currentIndex <= this.dataSet.maxIndex) {

		status.message( "Processing Query: " + ( this.dataSet.currentIndex + 1 ) + " out of " + parseInt( this.dataSet.maxIndex + 1 ));
		
		var progress = (this.dataSet.currentIndex + 1 ) / ( this.dataSet.maxIndex + 1 ) * 100;

		$( "#progressbar" ).progressbar({
			"value" : progress
		});
	}
	else
	{
		status.message( "Chart Rendering Complete" );
	}	

	this.renderChart();
};

RangeChart.prototype.Error = function( requestObject, errorData, errorMsg, errorThrown ) {
	console.info( errorMsg + ": " + errorThrown );
};

chart = null;
status = new Status("status");
report = new Status("report")