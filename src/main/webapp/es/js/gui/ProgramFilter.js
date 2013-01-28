
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../MozillaPrograms.js");
importScript("../Debug.js");
importScript("../CNV.js");


ProgramFilter = function(){
	this.refresh();
};

ProgramFilter.allPrograms = CNV.Table2List(MozillaPrograms);

ProgramFilter.makeFilter = function(indexName){
	if (indexName===undefined) D.error("Must be provided with a valid ESQuery.INDEXES name");


	if (GUI.state.selectedPrograms.length == 0) return ES.TrueFilter;

	var or = [];
	for(var i=0;i<GUI.state.selectedPrograms.length;i++){
		for(var j=0;j<ProgramFilter.allPrograms.length;j++){
			if (ProgramFilter.allPrograms[j].projectName == GUI.state.selectedPrograms[i]){
				var name = ProgramFilter.allPrograms[j].attributeName;
				var value = ProgramFilter.allPrograms[j].attributeValue;

				if (indexName!="bugs"){//ONLY THE ORIGINAL bugs INDEX HAS BOTH whiteboard AND keyword
					if (name.startsWith("cf_")) value=name+value;		//FLAGS ARE CONCATENATION OF NAME AND VALUE
					name="keywords";
				}//endif

				or.push({"term":MAP(name, value)});
			}//endif
		}//for
	}//for

	return {"or":or};
};//method


ProgramFilter.makeQuery = function(filters){
//	var allCompares = "";
	var programCompares={};

	for(var j=0;j<ProgramFilter.allPrograms.length;j++){
//		if (ProgramFilter.allPrograms[j].projectName==GUI.state.selectedPrograms[i]){
		var name = ProgramFilter.allPrograms[j].attributeName;
		var value = ProgramFilter.allPrograms[j].attributeValue;
		var project=ProgramFilter.allPrograms[j].projectName;
//		var compare;
		if (name===undefined){
			D.error("");
		}//endif

		programCompares[project]=Util.coalesce(programCompares[project], []);
		programCompares[project].push({"term":MAP(name, value)});
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

	var html ='<i><a href="http://people.mozilla.com/~klahnakoski/es/js/MozillaPrograms.js">click here for definitions</a></i><br>';
	html += '<ul id="programsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="program_{name}">{name} ({count})</li>';

	//REMINDER OF THE DEFINITION



	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	var total = 0;
	for(var i = 0; i < programs.length; i++) total += programs[i].count;
	html += item.replaceVars({
		"class" : ((GUI.state.selectedPrograms.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	for(var i = 0; i < programs.length; i++){
		html += item.replaceVars({
			"class" : (include(GUI.state.selectedPrograms, programs[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : programs[i].term,
			"count" : programs[i].count
		});
	}//for

	html += '</ul>';

	var p = $("#programs");
	p.html(html);
};


ProgramFilter.prototype.refresh = function(){
	this.query = ProgramFilter.makeQuery([
//		ProductFilter.makeFilter()
	]);

//	D.println(CNV.Object2JSON(this.query));
	this.ElasticSearchQuery = OldElasticSearchQuery(this, 0, this.query);
	this.results = null;
	this.ElasticSearchQuery.Run();
};


ProgramFilter.prototype.success = function(data){

	//CONVERT MULTIPLE EDGES INTO SINGLE LIST OF PROGRAMS
	var programs=[];
	for(var p in data.facets){
		if (p=="Programs") continue;  //ALL PROGRAMS (NOT ACCURATE COUNTS)
		if (data.facets[p].terms.length==0){
			programs.push({"term":p, "count":0});
		}else{
			for(var t=0;t<data.facets[p].terms.length;t++){
				if (data.facets[p].terms[t].term=="None") continue;
				programs.push(data.facets[p].terms[t]);
			}//for
		}//endif
	}//for
	
	//OLD PROGRAMS HAS BAD COUNTS
	//var programs = data.edges.Programs.terms;


	this.injectHTML(programs);

	$("#programsList").selectable({
		selected: function(event, ui){
			var didChange = false;
			if (ui.selected.id == "program_ALL"){
				if (GUI.state.selectedPrograms.length > 0) didChange = true;
				GUI.state.selectedPrograms = [];
			} else{
				if (!include(GUI.state.selectedPrograms, ui.selected.id.rightBut("program_".length))){
					GUI.state.selectedPrograms.push(ui.selected.id.rightBut("program_".length));
					didChange = true;
				}//endif
			}//endif

			if (didChange){
				aThread.run(function(){
					yield (GUI.refresh());
				});
			}//endif
		},
		unselected: function(event, ui){
			var i = GUI.state.selectedPrograms.indexOf(ui.unselected.id.rightBut("program_".length));
			if (i != -1){
				GUI.state.selectedPrograms.splice(i, 1);
				aThread.run(function(){
					yield (GUI.refresh());
				});
			}
		}
	});
};

//RETURN MINIMUM VALUE OF ALL SELECTED PROGRAMS
ProgramFilter.bugStatusMinimum_fromDoc=function(){
	var idTime;
	if (GUI.state.selectedPrograms.length==0){
		idTime="doc[\"create_time\"].value";
	}else{
		idTime=ProgramFilter.minimum(GUI.state.selectedPrograms.map(function(v, i){return "doc[\""+v+"_time\"].value"}));
	}//endif

	return idTime;
};//method

//RETURN MINIMUM VALUE OF ALL SELECTED PROGRAMS
ProgramFilter.bugStatusMinimum_fromSource=function(){
	var idTime;
	if (GUI.state.selectedPrograms.length==0){
		idTime="bug_summary.create_time";
	}else{
		idTime=ProgramFilter.minimum(GUI.state.selectedPrograms.map(function(v, i){return "bug_summary[\""+v+"_time\"]"}));
	}//endif

	return idTime;
};//method

ProgramFilter.bugStatusMinimum=function(){
	var idTime;
	if (GUI.state.selectedPrograms.length==0){
		idTime="create_time";
	}else{
		idTime=GUI.state.selectedPrograms[0]+"_time";
	}//endif

	return idTime;
};//method






	//TAKE THE MINIMIM OF ALL GIVEN vars
ProgramFilter.minimum=function(vars){
	if (vars.length==1) return vars[0];

	var output=[];
	for(var i=0;i<vars.length-1;i+=2){
		output.push("minimum("+vars[i]+","+vars[i+1]+")");
	}//for
	if (i!=vars.length) output.push(vars[i]);
	return ProgramFilter.minimum(output);
};
