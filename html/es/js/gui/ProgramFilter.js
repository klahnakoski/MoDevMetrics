
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../MozillaPrograms.js");
importScript("../aDebug.js");
importScript("../CNV.js");


ProgramFilter = function(indexName){
	this.indexName=nvl(indexName, "bugs");
	this.name="Programs";
	this.refresh();
	this.selected=[];
	this.isFilter=true;
};

ProgramFilter.allPrograms = CNV.Table2List(MozillaPrograms);

ProgramFilter.prototype.makeFilter = function(indexName, selectedPrograms){
	indexName=nvl(indexName, this.indexName);
	selectedPrograms=nvl(selectedPrograms, this.selected);

	if (selectedPrograms.length == 0) return ESQuery.TrueFilter;

	var or = [];
	for(var i=0;i<selectedPrograms.length;i++){
		for(var j=0;j<ProgramFilter.allPrograms.length;j++){
			if (ProgramFilter.allPrograms[j].projectName == selectedPrograms[i]){
				if (ProgramFilter.allPrograms[j].esfilter){
					or.push(ProgramFilter.allPrograms[j].esfilter);
					continue;
				}//endif

				var name = ProgramFilter.allPrograms[j].attributeName;
				var value = ProgramFilter.allPrograms[j].attributeValue;

				if (indexName!="bugs"){//ONLY THE ORIGINAL bugs INDEX HAS BOTH whiteboard AND keyword
					if (name.startsWith("cf_")) value=name+value;		//FLAGS ARE CONCATENATION OF NAME AND VALUE
					name="keywords";
				}//endif

				or.push({"term":Map.newInstance(name, value)});
			}//endif
		}//for
	}//for

	return {"or":or};
};//method


ProgramFilter.makeQuery = function(filters){
	var programCompares={};

	for(var j=0;j<ProgramFilter.allPrograms.length;j++){
		var name = ProgramFilter.allPrograms[j].attributeName;
		var value = ProgramFilter.allPrograms[j].attributeValue;

		var esfilter;
		if (ProgramFilter.allPrograms[j].esfilter){
			esfilter=ProgramFilter.allPrograms[j].esfilter;
		}else{
			esfilter={"term":Map.newInstance(name, value)};
		}//endif

		var project=ProgramFilter.allPrograms[j].projectName;
		programCompares[project]=nvl(programCompares[project], []);
		programCompares[project].push(esfilter);
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
				"script_field":MVEL.Value2MVEL(c),//programCompares[c]+"return 'None'\n",
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

ProgramFilter.prototype.getSummary=function(){
	 var html = "Programs: ";
	if (this.selected.length == 0){
		html += "All";
	} else{
		html += this.selected.join(", ");
	}//endif
	return html;
};//method


//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
ProgramFilter.prototype.getSimpleState=function(){
	if (this.selected.length==0) return undefined;
	return this.selected.join(",");
};


ProgramFilter.prototype.setSimpleState=function(value){
	if (!value || value==""){
		this.selected=[];
	}else{
		this.selected=value.split(",").map(function(v){return v.trim();});
	}//endif
	this.refresh();
};

ProgramFilter.prototype.makeHTML=function(){
	return '<div id="programs"></div>';
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
		"class" : ((this.selected.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	for(var i = 0; i < programs.length; i++){
		html += item.replaceVars({
			"class" : (include(this.selected, programs[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
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
//		GUI.state.productFilter.makeFilter()
	]);

//	D.println(CNV.Object2JSON(this.query));
	this.ElasticSearchQuery = OldElasticSearchQuery(this, 0, this.query);
	this.results = null;
	this.ElasticSearchQuery.Run();
};


ProgramFilter.prototype.success = function(data){
	if (data==null) return;

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
	var self=this;

	$("#programsList").selectable({
		selected: function(event, ui){
			var didChange = false;
			if (ui.selected.id == "program_ALL"){
				if (self.selected.length > 0) didChange = true;
				self.selected = [];
			} else{
				if (!include(self.selected, ui.selected.id.rightBut("program_".length))){
					self.selected.push(ui.selected.id.rightBut("program_".length));
					didChange = true;
				}//endif
			}//endif

			if (didChange)GUI.refresh();
		},
		unselected: function(event, ui){
			var i = self.selected.indexOf(ui.unselected.id.rightBut("program_".length));
			if (i != -1){
				self.selected.splice(i, 1);
				GUI.refresh();
			}
		}
	});
};

//RETURN MINIMUM VALUE OF ALL SELECTED PROGRAMS
ProgramFilter.prototype.bugStatusMinimum_fromDoc=function(){
	var idTime;
	if (this.selected.length==0){
		idTime="doc[\"create_time\"].value";
	}else{
		idTime=ProgramFilter.minimum(this.selected.map(function(v, i){return "doc[\""+v+"_time\"].value"}));
	}//endif

	return idTime;
};//method

//RETURN MINIMUM VALUE OF ALL SELECTED PROGRAMS
ProgramFilter.prototype.bugStatusMinimum_fromSource=function(){
	var idTime;
	if (this.selected.length==0){
		idTime="bug_summary.create_time";
	}else{
		idTime=ProgramFilter.minimum(this.selected.map(function(v, i){return "bug_summary[\""+v+"_time\"]"}));
	}//endif

	return idTime;
};//method

ProgramFilter.prototype.bugStatusMinimum=function(){
	var idTime;
	if (this.selected.length==0){
		idTime="create_time";
	}else{
		idTime=this.selected[0]+"_time";
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
