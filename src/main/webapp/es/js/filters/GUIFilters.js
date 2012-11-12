

importScript("../charts/HelperFunctions.js");

importScript("../rest/ElasticSearchQuery.js");
importScript("../charts/Status.js");
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


var state = {};

state.selectedPrograms = [];
state.selectedProducts = [];
state.selectedComponents = [];

state['customFilters'] = [];
customFilters = [];
componentUI = null;


GUI = {};


////////////////////////////////////////////////////////////////////////////////
// GIVEN THE THREE, RETURN AN END DATE THAT WILL MAKE THE LAST PARTITION
// INCLUDE A WHOLE INTERVAL, AND IS *INSIDE* THAT INTERVAL
////////////////////////////////////////////////////////////////////////////////
GUI.fixEndDate=function(startDate, endDate, interval){
	var diff=endDate.add(interval).subtract(startDate, interval);

	var newEnd=startDate.add(diff.floor(interval));
	return newEnd.addSecond(-1);
};


GUI.setup = function(parameters, relations, showLastUpdated){

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



	state.programFilter = new ProgramFilter();
	state.productFilter = new ProductUI();
	state.componentFilter = new ComponentUI();

	GUI.makeSelectionPanel();
	GUI.showLastUpdated(showLastUpdated);
	GenerateCustomFilters();
	GUI.AddParameters(parameters, relations); //ADD PARAM AND SET DEFAULTS
	GUI.Parameter2State();			//UPDATE STATE OBJECT WITH THOSE DEFAULTS

	GUI.relations=Util.coalesce(relations, []);
	GUI.FixState();

	GUI.URL2State();				//OVERWRITE WITH URL PARAM
	GUI.State2URL.isEnabled=true;	//DO NOT ALLOW URL TO UPDATE UNTIL WE HAVE GRABBED IT

	GUI.FixState();
	GUI.State2URL();
	GUI.State2Parameter();
};


//SHOW THE LAST TIME ES WAS UPDATED
GUI.showLastUpdated = function(type){
	if (type===undefined || type=="bugs"){
		ElasticSearchQuery.Run({
			"query":{//ES QUERY
				"query" : {
					"match_all":{}
				},
				"from" : 0,
				"size" : 0,
				"sort" : [],
				"facets":{
					"modified_ts":{
						"statistical" : {
							"field" : "modified_ts"
						}
					}
				}
			},
			"success" : function(data){
				$("#testMessage").html("ES Last Updated " + Date.newInstance(data.facets.modified_ts.max).addTimezone().format("NNN dd @ HH:mm") + Date.getTimezone());
			}
		});
	}else if (type=="reviews"){
		var q=new ESQuery({
			"from":"reviews",
			"select":[
				{"name":"last_request", "value":"reviews.request_time", "operation":"maximum"}
			]
		});

		q.run(function(data){
			$("#testMessage").html("Reviews Last Updated " + Date.newInstance(data.data.last_request).addTimezone().format("NNN dd @ HH:mm") + Date.getTimezone());
		});
	}//endif
};//method


GUI.State2URL = function(){
	if (!GUI.State2URL.isEnabled) return;

	var simplestate = {};

	var keys = Object.keys(state);
	for(k in keys){
		var t = typeof(state[keys[k]]);
		if (
			jQuery.isArray(state[keys[k]]) ||
			typeof(state[keys[k]]) == "string" ||
			Math.isNumeric(state[keys[k]])
		){
			simplestate[keys[k]] = state[keys[k]];
		}//endif


	}//for
	jQuery.bbq.pushState(simplestate);
};
GUI.State2URL.isEnabled=false;


GUI.URL2State = function(){
	var urlState = jQuery.bbq.getState();
	ForAllKey(urlState, function(k, v){
		state[k] = v;
	});
};


GUI.AddParameters=function(parameters, relations){
	GUI.parameters=parameters;


	//INSERT HTML
	var template='<span class="parameter_name">{NAME}</span><input type="{TYPE}" id="{ID}"><span class="parameter_error" id="{ID}_error"></span><br><br>\n';
	var html="";
	parameters.forEach(function(param){
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
			$("#" + param.id).datepicker({ maxDate: "-0D" });
			$("#" + param.id).datepicker("option", "dateFormat", "yy-mm-dd");

			$("#" + param.id).change(function(){
				if (GUI.UpdateState()){
					createChart();
				}
			});
			defaultValue=defaultValue.format("yyyy-MM-dd");
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
		}else{
			$("#" + param.id).change(function(){
				if (GUI.UpdateState()){
					createChart();
				}
			});
		}//endif

		$("#" + param.id).val(defaultValue);
	});//for



};//method




//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.State2Parameter = function (){
	GUI.parameters.forEach(function(param){
		$("#" + param.id).val(state[param.id]);
	});
};


//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.Parameter2State = function(){
	GUI.parameters.forEach(function(param){
		state[param.id] = $("#" + param.id).val();
	});
};



//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.UpdateState = function(){
	var backup=Util.copy(state, {});

	GUI.Parameter2State();
	GUI.FixState();
	GUI.State2Parameter();

	//AFTER RELATIONS, IS THERE STILL A CHANGE?
	var changeDetected = false;
	GUI.parameters.forall(function(param){
		if (backup[param.id]===undefined || state[param.id] != backup[param.id]){
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
				GUI.relations[i]=aCompile.method(r, [state]);
			});
		}//endif

		//UPDATE THE STATE OBJECT
		GUI.relations.forall(function(r){
			r(state);
		});
	}//endif
};


GUI.makeSelectionPanel = function (){
	var html = "";

	html += '<h4><a href="#">Selection</a></h4>';
	html += '<div id="summary"></div>';
	if (customFilters.length != 0){
		html += '<h4><a href="#">Custom Filters</a></h4>';
		html += '<div id="customFilters"></div>';
	}
	html += '<h4><a href="#">Programs</a></h4>';
	html += '<div id="programs"></div>';
	html += '<h4><a href="#">Products</a></h4>';
	html += '<div id="products"></div>';
	html += '<h4><a href="#">Components</a></h4>';
	html += '<div id="components"></div>';

	$("#filters").html(html);

	$("#filters").accordion({
		autoHeight: false,
		navigation: true
	});
};


GUI.UpdateSummary = function(){
	var html = "";

	if (state["customFilters"].length > 0){
		html += "Custom Filters: " + state["customFilters"].join(", ");
		html += "<br><br>";
	}//endif

	html += "Programs: ";
	if (state.selectedPrograms.length == 0){
		html += "All";
	} else{
		html += state.selectedPrograms.join(", ");
	}//endif

	html += "<br><br>";

	html += "Products: ";
	if (state.selectedProducts.length == 0){
		html += "All";
	} else{
		html += state.selectedProducts.join(", ");
	}//endif

	html += "<br><br>";

	html += "Components: ";
	if (state.selectedComponents.length == 0){
		html += "All";
	} else{
		html += state.selectedComponents.join(", ");
	}//endif

	html += "<br><br><br><b>Hold CTRL while clicking to multi-select and deselect from the lists below.</b>";
	html += '<br><br><a href="http://people.mozilla.com/~klahnakoski/">Return to Query List</a>';

	$("#summary").html(html);
};



