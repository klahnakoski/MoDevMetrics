FilterReviewer = function(name, displayName, dependancies){
	this.name = name;
	this.displayName = displayName;
	this.isLoaded = false;
	this.isUIBuilt = false;
	this.list = [];
	this.manager;
	this.dependancies = dependancies;

	this.originQuery =
	{
		"query" : {
			"filtered" : {
				"query" : {
					"match_all" : {},
				},
				"filter" : {
					"and" : [
						{ "nested" : {
							"path" : "attachments",
//							"score_mode" : "avg",
							"query" : {
								"nested": {
									"_scope" : "attachments.flags",
									"path" : "attachments.flags",
									//						                   "score_mode" : "avg",
									"query": {
										"filtered" : {
											"query" : {
												"match_all" : {}
											},
											"filter" : {
												"and" : [
													{ "term" : {"attachments.flags.request_type" : "review"}},
													{ "term" : {"attachments.flags.request_status" : "?"}}
												]
											}
										}
									}
								}
							}
						}},
					]
				}
			}
		},
		"from": 0,
		"size": 0,
		"sort": [],
		"facets": {
			"reviewer": {
				"terms": {
					"field": "attachments.flags.requestee",
					"size": 100000
				},
				"scope": "attachments.flags"
			}
		}
	};

	//this.originQuery.facets = {};
	//this.originQuery.facets[this.name] = { "terms": {	"field": this.name,	"size": 100000}};

	this.query = clone(this.originQuery);

	if (state[ this.name ] == undefined)
		state[ this.name ] = [];
}

FilterReviewer.prototype.DoDependantsNeedFilters = function(){
	for(var i = 0; i < this.dependancies.length; i++){
		if (state[this.dependancies[i]].length != 0)
			return true;
	}

	return false;
}

FilterReviewer.prototype.SelfInjectFilters = function(){
	if (this.dependancies.length == 0)
		return;

	var query = clone(this.originQuery);

	if (!this.DoDependantsNeedFilters())
		return;

//	var subQuery = clone(query.query);

//	query.query = {}
//	query.query.filtered = {};
//	query.query.filtered.query = subQuery;

	this.query = query;

	for(var i = 0; i < this.dependancies.length; i++){
		for(var x = 0; x < this.manager.filters.length; x++){
			if (this.dependancies[i] == this.manager.filters[x].name){
				this.manager.filters[x].InjectFilters(this.query);
			}
		}
	}
}

FilterReviewer.prototype.FetchList = function(){
	this.SelfInjectFilters();
	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();
}

FilterReviewer.prototype.Success = function(resultsObj, data){
	this.list = data.facets[this.name].terms;
	this.isLoaded = true;
	this.manager.FetchFilters();
}

FilterReviewer.prototype.Error = function(requestObj, errorData, errorMsg, errorThrown){

};

FilterReviewer.prototype.InjectFilters = function(queryObj){
	if (state[this.name].length == 0)
		return;

	var andIndex = queryObj.query.filtered.filter.and[0].nested.query.nested.query.filtered.filter.and.length

	queryObj.query.filtered.filter.and[0].nested.query.nested.query.filtered.filter.and.push({"or" : [] });

	for(var i = 0; i < state[this.name].length; i++){
		orIndex = queryObj.query.filtered.filter.and[0].nested.query.nested.query.filtered.filter.and[andIndex].or.length;
		queryObj.query.filtered.filter.and[0].nested.query.nested.query.filtered.filter.and[andIndex].or.push({ "term" : {}});
		queryObj.query.filtered.filter.and[0].nested.query.nested.query.filtered.filter.and[andIndex].or[orIndex].term["attachments.flags.requestee"] = state[this.name][i];
	}
}

FilterReviewer.prototype.BuildUI = function(){
	if (this.isUIBuilt)
		return;

	var html = "";

	html += '<ul id="' + this.name + 'List" class="menu ui-selectable">';

	for(i = 0; i < this.list.length; i++){
		html += '<li class="ui-selectee';

		if (include(state[ this.name ], this.list[i].term))
			html += ' ui-selected';

		html += '" id="' + this.list[i].term +
			'">' + this.list[i].term +
			' (' + this.list[i].count + ')</li>';
	}

	html += '</ul>';

	document.getElementById(this.name).innerHTML = html;

	var callBackObj = this;

	$("#" + this.name + "List").selectable({
		selected: function(event, ui){
			if (!include(state[ callBackObj.name ], ui.selected.id)){
				state[ callBackObj.name ].push(ui.selected.id);
				callBackObj.manager.OnChange(callBackObj);
			}
		},
		unselected: function(event, ui){
			var i = state[ callBackObj.name ].indexOf(ui.unselected.id);
			if (i != -1){
				state[ callBackObj.name ].splice(i, 1);
				callBackObj.manager.OnChange(callBackObj);
			}
		}
	});

	this.isUIBuilt = true;
}
