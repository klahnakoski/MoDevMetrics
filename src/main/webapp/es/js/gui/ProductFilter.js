/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ProductFilter = function(){
	this.name="Products";
	this.isFilter=true;
	this.selected=[];
	this.refresh();
};


ProductFilter.prototype.makeFilter = function(){
	if (this.selected.length==0) return ES.TrueFilter;
	return {"terms":{"product":this.selected}};
};//method


ProductFilter.prototype.makeQuery = function(filters){
	var output = {
		"query" : {
			"filtered" : {
				"query": {
					"match_all":{}
				},
				"filter" : {
					"and":[
						Mozilla.CurrentRecords.esfilter,
						Mozilla.BugStatus.Open.esfilter
					]
				}
			}
		},
		"from": 0,
		"size": 0,
		"sort": [],
		"facets":{
			"Products": {
				"terms": {
					"field": "product",
					"size": 100000
				}
			}
		}
	};

	return output;
};//method

ProductFilter.prototype.getSummary=function(){
	 var html = "Products: ";
	if (this.selected.length == 0){
		html += "All";
	} else{
		html += this.selected.join(", ");
	}//endif
	return html;
};//method

//RETURN SOMETHING SIMPLE ENOUGH TO BE USED IN A URL
ProductFilter.prototype.getSimpleState=function(){
	if (this.selected.length==0) return undefined;
	return this.selected.join(",");
};


ProductFilter.prototype.setSimpleState=function(value){
	if (!value || value==""){
		this.selected=[];
	}else{
		this.selected=value.split(",").map(function(v){return v.trim();});
	}//endif
	this.refresh();

};


ProductFilter.prototype.refresh = function(){
	this.query = this.makeQuery();

	this.ElasticSearchQuery = OldElasticSearchQuery(this, 0, this.query);
	this.results = null;
	this.ElasticSearchQuery.Run();
};

ProductFilter.prototype.makeHTML=function(){
	return '<div id="products"></div>';
};//method



ProductFilter.prototype.injectHTML = function(products){
	var html = '<ul id="productsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="product_{name}">{name} ({count})</li>';

	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	var total = 0;
	for(var i = 0; i < products.length; i++) total += products[i].count;
	html += item.replaceVars({
		"class" : ((this.selected.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	//LIST SPECIFIC PRODUCTS
	for(var i = 0; i < products.length; i++){
		html += item.replaceVars({
			"class" : (include(this.selected, products[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : products[i].term,
			"count" : products[i].count
		});
	}//for

	html += '</ul>';

	$("#products").html(html);
};


ProductFilter.prototype.success = function(data){
	if (data==null) return;
	var products = data.facets.Products.terms;

	//REMOVE ANY FILTERS THAT DO NOT APPLY ANYMORE (WILL START ACCUMULATING RESULTING IN NO MATCHES)
	var terms = [];
	for(var i = 0; i < products.length; i++) terms.push(products[i].term);
	this.selected = List.intersect(this.selected, terms);

	var self=this;

	aThread.run(function(){
		self.injectHTML(products);

		$("#productsList").selectable({
			selected: function(event, ui){
				var didChange = false;
				if (ui.selected.id == "product_ALL"){
					if (self.selected.length > 0) didChange = true;
					self.selected = [];
				} else{
					if (!include(self.selected, ui.selected.id.rightBut("product_".length))){
						self.selected.push(ui.selected.id.rightBut("product_".length));
						didChange = true;
					}//endif
				}//endif

				if (didChange)GUI.refresh();
			},
			unselected: function(event, ui){
				var i = self.selected.indexOf(ui.unselected.id.rightBut("product_".length));
				if (i != -1){
					self.selected.splice(i, 1);
					GUI.refresh();
				}
			}
		});

		yield (null);
	});
	
};

