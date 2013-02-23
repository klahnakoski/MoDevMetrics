/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../charts/HelperFunctions.js");

importScript("../rest/ElasticSearchQuery.js");
importScript("../Test2.js");

importScript("../charts/DataSet.js");
importScript("../charts/RangeCharts.js");
importScript("../charts/RangeIterator.js");
importScript("../charts/DateRangeIterator.js");

importScript("Filter.js");
importScript("ComponentFilter.js");
importScript("ProductFilter.js");
importScript("ProgramFilter.js");
importScript("CustomFilters.js");

importScript("../aCompiler.js");

GUI = {};

GUI.state = {};
GUI.customFilters = [];











////////////////////////////////////////////////////////////////////////////////
// GIVEN THE THREE, RETURN AN END DATE THAT WILL MAKE THE LAST PARTITION
// INCLUDE A WHOLE INTERVAL, AND IS *INSIDE* THAT INTERVAL
////////////////////////////////////////////////////////////////////////////////
GUI.fixEndDate=function(startDate, endDate, interval){
	startDate=Date.newInstance(startDate);
	endDate=Date.newInstance(endDate);
	interval=Duration.newInstance(interval);
	
	var diff=endDate.add(interval).subtract(startDate, interval);

	var newEnd=startDate.add(diff.floor(interval));
	return newEnd.addSecond(-1);
};


GUI.setup = function(parameters, relations, indexName, showDefaultFilters){
	//IF THERE ARE ANY CUSTOM FILTERS, THEN TURN OFF THE DEFAULTS
	var isCustom=false;
	parameters.forall(function(f, i){
		if (f.type.isFilter) isCustom=true;
	});

	if (((showDefaultFilters===undefined) && !isCustom) || showDefaultFilters){
		//USE DEFAULT FILTERS
		GUI.state.programFilter = new ProgramFilter();
		GUI.state.productFilter = new ProductFilter();
		GUI.state.componentFilter = new ComponentFilter();

		GUI.customFilters.push(GUI.state.programFilter );
		GUI.customFilters.push(GUI.state.productFilter);
		GUI.customFilters.push(GUI.state.componentFilter);
	}//endif

	GUI.showLastUpdated(indexName);
	GUI.AddParameters(parameters, relations); //ADD PARAM AND SET DEFAULTS
	GUI.Parameter2State();			//UPDATE STATE OBJECT WITH THOSE DEFAULTS

	GUI.makeSelectionPanel();

	GUI.relations=Util.coalesce(relations, []);
	GUI.FixState();

	GUI.URL2State();				//OVERWRITE WITH URL PARAM
	GUI.State2URL.isEnabled=true;	//DO NOT ALLOW URL TO UPDATE UNTIL WE HAVE GRABBED IT

	GUI.FixState();
	GUI.State2URL();
	GUI.State2Parameter();


	aThread.run(function(){
		yield (GUI.refresh());
	});

};


//SHOW THE LAST TIME ES WAS UPDATED
GUI.showLastUpdated = function(indexName){
	aThread.run(function(){
		var time;

		var a=D.action("Get Status of ES Index", true);
		if (indexName===undefined || indexName=="bugs"){
			var result=yield (ESQuery.run({
				"from":"bugs",
				"select":{"name":"max_date", "value":"modified_ts", "operation":"maximum"}
			}));

			time=new Date(result.cube.max_date);
			$("#testMessage").html("ES Last Updated " + time.addTimezone().format("NNN dd @ HH:mm") + Date.getTimezone());
		}else if (indexName=="reviews"){
			time=yield (REVIEWS.getLastUpdated());
			$("#testMessage").html("Reviews Last Updated " + time.addTimezone().format("NNN dd @ HH:mm") + Date.getTimezone());
		}else if (indexName=="bug_tags"){
			time=yield (BUG_TAGS.getLastUpdated());
			$("#testMessage").html("Bugs Last Updated " + time.addTimezone().format("NNN dd"));
		}else if (indexName="bug_summary"){
			time=new Date((yield(ESQuery.run({
				"from":"bug_summary",
				"select":{"name":"max_date", "value":"modified_time", "operation":"maximum"}
			}))).cube.max_date);
			$("#testMessage").html("Reviews Last Updated " + time.addTimezone().format("NNN dd @ HH:mm") + Date.getTimezone());
		}//endif

		var is_error=yield(GUI.corruptionCheck());
		if (is_error){
			$("#testMessage").append("<br>ES IS CORRUPTED!!!");
		}//endif


		var age=aMath.round(Date.now().subtract(time).divideBy(Duration.DAY), 1);
		if (age>1 || is_error){
			GUI.bigWarning("#testMessage", aMath.max(3, aMath.floor(age)));
		}//endif

		D.actionDone(a);
	});
};//method

GUI.corruptionCheck=function(){
	var result=yield (ESQuery.run({
		"from":"bugs",
		"select":{"name":"num_null", "value":"expires_on>"+Date.eod().getMilli()+" ? 1 : 0", "operation":"add"},
		"edges":["bug_id"],
		"esfilter":{"range":{"modified_ts":{"gte":Date.now().addMonth(-3).getMilli()}}}
	}));

	var is_error=yield (CUBE.calc2List({
		"from":{
			"from":result,
			"select": {"value":"bug_id"},
			"where":"num_null!=1"
		},
		"select":{"name":"is_error", "value":"bug_id", "operation":"exists"}
	}));

	yield (is_error.list[0].is_error==1)
};//method



GUI.bigWarning=function(elem, blinkCount){
	$(elem).addClass("warning").effect("pulsate", { times:blinkCount }, 1000);
};


GUI.State2URL = function(){
	if (!GUI.State2URL.isEnabled) return;

	var simplestate = {};
	forAllKey(GUI.state, function(k, v){
		if (v.isFilter){
			simplestate[k] = v.getSimpleState();
		}else if (jQuery.isArray(v)){
			if (v.length>0) simplestate[k] = v.join(",");
		}else if ( typeof(v) == "string" || aMath.isNumeric(k)){
			simplestate[k] = v;
		}//endif
	});

	var removeList=mapAllKey(simplestate, function(k,v){
		if (v===undefined) return k;
	});
	jQuery.bbq.removeState(removeList);
	jQuery.bbq.pushState(Map.copy(simplestate));
};
GUI.State2URL.isEnabled=false;


GUI.URL2State = function(){
	var urlState = jQuery.bbq.getState();
	forAllKey(urlState, function(k, v){
		if (GUI.state[k]===undefined) return;

		var p=GUI.parameters.map(function(v, i){if (v.id==k) return v;})[0];

		if (p && ["time", "duration", "text"].contains(p.type)){
			GUI.state[k] = v;
		}else if (GUI.state[k].isFilter){
			GUI.state[k].setSimpleState(v);
		}else{
			GUI.state[k] = v.split(",");
		}//endif
	});
};


GUI.AddParameters=function(parameters, relations){
	//KEEP SIMPLE PARAMETERS GUI.parameters AND REST IN customFilters
	GUI.parameters=parameters.map(function(param){
		if (param.type.isFilter){
			GUI.state[param.id]=param.type;
			if (param.name) param.type.name=param.name;
			param.type.setSimpleState(param["default"]);
			GUI.customFilters.push(param.type);
		}else{
			return param;
		}//endif
	});


	//INSERT HTML
	var template='<span class="parameter_name">{NAME}</span><input type="{TYPE}" id="{ID}"><br><br>\n';
	var html="";
	GUI.parameters.forEach(function(param){
		//SIMPLE VARIABLES
		html+=template.replaceVars({
			"ID":param.id,
			"NAME":param.name,
			"TYPE":{"time":"text", "date":"text", "duration":"text", "text":"text"}[param.type]  //MAP PARAMETER TYPES TO HTML TYPES
		});
	});
	$("#parameters").html(html);


	//MARKUP PARAMETERS
	parameters.forEach(function(param){
		var defaultValue=param["default"];


		////////////////////////////////////////////////////////////////////////
		// DATE
		if (param.type=="date" ||param.type=="time"){
			$("#" + param.id).datepicker({ });
			$("#" + param.id).datepicker("option", "dateFormat", "yy-mm-dd");

			$("#" + param.id).change(function(){
				if (GUI.UpdateState()){
					createChart();
				}
			});
			defaultValue=defaultValue.format("yyyy-MM-dd");
			$("#" + param.id).val(defaultValue);
		////////////////////////////////////////////////////////////////////////
		// DURATION
		} else if (param.type=="duration"){
			$("#" + param.id).change(function(){
				try{
					$("#"+$(this).id+"_error").html("");
					var value=Duration.newInstance($(this).text());
					$(this).text(value.toString());
				}catch(e){
					$("#"+$(this).id+"_error").html("&gt;- ERROR, expecting a valid duration");
					return;
				}//try

				if (GUI.UpdateState()){
					createChart();
				}
			});
			defaultValue=defaultValue.toString();
			$("#" + param.id).val(defaultValue);
		}else{
			$("#" + param.id).change(function(){
				if (GUI.UpdateState()){
					createChart();
				}
			});
			$("#" + param.id).val(defaultValue);
		}//endif

	});//for



};//method




//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.State2Parameter = function (){
	GUI.parameters.forEach(function(param){
//		if (param.type.getSimpleState) return;  //param.type===GUI.state[param.id] NO ACTION REQUIRED
		$("#" + param.id).val(GUI.state[param.id]);
	});
};


//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.Parameter2State = function(){
	GUI.parameters.forEach(function(param){
		GUI.state[param.id] = $("#" + param.id).val();
	});
};



//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.UpdateState = function(){
	var backup=Map.copy(GUI.state);

	GUI.Parameter2State();
	GUI.FixState();
	GUI.State2Parameter();

	//AFTER RELATIONS, IS THERE STILL A CHANGE?
	var changeDetected = false;
	GUI.parameters.forall(function(param){
		if (backup[param.id]===undefined || GUI.state[param.id] != backup[param.id]){
			changeDetected = true;
		}//endif
	});

	//PUSH BACK CHANGES IN STATE TO GUI PARAMETERS
	if (changeDetected) GUI.State2URL();
	return changeDetected;
};

// APPLY THE RELATIONS TO STATE
GUI.FixState=function(){
	if (GUI.relations.length>0){
		//COMPILE RELATIONS
		var type=typeof(GUI.relations[0]);
		if (type!="function"){
			GUI.relations.forall(function(r, i){
				GUI.relations[i]=aCompile.method_usingObjects(r, [GUI.state]);
			});
		}//endif

		//UPDATE THE STATE OBJECT
		GUI.relations.forall(function(r){
			r(GUI.state);
		});
	}//endif
};


GUI.makeSelectionPanel = function (){
	if (GUI.customFilters.length==0) return;
	
	var html = "";

	html += '<h4><a href="#">Selection</a></h4>';
	html += '<div id="summary"></div>';
	GUI.customFilters.forall(function(f, i){
		html += '<h4><a href="#">'+f.name+'</a></h4>';
		html += f.makeHTML();
	});
//	html += '<h4><a href="#">Programs</a></h4>';
//	html += '<div id="programs"></div>';
//	html += '<h4><a href="#">Products</a></h4>';
//	html += '<div id="products"></div>';
//	html += '<h4><a href="#">Components</a></h4>';
//	html += '<div id="components"></div>';

	$("#filters").html(html);

	$("#filters").accordion({
		autoHeight: false,
		navigation: true,
		collapsible: true
	});
};


GUI.UpdateSummary = function(){
	var html = "<br>";

	GUI.customFilters.forall(function(f, i){
		html+="<b>"+f.getSummary()+"</b>";
		html+="<br><br>";
	});


	html += "<b>Hold CTRL while clicking to multi-select and deselect from the lists below.</b>";

	$("#summary").html(html);
};

GUI.refresh=function(){
//	aThread.assertThreaded();

	GUI.State2URL();

	var threads=[];
	GUI.customFilters.forall(function(f, i){
		threads.push(aThread.run(function(){
			yield (f.refresh());
		}));
	});

	for(var i=0;i<threads.length;i++){
		yield (aThread.join(threads[i]));
	}//for

	GUI.UpdateSummary();

	createChart();
};




GUI.injectFilters = function(chartRequests){
	if (!(chartRequests instanceof Array)) D.error("Expecting an array of chartRequests");
	for(var i = 0; i < chartRequests.length; i++){
		(GUI.injectFilters(chartRequests[i]));
	}//for
};

GUI.injectFilters = function(chartRequest){
	if (chartRequest.esQuery === undefined)
		D.error("Expecting chart requests to have a \"esQuery\", not \"query\"");

	
	var indexName;
	if (chartRequest.query!==undefined && chartRequest.query.from!==undefined){
		indexName=chartRequest.query.from;
	}else{
		indexName="reviews";
	}//endif

	GUI.customFilters.forall(function(f, i){
		ElasticSearch.injectFilter(chartRequest.esQuery, f.makeFilter());
	});
};


GUI.getFilters=function(indexName){
	if (GUI.customFilters.length==0) return ES.TrueFilter;
	
	var output={"and":[]};
	GUI.customFilters.forall(function(f, i){
		output.and.push(f.makeFilter());
	});
	return output;
};
