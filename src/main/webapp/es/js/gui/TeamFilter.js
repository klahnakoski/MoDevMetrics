/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


TeamFilter = function(){};


TeamFilter.newInstance=function(field_name){
	var self=new TeamFilter();

	self.disableUI=false;
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
			v.id=v.id.between("mail=", ",");
			v.manager=v.manager==null ?  null : v.manager.between("mail=", ",");
			if (v.email==null) v.email=v.id;

			if (self.managers[v.id])
				D.warning(v.id+" is not unique");
			self.managers[v.id]= v.manager;

			//USED BY TREE VIEW
			v.data=v.name;
			v.attr={"id":v.id};
		});

		var hier=CUBE.List2Hierarchy({
			"from":people,
			"id_field":"id",
			"child_field":"children",
			"parent_field":"manager"
		}).map(function(v, i){
			//IGNORE THE TOP LEVEL 'PEOPLE' WITH NO CHILDREN (THE PEOPLE THAT NEED TO SET THIER MANAGERS)
			if (v.children) return v;
			return undefined;
		});

		self.injectHTML(hier);

		//JSTREE WILL NOT BE LOADED YET
		//HOPEFULLY IT WILL EXIST WHEN THE HEAD EXISTS
//		'#' + myid.replace(/(:|\.)/g,'\\$1');

		while($("#"+CNV.String2JQuery("gkovacs@mozilla.com")).length==0){
			yield (aThread.sleep(100));
		}//while

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
			if (self.people[i].id==email) return self.people[i];
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


TeamFilter.prototype.makeFilter = function(field_name){
	if (this.selectedEmails.length == 0) return ES.TrueFilter;
	if (this.field_name==null && field_name===undefined) return ES.TrueFilter;

	var selected = aThread.runSynchronously(this.getSelectedPeople());
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

	return ES.makeFilter(Util.coalesce(field_name, this.field_name), bzEmails);
};//method



TeamFilter.prototype.refresh = function(){
	//FIND WHAT IS IN STATE, AND UPDATE STATE
	this.disableUI=true;
	var selected=yield(this.getSelectedPeople());

	var f=$('#teamList');
	f.jstree("deselect_all");
	selected.forall(function(p){
		f.jstree("select_node", ("#"+CNV.String2JQuery(p.id)));
		f.jstree("check_node", ("#"+CNV.String2JQuery(p.id)));
	});

	this.disableUI=false;
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
//		"checkbox":{
//			"two_state":true
//		},
		"plugins" : [ "themes", "json_data", "ui", "checkbox" ]
	}).bind("change_state.jstree", function (e, data){
		if (self.disableUI) return;
	
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
			minCover.push(id);
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
			aThread.run(GUI.refresh());
		}//endif
	});


};


