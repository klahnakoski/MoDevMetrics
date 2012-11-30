ProductFilter = function(){
	this.refresh();
};


ProductFilter.makeFilter = function(){
	return ES.makeFilter("product", GUI.state.selectedProducts);
};//method


ProductFilter.makeQuery = function(filters){
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
			"Products": {
				"terms": {
					"field": "product",
					"size": 100000
				}
			}
		}
	};

	var and = output.query.filtered.filter.and;
	for(var f=0;f<filters.length;f++) and.push(filters[f]);

	return output;
};//method


ProductFilter.prototype.refresh = function(){
	this.query = ProductFilter.makeQuery([
//		ProgramFilter.makeFilter(GUI.state.selectedPrograms)
	]);

	this.ElasticSearchQuery = OldElasticSearchQuery(this, 0, this.query);
	this.results = null;
	this.ElasticSearchQuery.Run();
};


ProductFilter.prototype.injectHTML = function(products){
	var html = '<ul id="productsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="product_{name}">{name} ({count})</li>';

	//GIVE USER OPTION TO SELECT ALL PRODUCTS
	var total = 0;
	for(var i = 0; i < products.length; i++) total += products[i].count;
	html += item.replaceVars({
		"class" : ((GUI.state.selectedProducts.length == 0) ? "ui-selectee ui-selected" : "ui-selectee"),
		"name" : "ALL",
		"count" : total
	});

	//LIST SPECIFIC PRODUCTS
	for(var i = 0; i < products.length; i++){
		html += item.replaceVars({
			"class" : (include(GUI.state.selectedProducts, products[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : products[i].term,
			"count" : products[i].count
		});
	}//for

	html += '</ul>';

	$("#products").html(html);
};


ProductFilter.prototype.success = function(data){

	var products = data.facets.Products.terms;

	//REMOVE ANY FILTERS THAT DO NOT APPLY ANYMORE (WILL START ACCUMULATING RESULTING IN NO MATCHES)
	var terms = [];
	for(var i = 0; i < products.length; i++) terms.push(products[i].term);
	GUI.state.selectedProducts = List.intersect(GUI.state.selectedProducts, terms);

	var self=this;

	aThread.run(function(){
		self.injectHTML(products);

		$("#productsList").selectable({
			selected: function(event, ui){
				var didChange = false;
				if (ui.selected.id == "product_ALL"){
					if (GUI.state.selectedProducts / length > 0) didChange = true;
					GUI.state.selectedProducts = [];
					GUI.state.selectedClassifications=[];
				} else{
					if (!include(GUI.state.selectedProducts, ui.selected.id.rightBut("product_".length))){
						GUI.state.selectedProducts.push(ui.selected.id.rightBut("product_".length));
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
				var i = GUI.state.selectedProducts.indexOf(ui.unselected.id.rightBut("product_".length));
				if (i != -1){
					GUI.state.selectedProducts.splice(i, 1);
					GUI.state.selectedClassifications=[];
					aThread.run(function(){
						yield (GUI.refresh());
					});
				}
			}
		});

		yield (null);
	});
	
};

