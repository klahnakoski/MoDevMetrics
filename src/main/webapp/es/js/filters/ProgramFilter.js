ProgramFilter = function(){
	this.Refresh();
};

ProgramFilter.allPrograms = CNV.Table2List(MozillaPrograms);

ProgramFilter.makeFilter = function(selectedPrograms){
	if (state.selectedPrograms.length == 0) return ES.TrueFilter;

	var or = [];
	for(var i=0;i<state.selectedPrograms.length;i++){
		for(var j=0;j<ProgramFilter.allPrograms.length;j++){
			if (ProgramFilter.allPrograms[j].projectName == state.selectedPrograms[i]){
				var name = ProgramFilter.allPrograms[j].attributeName;
				var value = ProgramFilter.allPrograms[j].attributeValue;
				var term = {};
				term[name] = value;
				or.push({"prefix":term});
			}//endif
		}//for
	}//for

	return {"or":or};
};//method


ProgramFilter.makeQuery = function(filters){
//	var allCompares = "";
	var programCompares={};

	for(var j=0;j<ProgramFilter.allPrograms.length;j++){
//		if (ProgramFilter.allPrograms[j].projectName==state.selectedPrograms[i]){
		var name = ProgramFilter.allPrograms[j].attributeName;
		var value = ProgramFilter.allPrograms[j].attributeValue;
		var project=ProgramFilter.allPrograms[j].projectName;
//		var compare;
		if (name===undefined){
			D.error("");
		}//endif

		programCompares[project]=Util.coalesce(programCompares[project], []);
		var filter={"prefix":{}};
		filter.prefix[name]=value;
		programCompares[project].push(filter);


		//FOR THE SINGLE FACET AND ALL TERMS
//		if (name.indexOf(".tokenized") >= 0){
//			name = name.leftBut(10);
//			compare="if (_source." + name + ".indexOf(" + CNV.String2Quote(value) + ")>=0) return " + CNV.String2Quote(project) + ";\n";
//			allCompares += compare;
//		} else if (name=="keywords"){
//			compare="if (_source." + name + ".indexOf(" + CNV.String2Quote(value) + ")>=0) return " + CNV.String2Quote(project) + ";\n";
//			allCompares += compare;
//		} else{
//			compare="if (doc." + name + "==" + CNV.String2Quote(value) + ") return " + CNV.String2Quote(project) + ";\n";
//			allCompares += compare;
//		}//enidf
	}//for


	var output = {
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
		"facets":{
//			"Programs": {
//				"terms": {
//					"script_field": allCompares+"return 'None'\n",
//					"size": 100000
//				}
//			}
		}
	};

	//INSERT INDIVIDUAL FACETS
	//I WOULD HAVE USED FACET FILTERS, BUT THEY SEEM NOT ABLE TO RUN indexOf() ON _source ATTRIBUTES
	for(var c in programCompares){
		output.facets[c]={
			"terms":{
				"script_field":MVEL.Value2Code(c),//programCompares[c]+"return 'None'\n",
				"size":10000
			},
			"facet_filter":{
				"or":programCompares[c]
			}
		}
	}

	var and = output.query.filtered.filter.and;
	for(var f=0;f<filters.length;f++) and.push(filters[f]);

	return output;
};//method

//programs IS A LIST OF OBJECTS WITH A term AND count ATTRIBUTES
ProgramFilter.prototype.injectHTML = function(programs){
	var html = '<ul id="programsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="program_{name}">{name} ({count})</li>';


	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	var total = 0;
	for(var i = 0; i < programs.length; i++) total += programs[i].count;
	html += item.replaceVars({
		"class" : ((state.selectedPrograms.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	for(var i = 0; i < programs.length; i++){
		html += item.replaceVars({
			"class" : (include(state.selectedPrograms, programs[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : programs[i].term,
			"count" : programs[i].count
		});
	}//for

	html += '</ul>';

	var p = $("#programs");
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

	//CONVERT MULTIPLE EDGES INTO SINGLE LIST OF PROGRAMS
	var programs=[];
	for(var p in data.facets){
		if (p=="Programs") continue;  //ALL PROGRAMS (NOT ACCURATE COUNTS)
		for(var t=0;t<data.facets[p].terms.length;t++){
			if (data.facets[p].terms[t].term=="None") continue;
			programs.push(data.facets[p].terms[t]);
		}//for
	}//for
	
	//OLD PROGRAMS HAS BAD COUNTS
	//var programs = data.edges.Programs.terms;


	this.injectHTML(programs);

	$("#programsList").selectable({
		selected: function(event, ui){
			var didChange = false;
			if (ui.selected.id == "program_ALL"){
				if (state.selectedPrograms.length > 0) didChange = true;
				state.selectedPrograms = [];
			} else{
				if (!include(state.selectedPrograms, ui.selected.id.rightBut("program_".length))){
					state.selectedPrograms.push(ui.selected.id.rightBut("program_".length));
					didChange = true;
				}//endif
			}//endif

			if (didChange){
				GUI.UpdateURL();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}//endif
		},
		unselected: function(event, ui){
			var i = state.selectedPrograms.indexOf(ui.unselected.id.rightBut("program_".length));
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
