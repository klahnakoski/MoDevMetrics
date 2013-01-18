

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
GUI.state.selectedPrograms = [];
GUI.state.selectedClassifications = [];
GUI.state.selectedProducts = [];
GUI.state.selectedComponents = [];
GUI.state.customFilters = [];






////////////////////////////////////////////////////////////////////////////////
// GIVEN THE THREE, RETURN AN END DATE THAT WILL MAKE THE LAST PARTITION
// INCLUDE A WHOLE INTERVAL, AND IS *INSIDE* THAT INTERVAL
////////////////////////////////////////////////////////////////////////////////
GUI.fixEndDate=function(startDate, endDate, interval){
	var diff=endDate.add(interval).subtract(startDate, interval);

	var newEnd=startDate.add(diff.floor(interval));
	return newEnd.addSecond(-1);
};


GUI.setup = function(parameters, relations, indexName){

	//SHOW SPINNER
	var found=$('.loading');
	found
		.hide()  // hide it initially
		.ajaxStart(function() {
			$(this).show();
		})
		.ajaxStop(function() {
			$(this).hide();
		})
	;






	GUI.state.programFilter = new ProgramFilter();
	GUI.state.classificationFilter = new ClassificationFilter();
	GUI.state.productFilter = new ProductFilter();
	GUI.state.componentFilter = new ComponentFilter();


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


		var age=Math.round(Date.now().subtract(time).divideBy(Duration.DAY), 1);
		if (age>1){
			GUI.bigWarning("#testMessage", Math.max(3, Math.floor(age)));
		}//endif

	});
};//method


GUI.bigWarning=function(elem, blinkCount){
	$(elem).addClass("warning").effect("pulsate", { times:blinkCount }, 1000);
};


GUI.State2URL = function(){
	if (!GUI.State2URL.isEnabled) return;

	var simplestate = {};
	forAllKey(GUI.state, function(k, v){
		if (v.getSimpleState){
			simplestate[k] = v.getSimpleState();
		}else if (
			jQuery.isArray(v) ||
			typeof(v) == "string" ||
			Math.isNumeric(k)
		){
			simplestate[k] = v;
		}//endif
	});

	jQuery.bbq.pushState(simplestate);
};
GUI.State2URL.isEnabled=false;


GUI.URL2State = function(){
	var urlState = jQuery.bbq.getState();
	forAllKey(urlState, function(k, v){
		if (GUI.state[k]===undefined) return;
		if (GUI.state[k].getSimpleState){
			GUI.state[k].setSimpleState(v);
		}else{
			GUI.state[k] = v;
		}//endif
	});
};


GUI.AddParameters=function(parameters, relations){
	GUI.parameters=parameters;


	//INSERT HTML
	var template='<span class="parameter_name">{NAME}</span><input type="{TYPE}" id="{ID}"><br><br>\n';
	var html="";
	parameters.forEach(function(param){
		if (param.type.getSimpleState) return;  //HANDLES IT'S OWN HTML
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
		// SPECIAL
		if (param.type.getSimpleState){
			param.type.setSimpleState(defaultValue);
			

		////////////////////////////////////////////////////////////////////////
		// DATE
		}else if (param.type=="date" ||param.type=="time"){
			$("#" + param.id).datepicker({ maxDate: "-0D" });
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
		if (param.type.getSimpleState) return;  //param.type===GUI.state[param.id] NO ACTION REQUIRED
		$("#" + param.id).val(GUI.state[param.id]);
	});
};


//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.Parameter2State = function(){
	GUI.parameters.forEach(function(param){
		if (param.type.getSimpleState){
			GUI.state[param.id]=param.type;
		}else{
			GUI.state[param.id] = $("#" + param.id).val();
		}//endif
	});
};



//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.UpdateState = function(){
	var backup=Util.copy(GUI.state, {});

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
	var html = "";

	html += '<h4><a href="#">Selection</a></h4>';
	html += '<div id="summary"></div>';
	if (GUI.state.customFilters.length != 0){
		html += '<h4><a href="#">Custom Filters</a></h4>';
		html += '<div id="GUI.state.customFilters"></div>';
	}
	if (GUI.state.teamFilter){
		html += '<h4><a href="#">Teams</a></h4>';
		html += '<div id="teams" style="300px"></div>';
	}//endif
	html += '<h4><a href="#">Classifications</a></h4>';
	html += '<div id="classifications"></div>';
	html += '<h4><a href="#">Programs</a></h4>';
	html += '<div id="programs"></div>';
	html += '<h4><a href="#">Products</a></h4>';
	html += '<div id="products"></div>';
	html += '<h4><a href="#">Components</a></h4>';
	html += '<div id="components"></div>';

	$("#filters").html(html);

	$("#filters").accordion({
		autoHeight: false,
		navigation: true,
		collapsible: true
	});
};


GUI.UpdateSummary = function(){
	var html = "";

	if (GUI.state.customFilters.length > 0){
		html += "Custom Filters: " + GUI.state.customFilters.join(", ");
		html += "<br><br>";
	}//endif

	//teamFilter IS PART OF THE PARAMETERS, JUST LIKE THE OTHER HIERARCHIES SHOULD BE
	//SHOULD LOOP THROUGH THE PARAMETERS AND ADD TO THIS SUMMARY (IF WE KEEP THIS SUMMARY)
	if (GUI.state.teamFilter){
		html += "Teams: ";
		var teams=aThread.runSynchronously(GUI.state.teamFilter.getSelectedPeople());
		if (teams.length == 0){
			html += "All";
		} else{
			html +=teams.map(function(p, i){return p.name;}).join(", ");
		}//endif

		html += "<br><br>";
	}//endif

	html += "Programs: ";
	if (GUI.state.selectedPrograms.length == 0){
		html += "All";
	} else{
		html += GUI.state.selectedPrograms.join(", ");
	}//endif

	html += "<br><br>";

	html += "Products: ";
	if (GUI.state.selectedProducts.length == 0){
		html += "All";
	} else{
		html += GUI.state.selectedProducts.join(", ");
	}//endif

	html += "<br><br>";

	html += "Components: ";
	if (GUI.state.selectedComponents.length == 0){
		html += "All";
	} else{
		html += GUI.state.selectedComponents.join(", ");
	}//endif

	html += "<br><br><br><b>Hold CTRL while clicking to multi-select and deselect from the lists below.</b>";

	$("#summary").html(html);
};

GUI.refresh=function(){
//	aThread.assertThreaded();

	GUI.State2URL();

	var threads=[];
	threads.push(aThread.run(function(){
		yield (GUI.state.classificationFilter.refresh());
	}));
	threads.push(aThread.run(function(){
		yield (GUI.state.programFilter.refresh());
	}));
	threads.push(aThread.run(function(){
		yield (GUI.state.productFilter.refresh());
	}));
	threads.push(aThread.run(function(){
		yield (GUI.state.componentFilter.refresh());
	}));

	GUI.parameters.forall(function(param){
		if (param.type.getSimpleState){
			threads.push(aThread.run(param.type.refresh()));
		}//endif
	});

	for(var i=0;i<threads.length;i++){
		yield (aThread.join(threads[i]));
	}//for

	GUI.UpdateSummary();

	createChart();
};




GUI.injectFilterss = function(chartRequests){
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
	ElasticSearch.injectFilter(chartRequest.esQuery, ProgramFilter.makeFilter(indexName));
	

	ElasticSearch.injectFilter(chartRequest.esQuery, ProductFilter.makeFilter());
	ElasticSearch.injectFilter(chartRequest.esQuery, ComponentFilter.makeFilter());
	if (GUI.state.teamFilter){
		ElasticSearch.injectFilter(chartRequest.esQuery, GUI.state.teamFilter.makeFilter());
	}//endif

};
