

TeamFilter = function(field_name){
	this.field_name=field_name;
	this.selectedEmails=[];

	 var self=this;
	aThread.run(function(){

		//GET ALL PEOPLE
		self.people=(yield (ESQuery.run({
			"from":"org_chart",
			"select":[
				{"name":"id", "value":"org_chart.id"},
				{"name":"name", "value":"org_chart.name"},
				{"name":"email", "value":"get(org_chart, \"email\")"},
				{"name":"manager", "value":"get(org_chart, \"manager\")"}
			]
		}))).list;

		//USE THIS TO SIMPLIFY THE TREE SELECTION
		self.managers={};
		self.people.forall(function(v, i){
			if (self.managers[v.id])
				D.warning(v.id+" is not unique");
			self.managers[v.id]=v.manager;
		});

		var hier=CUBE.List2Hierarchy({
			"from":self.people.map(function(p, i){
				return {"data":p.name, "attr":{"id":p.id}, "manager":p.manager, "id":p.id};
				}),
			"id_field":"id",
			"child_field":"children",
			"parent_field":"manager"
		}).map(function(v, i){
			//IGNORE THE TOP LEVEL 'PEOPLE' WITH NO CHILDREN (THE PEOPLE THAT NEED TO SET THIER MANAGERS)
			if (v.children) return v;
			return undefined;
		});

		self.injectHTML(hier);
	});
	
	this.Refresh();
};


TeamFilter.prototype.getSelectedPeople=function(self){
	//CONVERT SELECTED LIST INTO PERSONS
	var selected = this.selectedEmails.map(function(email){
		for(var i = self.people.length; i--;){
			if (self.people[i].id.startsWith("mail=" + email)) return self.people[i];
		}//for
	});
	return selected;
};//method

//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
TeamFilter.prototype.getSimpleState=function(){
	return this.selectedEmails;
};



TeamFilter.prototype.makeFilter = function(){
	if (this.selectedEmails.length == 0) return ES.TrueFilter;

	var selected = this.getSelectedPeople();

	//FIND BZ EMAILS THAT THE GIVEN LIST MAP TO
	var getEmail=function(list, children){
		children.forall(function(child, i){
			if (child.email)
				list.push(child.email);
			if (child.children)
				getEmail(list, child.children);
		});
	};//method
	var all=[];
	getEmail(all, selected);

	return ES.makeFilter(this.field_name, GUI.state.selectedTeams);
};//method



TeamFilter.prototype.Refresh = function(){
	//FIND WHAT IS IN STATE, AND UPDATE STATE
	var selected=this.getSelectedPeople();

	var f=$('#teamList').jstree;
	f("deselect_all");
	selected.forall(function(p){
		f("select_node", "#"+p.id);
	});
};


TeamFilter.prototype.injectHTML = function(hier){
	var html = '<div id="teamList"></div>';
	$("#teams").html(html);

	var self=this;

	$("#teamList").jstree({
		"json_data" : {
			"data":hier
		},
		"themes":{
			"icons":false,
			"dots":false
		},
		"plugins" : [ "themes", "json_data", "ui", "checkbox" ]
	}).bind("change_state.jstree", function (e, data){
		//WE NOW HAVE A RIDICULOUS NUMBER OF CHECKED ITEMS, REDUCE TO MINIMUM COVER
		var minCover=[];

		//FIRST MAKE A HASH OF CHECKED ITEMS
		var checked={};
		$(".jstree-checked").each(function(){
			checked[$(this).attr("id")]={};
		});

		//IF MANAGER IS CHECKED, THEN DO NOT INCLUDE
		forAllKey(checked, function(id, v, m){
			if (checked[self.managers[id]]) return;
			minCover.push(id.between("mail=", ","));
		});
		minCover.sort();

		//HAS ANYTHING CHANGED?
		var hasChanged=false;
		if (GUI.state.selectedTeams.length!=minCover.length) hasChanged=true;
		if (!hasChanged) for(var i=minCover.length;i--;){
			if (minCover[i]!=GUI.state.selectedTeams[i]) hasChanged=true;
		}//for

		if (hasChanged){
			GUI.state.selectedTeams=minCover;
			GUI.refresh();
		}//endif
	});


};


