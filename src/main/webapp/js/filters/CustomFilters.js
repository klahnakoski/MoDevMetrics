
var CustomFilter={};

InjectCustomFilters = function(query){
	//console.info('ParseCustomFilters');

	if (state['customFilters'].length == 0)
		return;

	query.filter.and.push({"or" : []});

	var or = query.filter.and[query.filter.and.length - 1].or;

	for(var j = 0; j < customFilters.length; j++){
//		console.info('customFilters check: ' + customFilters[i].name + " : " + state['customFilters']);
		if (include(state['customFilters'], customFilters[j].name)){
//			console.info('customFilters found: ' + customFilters[i].name);
			for(var x = 0; x < customFilters[j].filters.length; x++){
//				console.info("customFilters[i].filters[x]: " + JSON.stringify(customFilters[i].filters[x]));
				or.push(customFilters[j].filters[x]);
			}
		}
	}
};




GenerateCustomFilters = function(){
	if (customFilters.length == 0)
		return;

	var html = "";

	html += '<ul id="customFiltersList" class="menu ui-selectable">';

	for(var i = 0; i < customFilters.length; i++){
		html += '<li class="ui-selectee';

		if (include(state['customFilters'], customFilters[i].name))
			html += ' ui-selected';

		html += '" id="' + customFilters[i].name +
			'">' + customFilters[i].name + '</li>';
	}

	html += '</ul>';

	document.getElementById("customFilters").innerHTML = html;

	var callBackObj = this;

	$("#customFiltersList").selectable({
		selected: function(event, ui){
			if (!include(state['customFilters'], ui.selected.id)){
				state['customFilters'].push(ui.selected.id);
				GUI.UpdateURL();
				GUI.UpdateSummary();
				createChart();
			}
		},
		unselected: function(event, ui){
			var i = state['customFilters'].indexOf(ui.unselected.id);
			if (i != -1){
				state['customFilters'].splice(i, 1);
				GUI.UpdateURL();
				GUI.UpdateSummary();
				createChart();
			}
		}
	});
};