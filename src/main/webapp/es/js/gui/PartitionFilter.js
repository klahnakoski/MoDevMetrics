/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


PartitionFilter = function(){};



(function(){




PartitionFilter.newInstance=function(param){
	ASSERT.hasAttributes(param, ["name", "dimension", "onlyOne", "expandAll"]);

	var self=new PartitionFilter();
	Map.copy(param, self);

	if (self.dimension.partitions===undefined && self.dimension.edges===undefined) D.error(self.dimension.name+" does not have a partition defined");

	self.id=self.dimension.parent.name.replaceAll(" ", "_");
	self.isFilter=true;
	self.treeDone=false;
	self.DIV_ID=self.id.replaceAll(" ", "_")+"_id";
	self.DIV_LIST_ID=self.id.replaceAll(" ", "_")+"_list";
	self.FIND_TREE="#"+CNV.String2JQuery(self.DIV_LIST_ID);
	self.disableUI=false;
	self.selectedParts=[];
	self.numLater=0;
	self.id2part={};        //MAP IDs TO PART OBJECTS

	self.allParts=[];
	self.parents={};

	self.hierarchy=convertToTree(self, {"id":self.id}, self.dimension).children;

	return self;
};


function updateLater(self, treeNode, dimension){
	self.numLater++;
	aThread.run(function(){
		//DO THIS ONE LATER
		treeNode.children = [];
		while(dimension.partitions instanceof aThread) yield (aThread.join(dimension.partitions));
		treeNode.children = dimension.partitions.map(function(v, i){
			if (i<dimension.limit) return convertToTree(self, treeNode, v);
		});
		self.numLater--;
		yield (null);
	});
}

function convertToTree(self, parent, dimension){
	var node={};
	node.id=parent.id+"."+dimension.name.replaceAll(" ", "_");
	node.attr={id:node.id};
	node.data=dimension.name;
	self.id2part[node.id]=dimension;   //STORE THE WHOLE EDGE/PART

	self.allParts.push(node);
	self.parents[node.id]=parent;

	if (dimension.partitions){
		if (dimension.partitions instanceof aThread){
			updateLater(self, node, dimension);
		}else{
			node.children=dimension.partitions.map(function(v,i){
				if (i<dimension.limit) return convertToTree(self, node, v);
			});
		}//endif
	}//endif
	if (dimension.edges){
		node.children=dimension.edges.map(function(v,i){
			return convertToTree(self, node, v);
		});
	}//endif
	return node;
}//function





PartitionFilter.prototype.getSelectedParts=function(){
	var self=this;

	//CONVERT SELECTED LIST INTO PART OBJECTS
	return this.selectedParts.map(function(id){
		for(var i = self.allParts.length; i--;){
			if (self.allParts[i].id==id) return self.allParts[i];
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
	if (this.treeDone) return;      //ALREADY MADE TREE
	if ($(this.FIND_TREE).length==0) return; //NOT BEEN CREATED YET

	var self=this;
	if (self.numLater>0 && self.refreshLater===undefined){
		//WAIT FOR LODING TO COMPLETE
		self.refreshLater=aThread.run(function(){
			while(self.numLater>0) yield(aThread.sleep(200));
			self.refreshLater=undefined;
			self.makeTree();
		});
		return;
	}//endif

	this.treeDone=true;

	$(this.FIND_TREE).jstree({
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
	}).bind("loaded.jstree", function(){
		if (self.expandAll) $(self.FIND_TREE).jstree('open_all');
		self.refresh();
	});
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

	var self=this;
	return {"or":selected.map(function(v){return self.id2part[v.id].esfilter;})};
};//method



PartitionFilter.prototype.refresh = function(){
	//FIND WHAT IS IN STATE, AND UPDATE STATE
	this.disableUI=true;
	this.makeTree();
	var selected=this.getSelectedParts();

	var f=$('#'+CNV.String2JQuery(this.DIV_LIST_ID));
	f.jstree("deselect_all");
	f.jstree("uncheck_all");
	selected.forall(function(p){
		f.jstree("select_node", ("#"+CNV.String2JQuery(p.id)));
		f.jstree("check_node", ("#"+CNV.String2JQuery(p.id)));
	});

	this.disableUI=false;
};


})();