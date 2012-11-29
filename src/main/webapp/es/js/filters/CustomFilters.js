var CustomFilter = {};

InjectCustomFilters = function(query){
	//D.println('ParseCustomFilters');

	if (GUI.state.customFilters.length == 0)
		return;

	query.filter.and.push({"or" : []});

	var or = query.filter.and[query.filter.and.length - 1].or;

	for(var j = 0; j < GUI.state.customFilters.length; j++){
//		D.println('GUI.state.customFilters check: ' + GUI.state.customFilters[i].name + " : " + GUI.state.GUI.state.customFilters);
		if (include(GUI.state.customFilters, GUI.state.customFilters[j].name)){
//			D.println('GUI.state.customFilters found: ' + GUI.state.customFilters[i].name);
			for(var x = 0; x < GUI.state.customFilters[j].filters.length; x++){
//				D.println("GUI.state.customFilters[i].filters[x]: " + JSON.stringify(GUI.state.customFilters[i].filters[x]));
				or.push(GUI.state.customFilters[j].filters[x]);
			}
		}
	}
};


GenerateCustomFilters = function(){
	if (GUI.state.customFilters.length == 0)
		return;

	var html = "";

	html += '<ul id="customFiltersList" class="menu ui-selectable">';

	for(var i = 0; i < GUI.state.customFilters.length; i++){
		html += '<li class="ui-selectee';

		if (include(GUI.state.customFilters, GUI.state.customFilters[i].name))
			html += ' ui-selected';

		html += '" id="' + GUI.state.customFilters[i].name +
			'">' + GUI.state.customFilters[i].name + '</li>';
	}

	html += '</ul>';

	document.getElementById("GUI.state.customFilters").innerHTML = html;

	var callBackObj = this;

	$("#customFiltersList").selectable({
		selected: function(event, ui){
			if (!include(GUI.state.customFilters, ui.selected.id)){
				GUI.state.customFilters.push(ui.selected.id);
				GUI.State2URL();
				GUI.UpdateSummary();
				createChart();
			}
		},
		unselected: function(event, ui){
			var i = GUI.state.customFilters.indexOf(ui.unselected.id);
			if (i != -1){
				GUI.state.customFilters.splice(i, 1);
				GUI.State2URL();
				GUI.UpdateSummary();
				createChart();
			}
		}
	});
};