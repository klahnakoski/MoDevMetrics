ComponentFilter = function(){
	this.refresh()
};


ComponentFilter.makeFilter = function(){
	return ES.makeFilter("component", GUI.state.selectedComponents);
};//method

ComponentFilter.makeQuery = function(filters){
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

ComponentFilter.prototype.refresh = function(){
	this.query = ComponentFilter.makeQuery([
		ES.makeFilter("product", GUI.state.selectedProducts)//,
//		ProgramFilter.makeFilter(GUI.state.selectedPrograms)
	]);

	this.ElasticSearchQuery = OldElasticSearchQuery(this, 0, this.query);
	this.results = null;
	this.ElasticSearchQuery.Run();
};


ComponentFilter.prototype.injectHTML = function(components){
	var html = '<ul id="componentsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="component_{name}">{name} ({count})</li>';

	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	var total = 0;
	for(var i = 0; i < components.length; i++) total += components[i].count;
	html += item.replaceVars({
		"class" : ((GUI.state.selectedProducts.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	for(var i = 0; i < components.length; i++){
		html += item.replaceVars({
			"class" : (GUI.state.selectedProducts.contains(components[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : components[i].term,
			"count" : components[i].count
		});
	}//for

	html += '</ul>';


	$("#components").html(html);
};


ComponentFilter.prototype.success = function(data){
	var components = data.facets.Components.terms;

	var terms = [];
	for(var i = 0; i < components.length; i++) terms.push(components[i].term);

	GUI.state.selectedComponents = List.intersect(GUI.state.selectedComponents, terms);

	GUI.State2URL();
	this.injectHTML(components);
	$("#componentsList").selectable({
		selected: function(event, ui){
			var didChange = false;
			if (ui.selected.id == "component_ALL"){
				if (GUI.state.selectedComponents.length > 0) didChange = true;
				GUI.state.selectedComponents = [];
			} else{
				if (!include(GUI.state.selectedComponents, ui.selected.id.rightBut("component_".length))){
					GUI.state.selectedComponents.push(ui.selected.id.rightBut("component_".length));
					didChange = true;
				}//endif
			}//endif

			if (didChange){
				aThread.run(function(){
					yield (GUI.refresh());
				});
			}
		},
		unselected: function(event, ui){
			var i = GUI.state.selectedComponents.indexOf(ui.unselected.id.rightBut("component_".length));
			if (i != -1){
				GUI.state.selectedComponents.splice(i, 1);
				aThread.run(function(){
					yield (GUI.refresh());
				});
			}
		}
	});

};
