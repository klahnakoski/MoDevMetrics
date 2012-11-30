

TeamFilter = function(){};


TeamFilter.newInstance=function(field_name){
	var self=new TeamFilter();

	self.field_name=field_name;
	self.selectedEmails=[];

	aThread.run(function(){
		//GET ALL PEOPLE
		var people=(yield (ESQuery.run({
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
		people.forall(function(v, i){
			if (self.managers[v.id])
				D.warning(v.id+" is not unique");
			self.managers[v.id]=v.manager;
		});

		var hier=CUBE.List2Hierarchy({
			"from":people.map(function(p, i){
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
		self.people=people;
	});
	return self;
};


TeamFilter.prototype.getSelectedPeople=function(){
	var self=this;

	while(!self.people){
		yield (aThread.sleep(100));
	}//while

	//CONVERT SELECTED LIST INTO PERSONS
	var selected = this.selectedEmails.map(function(email){
		for(var i = self.people.length; i--;){
			if (self.people[i].id.startsWith("mail=" + email)) return self.people[i];
		}//for
	});
	yield selected;
};//method



//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
TeamFilter.prototype.getSimpleState=function(){
	return this.selectedEmails;
};

//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
TeamFilter.prototype.setSimpleState=function(value){
	if (!value || value=="") value=[];
	this.selectedEmails=value;
	this.refresh();
};


TeamFilter.prototype.makeFilter = function(){
	if (this.selectedEmails.length == 0) return ES.TrueFilter;

	var selected = aThread.runSynchonously(this.getSelectedPeople());
	if (selected.length == 0) return ES.TrueFilter;

	//FIND BZ EMAILS THAT THE GIVEN LIST MAP TO
	var getEmail=function(list, children){
		children.forall(function(child, i){
			if (child.email)
				list.push(child.email);
			if (child.children)
				getEmail(list, child.children);
		});
	};//method
	var bzEmails=[];
	getEmail(bzEmails, selected);

	return ES.makeFilter(this.field_name, bzEmails);
};//method



TeamFilter.prototype.refresh = function(){
	//FIND WHAT IS IN STATE, AND UPDATE STATE
	var selected=yield(this.getSelectedPeople());

	var f=$('#teamList');
	f.jstree("deselect_all");
	selected.forall(function(p){
		f.jstree("select_node", "#"+p.id);
	});

	yield null;
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
		if (self.selectedEmails.length!=minCover.length) hasChanged=true;
		if (!hasChanged) for(var i=minCover.length;i--;){
			if (minCover[i]!=self.selectedEmails[i]) hasChanged=true;
		}//for

		if (hasChanged){
			self.selectedEmails=minCover;
			aThread.run(function(){
				yield (GUI.refresh());
			});

		}//endif
	});


};


