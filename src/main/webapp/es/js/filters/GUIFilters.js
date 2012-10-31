

importScript("../charts/HelperFunctions.js");

importScript("../rest/RestQuery.js");
importScript("../charts/Status.js");
importScript("../Test2.js");

importScript("../charts/DataSet.js");
importScript("../charts/RangeCharts.js");
importScript("../charts/RangeIterator.js");
importScript("../charts/DateRangeIterator.js");

importScript("../filters/Filter.js");
importScript("../filters/ComponentFilter.js");
importScript("../filters/ProductFilter.js");
importScript("../filters/ProgramFilter.js");
importScript("../filters/CustomFilters.js");


var state = {};

state.selectedPrograms = [];
state.selectedProducts = [];
state.selectedComponents = [];

state['customFilters'] = [];
customFilters = [];
componentUI = null;


GUI = {};

GUI.setup = function(parameters){

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
	GUI.showESTime();
	GenerateCustomFilters();
	GUI.AddParameters(parameters); //ADD PARAM AND SET DEFAULTS
	GUI.UpdateState();			//UPDATE STATE OBJECT WITH THOSE DEFAULTS
	GUI.GetURLState();			//OVERWRITE WITH URL PARAM





};


//SHOW THE LAST TIME ES WAS UPDATED
GUI.showESTime = function(){
	RestQuery.Run(
		{//CALLBACK
			"success" : function(requestObj, data){
				$("#testMessage").html("ES Last Updated " + Date.newInstance(data.facets.modified_ts.max).addTimezone().format("NNN dd @ HH:mm") + Date.getTimezone());
			},

			"error": function(requestObj, errorData, errorMsg, errorThrown){
			}
		},
		0,
		{//ES QUERY
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
		}
	);
};//method


GUI.UpdateURL = function(){
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

GUI.GetURLState = function(){
	var urlState = jQuery.bbq.getState();
	for(var k in urlState){
		state[k] = urlState[k];
	}//for
	GUI.UpdateParameters();
};


GUI.AddParameters=function(parameters){
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
					GUI.UpdateURL();
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
					GUI.UpdateURL();
					createChart();
				}
			});
			defaultValue=defaultValue.toString();
		}else{
			$("#" + param.id).change(function(){
				if (GUI.UpdateState()){
					GUI.UpdateURL();
					createChart();
				}
			});
		}//endif

		$("#" + param.id).val(defaultValue);
	});//for

};//method




//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.UpdateParameters = function (){
	var changeDetected = false;
	GUI.parameters.forEach(function(param){
		if (state[param.id] != $("#" + param.id).val()){
			$("#" + param.id).val(state[param.id]);
			changeDetected = true;
		}//endif
	});
	return changeDetected;
};


//RETURN TRUE IF ANY CHANGES HAVE BEEN MADE
GUI.UpdateState = function(){
	var changeDetected = false;
	GUI.parameters.forEach(function(param){
		if (state[param.id]===undefined || state[param.id] != $("#" + param.id).val()){
			state[param.id] = $("#" + param.id).val();
			changeDetected = true;
		}//endif
	});
	return changeDetected;
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



