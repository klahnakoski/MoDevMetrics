
ComponentUI = function(){
	this.Refresh()
};




ComponentUI.makeFilter=function(){
	return ES.makeFilter("component", state.selectedComponents);
};//method

ComponentUI.makeQuery=function(filters){
	var output={
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
		"facets": {
			"Components": {
				"terms": {
					"field": "component",
					"size": 100000
				}
			}
		}
	};

	var and=output.query.filtered.filter.and;
	for(var f in filters) and.push(filters[f]);

	return output;
};//method

ComponentUI.prototype.Refresh = function(){
	this.query = ComponentUI.makeQuery([
		ES.makeFilter("product", state.selectedProducts),
		ES.makeFilter("component", state.selectedComponents),
		ProgramFilter.makeFilter(state.selectedPrograms)
	]);

	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();
};


ComponentUI.prototype.injectHTML=function(components){
	var html = '<ul id="componentsList" class="menu ui-selectable">';

	for(var i = 0; i < components.length; i++){
		html += '<li class="ui-selectee';

		if (include(state.selectedComponents, components[i].term))
			html += ' ui-selected';

		html += '" id="' + components[i].term +
			'">' + components[i].term +
			' (' + components[i].count + ')</li>';
	}

	html += '</ul>';
	html += '</div>';

	$("#components").html(html);
};


ComponentUI.prototype.success = function(resultsObj, data){
	var components = data.facets.Components.terms;

//	new SQL().calc({
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
			if (!include(state.selectedComponents, ui.selected.id)){
				state.selectedComponents.push(ui.selected.id);
				GUI.UpdateURL();
				GUI.UpdateSummary();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}
		},
		unselected: function(event, ui){
			var i = state.selectedComponents.indexOf(ui.unselected.id);
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
