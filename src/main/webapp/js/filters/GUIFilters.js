
var state = {};

state["startDate"] = Date.now().addMonth(-3).format("yyyy-MM-dd");
state["endDate"] = Date.now().format("yyyy-MM-dd");

state.selectedPrograms=[];
state.selectedProducts = [];
state.selectedComponents = [];

state['customFilters'] = [];
customFilters = [];
componentUI = null;



GUI={};

GUI.setup=function(){
	state.programFilter=new ProgramFilter();
	state.productFilter=new ProductUI();
	state.componentFilter=new ComponentUI();

	GUI.makeSelectionPanel();
	GUI.showESTime();
	GenerateCustomFilters();
	GUI.UpdateTextFields();
};


//SHOW THE LAST TIME ES WAS UPDATED
GUI.showESTime=function(){
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



GUI.UpdateURL = function() {
	var simplestate={};

	var keys=Object.keys(state);
	for(k in keys){
		var t=typeof(state[keys[k]]);
		if (
			jQuery.isArray(state[keys[k]]) ||
			typeof(state[keys[k]])=="string" ||
			Math.isNumeric(state[keys[k]])
		){
			simplestate[keys[k]]=state[keys[k]];
		}//endif


	}//for
	jQuery.bbq.pushState( simplestate );
};

GUI.GetURLState = function() {
	var urlState = jQuery.bbq.getState();
	for (var k in urlState)
	{
		state[k] = urlState[k];
	}
};

var dateField = function(elementName) {
	$( "#"+elementName ).datepicker({ maxDate: "-1D" });
	$( "#"+elementName ).datepicker( "option", "dateFormat", "yy-mm-dd" );
	$( "#"+elementName ).val( state[elementName] );

	$( "#"+elementName ).change( function() {
		if( GUI.UpdateState()){
			GUI.UpdateURL();
		    createChart();
		}
	});
};

$(function() {
	$( "#progressbar" ).progressbar({
		value: 0
	});

	dateField("startDate");
	dateField("endDate");
});

GUI.UpdateTextField = function( elementName ){
	if( state[elementName] != $("#" + elementName).val()){
		$("#" + elementName).val(state[elementName]);
		return true;
	}

	return false;
};

GUI.UpdateTextFields = function (){
    if( GUI.UpdateTextField( "startDate" ) ||
    	GUI.UpdateTextField( "endDate" ) )
    	return true;

    return false;
};

GUI.UpdateStateElement = function( elementName ){
	if( state[elementName] != $("#" + elementName).val() ){
		state[elementName] = $("#" + elementName).val();
		return true;
	}//endif

	return false;
};

GUI.UpdateState = function(){
    if( GUI.UpdateStateElement( "startDate" ) ||
    	GUI.UpdateStateElement( "endDate" ) )
    	return true;

    return false;
};



GUI.makeSelectionPanel=function (){
	var html = "";

	html += '<h3><a href="#">Selection</a></h3>';
	html += '<div id="summary"></div>';
	if (customFilters.length != 0){
		html += '<h3><a href="#">Custom Filters</a></h3>';
		html += '<div id="customFilters"></div>';
	}
	html += '<h3><a href="#">Programs</a></h3>';
	html += '<div id="programs"></div>';
	html += '<h3><a href="#">Products</a></h3>';
	html += '<div id="products"></div>';
	html += '<h3><a href="#">Components</a></h3>';
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
		html += "Custom Filters: "+state["customFilters"].join(", ");
		html += "<br><br>";
	}//endif

	html += "Programs: ";
	if (state.selectedPrograms.length == 0){
		html += "All";
	}else{
		html+=state.selectedPrograms.join(", ");
	}//endif

	html += "<br><br>";

	html += "Products: ";
	if (state.selectedProducts.length == 0){
		html += "All";
	}else{
		html+=state.selectedProducts.join(", ");
	}//endif

	html += "<br><br>";

	html += "Components: ";
	if (state.selectedComponents.length == 0){
		html += "All";
	}else{
		html += state.selectedComponents.join(", ");
	}//endif

	html += "<br><br><br><b>Hold CTRL while clicking to multi-select and deselect from the lists below.</b>";
	html += '<br><br><a href="index.html">Return to Query List</a>';

	$("#summary").html(html);
};



