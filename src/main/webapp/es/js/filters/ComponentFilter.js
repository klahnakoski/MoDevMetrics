ComponentUI = function(){
	this.Refresh()
};


ComponentUI.makeFilter = function(){
	return ES.makeFilter("component", state.selectedComponents);
};//method

ComponentUI.makeQuery = function(filters){
	var output = {
		"query" : {
			"filtered" : {
				"query": {
					"match_all":{}
				},
				"filter" : {
					"and": [
						{ "range" : { "expires_on" : { "gt" : Date.now().addDay(1).getMilli() } } },
						{"not" : {"terms" : { "bug_status" : ["resolved", "verified", "closed"] }}}
					]
				}
			}
		},
		"from": 0,
		"size": 0,
		"sort": [],
		"facets":{
			"Components": {
				"terms": {
					"field": "component",
					"size": 100000
				}
			}
		}
	};

	var and = output.query.filtered.filter.and;
	for(var f=0;f<filters.length;f++) and.push(filters[f]);

	return output;
};//method

ComponentUI.prototype.Refresh = function(){
	this.query = ComponentUI.makeQuery([
		ES.makeFilter("product", state.selectedProducts),
		ProgramFilter.makeFilter(state.selectedPrograms)
	]);

	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();
};


ComponentUI.prototype.injectHTML = function(components){
	var html = '<ul id="componentsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="component_{name}">{name} ({count})</li>';

	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	var total = 0;
	for(var i = 0; i < components.length; i++) total += components[i].count;
	html += item.replaceVars({
		"class" : ((state.selectedProducts.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	for(var i = 0; i < components.length; i++){
		html += item.replaceVars({
			"class" : (state.selectedProducts.contains(components[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : components[i].term,
			"count" : components[i].count
		});
	}//for

	html += '</ul>';


	$("#components").html(html);
};


ComponentUI.prototype.success = function(resultsObj, data){
	var components = data.facets.Components.terms;

//	new CUBE().calc({
//		"from":
//			components,
//		"select":[
//			{value:"term", "domain":{"type":"set", "data":state.selectedComponents}}
//		]
//	});

	var terms = [];
	for(var i = 0; i < components.length; i++) terms.push(components[i].term);

	state.selectedComponents = List.intersect(state.selectedComponents, terms);

	GUI.UpdateURL();
	this.injectHTML(components);
	$("#componentsList").selectable({
		selected: function(event, ui){
			var didChange = false;
			if (ui.selected.id == "component_ALL"){
				if (state.selectedComponents.length > 0) didChange = true;
				state.selectedComponents = [];
			} else{
				if (!include(state.selectedComponents, ui.selected.id.rightBut("component_".length))){
					state.selectedComponents.push(ui.selected.id.rightBut("component_".length));
					didChange = true;
				}//endif
			}//endif

			if (didChange){
				GUI.UpdateURL();
				GUI.UpdateSummary();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}//endif
		},
		unselected: function(event, ui){
			var i = state.selectedComponents.indexOf(ui.unselected.id.rightBut("component_".length));
			if (i != -1){
				state.selectedComponents.splice(i, 1);
				GUI.UpdateURL();
				GUI.UpdateSummary();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}
		}
	});

	GUI.UpdateSummary();
	createChart();
};
