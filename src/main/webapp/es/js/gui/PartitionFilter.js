/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


PartitionFilter = function(){};


PartitionFilter.newInstance=function(param){
	ASSERT.hasAttributes(param, ["name", "dimension", "onlyOne"]);

	var self=new PartitionFilter();
	Map.copy(param, self);

	if (self.dimension.partitions===undefined) D.error(self.dimension.name+" does not have a partition defined");

	self.id=self.dimension.parent.name.replaceAll(" ", "_");
	self.isFilter=true;
	self.treeDone=false;
	self.DIV_ID=name.replaceAll(" ", "_")+"_id";
	self.DIV_LIST_ID=name.replaceAll(" ", "_")+"_list";
	self.disableUI=false;
	self.selectedParts=[];

	self.parts=[];
	self.parents={};
	function convertToTree(parent, dimension){
		var node={};
		node.id=parent.id+"."+dimension.name.replaceAll(" ", "_");
		node.attr={id:node.id};
		node.data=dimension.name;
		node.esfilter=dimension.esfilter;
		self.parents[node.id]=parent;
		if (dimension.partitions){
			node.children=dimension.partitions.map(function(v,i){
				return convertToTree(node, v);
			});
		}//endif
		self.parts.push(node);
		return node;
	}//function

	self.hierarchy=convertToTree({"id":self.id}, self.dimension).children;
//	self.hierarchy[0].data=param.name;
	
	return self;
};


PartitionFilter.prototype.getSelectedParts=function(){
	var self=this;

	//CONVERT SELECTED LIST INTO PART OBJECTS
	return this.selectedParts.map(function(id){
		for(var i = self.parts.length; i--;){
			if (self.parts[i].id==id) return self.parts[i];
		}//for
	});
};//method



//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
PartitionFilter.prototype.getSimpleState=function(){
	if (this.selectedParts.length==0) return undefined;
	return this.selectedParts.join(",");
};

//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
PartitionFilter.prototype.setSimpleState=function(value){
	if (!value || value.trim()==""){
		this.selectedParts=[];
	}else{
		this.selectedParts=value.split(",");
	}//endif

	//SOME VALUES WILL BE IMPOSSIBLE, SO SHOULD BE REMOVED
	this.selectedParts=this.getSelectedParts().map(function(v, i){return v.id;});
	this.refresh();
};


PartitionFilter.prototype.getSummary=function(){
	if (this.selectedParts.length==0) return this.name+": All";
	return this.name+": "+this.getSelectedParts().map(function(p){return p.data;}).join(", ");
};//method


PartitionFilter.prototype.makeTree=function(){
	if (this.treeDone) return;
	if ($("#" + CNV.String2JQuery(this.DIV_LIST_ID)).length==0) return;

	this.treeDone=true;

	var self=this;
	$("#" + CNV.String2JQuery(this.DIV_LIST_ID)).jstree({
		"json_data" : {
			"data":self.hierarchy		 //EXPECTING id, name, children FOR ALL NODES IN TREE
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

		var checked = {};
		if (self.onlyOne){
			//DID WE JUST CHECK OR UNCHECK?
			$(".jstree-checked").each(function(){
				if (data.rslt[0].id==$(this).attr("id"))checked=Map.newInstance(data.rslt[0].id, true);
			});
		}else{
			//FIRST MAKE A HASH OF CHECKED ITEMS
			$(".jstree-checked").each(function(){
				checked[$(this).attr("id")] = true;
			});
		}//endif

		//WE NOW HAVE A RIDICULOUS NUMBER OF CHECKED ITEMS, REDUCE TO MINIMUM COVER

		//IF MANAGER IS CHECKED, THEN DO NOT INCLUDE
		var minCover = mapAllKey(checked, function(id, v, m){
			if (checked[self.parents[id].id]) return;
			return id;
		});
		minCover.sort();

		//HAS ANYTHING CHANGED?
		var hasChanged = false;
		if (self.selectedParts.length != minCover.length) hasChanged = true;
		if (!hasChanged) for(var i = minCover.length; i--;){
			if (minCover[i] != self.selectedParts[i]) hasChanged = true;
		}//for

		if (hasChanged){
			self.selectedParts = minCover;
			GUI.refresh();
		}//endif
	}).bind("loaded.jstree", function(){self.refresh();});
};


PartitionFilter.prototype.makeHTML=function(){
	return '<div id="'+CNV.String2HTML(this.DIV_LIST_ID)+'" style="300px">'+
		'<div id="'+CNV.String2HTML(this.DIV_LIST_ID)+'"></div>'+
		'</div>';
};


//RETURN AN ES FILTER
PartitionFilter.prototype.makeFilter = function(){
	if (this.selectedParts.length == 0) return ES.TrueFilter;

	var selected = this.getSelectedParts();
	if (selected.length == 0) return ES.TrueFilter;

	return {"or":selected.map(function(v){return v.esfilter;})};
};//method



PartitionFilter.prototype.refresh = function(){
	//FIND WHAT IS IN STATE, AND UPDATE STATE
	this.disableUI=true;
	this.makeTree();
	var selected=this.getSelectedParts();

	var f=$('#'+this.DIV_LIST_ID);
	f.jstree("deselect_all");
	f.jstree("uncheck_all");
	selected.forall(function(p){
		f.jstree("select_node", ("#"+CNV.String2JQuery(p.id)));
		f.jstree("check_node", ("#"+CNV.String2JQuery(p.id)));
	});

	this.disableUI=false;
};


