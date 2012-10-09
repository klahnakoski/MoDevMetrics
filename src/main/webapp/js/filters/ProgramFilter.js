ProgramFilter = function(){
	this.Refresh();
};

ProgramFilter.allPrograms=CNV.Table2List(MozillaPrograms);

ProgramFilter.makeFilter=function(selectedPrograms){
	if (state.selectedPrograms.length==0) return ES.TrueFilter;

	var or=[];
	for(var i in state.selectedPrograms){
		for (j in ProgramFilter.allPrograms){
			if (ProgramFilter.allPrograms[j].projectName==state.selectedPrograms[i]){
				var name=ProgramFilter.allPrograms[j].attributeName;
				var value=ProgramFilter.allPrograms[j].attributeValue;
				var term={};
				term[name]=value;
				or.push({"term":term});
			}//endif
		}//for
	}//for

	return {"or":or};
};//method


ProgramFilter.makeQuery=function(filters){
	var compares="";

	for (var j in ProgramFilter.allPrograms){
//		if (ProgramFilter.allPrograms[j].projectName==state.selectedPrograms[i]){
			var name=ProgramFilter.allPrograms[j].attributeName;
			var value=ProgramFilter.allPrograms[j].attributeValue;
			if (name.indexOf(".tokenized")>=0){
				name=name.leftBut(10);
				compares+="if (_source."+name+".indexOf("+CNV.String2Quote(value)+")>=0) return "+CNV.String2Quote(ProgramFilter.allPrograms[j].projectName)+";\n";
			}else{
				compares+="if (doc."+name+"=="+CNV.String2Quote(value)+") return "+CNV.String2Quote(ProgramFilter.allPrograms[j].projectName)+";\n";
			}//enidf
//		}//endif
	}//for

	var output={
			"query" : {
				"filtered" : {
					"query": {
						"match_all":{}
					},
					"filter" : {
						"and":[
							{ "range" : { "expires_on" : { "gt" : Date.now().getMilli() } } },
							{"not" : {"terms" : { "bug_status" : ["resolved", "verified", "closed"] }}}
						]
					}
				}
			},
			"from": 0,
			"size": 0,
			"sort": [],
			"facets": {
				"Programs": {
					"terms": {
						"script_field": compares,
						"size": 100000
					}
				}
			}
		};

	var and=output.query.filtered.filter.and;
	for(var f in filters) and.push(filters[f]);

	return output;
};//method


ProgramFilter.prototype.injectHTML=function(programs){
	var html = '<ul id="programsList" class="menu ui-selectable">';

	var item = '<li class="{class}" id="{program_name}">{program_name} ({program_count})</li>';

	for(var i = 0; i < programs.length; i++){
		html += item.replaceAll({
			"class" : (include(state.selectedPrograms, programs[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"program_name" : programs[i].term,
			"program_count" : programs[i].count
		});
	}//for

	html += '</ul>';

	var p=$("#programs");
	p.html(html);
};




ProgramFilter.prototype.Refresh = function(){
	this.query = ProgramFilter.makeQuery([
		ProductUI.makeFilter()
	]);

	console.info(CNV.Object2JSON(this.query));
	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();
};


ProgramFilter.prototype.success = function(resultsObj, data){

	var programs = data.facets.Programs.terms;
	this.injectHTML(programs);

	$("#programsList").selectable({
		selected: function(event, ui){
			if (!include(state.selectedPrograms, ui.selected.id)){
				state.selectedPrograms.push(ui.selected.id);
				GUI.UpdateURL();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}
		},
		unselected: function(event, ui){
			var i = state.selectedPrograms.indexOf(ui.unselected.id);
			if (i != -1){
				state.selectedPrograms.splice(i, 1);
				GUI.UpdateURL();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}
		}
	});
};

ProgramFilter.prototype.error = function(requestObj, errorData, errorMsg, errorThrown){

};