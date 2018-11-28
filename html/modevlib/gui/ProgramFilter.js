
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


importScript("../MozillaPrograms.js");
importScript("../debug/aLog.js");
importScript("../util/convert.js");


ProgramFilter = function(indexName, programs){
	this.indexName=coalesce(indexName, "bugs");
	this.programs=convert.Table2List(coalesce(programs, MozillaPrograms));
	this.name="Programs";
	this.refresh();
	this.selected=[];
	this.isFilter=true;
};

ProgramFilter.prototype.makeFilter = function(indexName, selectedPrograms){
	indexName=coalesce(indexName, this.indexName);
	selectedPrograms=coalesce(selectedPrograms, this.selected);

	if (selectedPrograms.length == 0) return ESQuery.TrueFilter;

	let or = [];
	for(let i=0;i<selectedPrograms.length;i++){
		for(let j=0;j<this.programs.length;j++){
			if (this.programs[j].projectName == selectedPrograms[i]){
				if (this.programs[j].esfilter){
					or.push(this.programs[j].esfilter);
					continue;
				}//endif

				let name = this.programs[j].attributeName;
				let value = this.programs[j].attributeValue;

				if (!["bugs", "private_bugs"].contains(indexName)){//ONLY THE ORIGINAL bugs INDEX HAS BOTH whiteboard AND keyword
					if (name.startsWith("cf_")) value=name+value;    //FLAGS ARE CONCATENATION OF NAME AND VALUE
					name="keywords";
				}//endif

				or.push({"term":Map.newInstance(name, value)});
			}//endif
		}//for
	}//for

	return {"or":or};
};//method


ProgramFilter.prototype.makeQuery = function(table, filters){
	let programCompares={};

	this.programs.forall(function(program){
		let name = program.attributeName;
		let value = program.attributeValue;

		let esfilter;
		if (program.esfilter){
			esfilter=program.esfilter;
		}else{
			esfilter={"term":Map.newInstance(name, value)};
		}//endif

		let project=program.projectName;
		programCompares[project]=coalesce(programCompares[project], []);
		programCompares[project].push(esfilter);
	});


	let output = {
		"from": table,
		"select":Map.map(programCompares, function(c, f){
			return {"name": c, "value": {"when": {"or": f}, "then": 1, "else": 0}, "aggregate": "sum"}
		}),
		"where": {
			"and": [
				{"range": {"expires_on": {"gt": Date.now().getMilli()}}},
				{"not": {"terms": {"bug_status": ["resolved", "verified", "closed"]}}},
				{"and":filters}
			]
		},
		"format":"list"
	};

	return output;
};//method

ProgramFilter.prototype.getSummary=function(){
	 let html = "Programs: ";
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
		this.selected=value.split(",").mapExists(function(v){return v.trim();});
	}//endif
	this.refresh();
};

ProgramFilter.prototype.makeHTML=function(){
	return '<div id="programs"></div>';
};//method


//programs IS A LIST OF OBJECTS WITH A term AND count ATTRIBUTES
ProgramFilter.prototype.injectHTML = function(programs){

	let html ='<i><a href="http://people.mozilla.com/~klahnakoski/es/modevlib/MozillaPrograms.js">click here for definitions</a></i><br>';
	html += '<ul id="programsList" class="menu ui-selectable">';
	let item = new Template('<li class="{{class}}" id="program_{{name}}">{{name}} ({{count}})</li>');

	//REMINDER OF THE DEFINITION



	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	let total = 0;
	for(let i = 0; i < programs.length; i++) total += programs[i].count;
	html += item.replace({
		"class" : ((this.selected.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	for(let i = 0; i < programs.length; i++){
		html += item.replace({
			"class" : this.selected.contains(programs[i].term) ? "ui-selectee ui-selected" : "ui-selectee",
			"name" : programs[i].term,
			"count" : programs[i].count
		});
	}//for

	html += '</ul>';

	let p = $("#programs");
	p.html(html);
};


ProgramFilter.prototype.refresh = function(){
	let self = this;
	Thread.run("find programs", function*(){
		self.query = self.makeQuery(self.indexName, []);
		let result = yield (ActiveDataQuery.run(self.query));

		//CONVERT MULTIPLE EDGES INTO SINGLE LIST OF PROGRAMS
		let programs = [];
		Map.forall(result.data[0], function (name, count) {
			if (name == "Programs") return;  //ALL PROGRAMS (NOT ACCURATE COUNTS)
			programs.push({"term": name, "count": count});
		});
		programs.reverse();
		self.injectHTML(programs);

		$("#programsList").selectable({
			selected: function(event, ui){
				let didChange = false;
				if (ui.selected.id == "program_ALL"){
					if (self.selected.length > 0) didChange = true;
					self.selected = [];
				} else{
					if (!self.selected.contains(ui.selected.id.rightBut("program_".length))){
						self.selected.push(ui.selected.id.rightBut("program_".length));
						didChange = true;
					}//endif
				}//endif

				if (didChange)GUI.refresh();
			},
			unselected: function(event, ui){
				let i = self.selected.indexOf(ui.unselected.id.rightBut("program_".length));
				if (i != -1){
					self.selected.splice(i, 1);
					GUI.refresh();
				}
			}
		});
	});
};

//RETURN MINIMUM VALUE OF ALL SELECTED PROGRAMS
ProgramFilter.prototype.bugStatusMinimum_fromDoc=function(){
	let idTime;
	if (this.selected.length==0){
		idTime="doc[\"create_time\"].value";
	}else{
		idTime=ProgramFilter.minimum(this.selected.mapExists(function(v, i){return "doc[\""+v+"_time\"].value"}));
	}//endif

	return idTime;
};//method

//RETURN MINIMUM VALUE OF ALL SELECTED PROGRAMS
ProgramFilter.prototype.bugStatusMinimum_fromSource=function(){
	let idTime;
	if (this.selected.length==0){
		idTime="bug_summary.create_time";
	}else{
		idTime=ProgramFilter.minimum(this.selected.mapExists(function(v, i){return "bug_summary[\""+v+"_time\"]"}));
	}//endif

	return idTime;
};//method

ProgramFilter.prototype.bugStatusMinimum=function(){
	let idTime;
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

	let output=[];
	for(let i=0;i<vars.length-1;i+=2){
		output.push("minimum("+vars[i]+","+vars[i+1]+")");
	}//for
	if (i!=vars.length) output.push(vars[i]);
	return ProgramFilter.minimum(output);
};
