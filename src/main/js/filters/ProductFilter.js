
ProductUI = function(){
	this.Refresh();
};


ProductUI.makeFilter=function(){
	return ES.makeFilter("product", state.selectedProducts);
};//method


ProductUI.makeQuery=function(filters){
	var output={
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
		"facets": {
			"Products": {
				"terms": {
					"field": "product",
					"size": 100000
				}
			}
		}
	};

	var and=output.query.filtered.filter.and;
	for(var f in filters) and.push(filters[f]);

	return output;
};//method


ProductUI.prototype.Refresh = function(){
	this.query = ProductUI.makeQuery([
		ProgramFilter.makeFilter(state.selectedPrograms)
	]);

	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();
};


ProductUI.prototype.injectHTML=function(products){
	var html = '<ul id="productsList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="{product_name}">{product_name} ({product_count})</li>';

	for(var i = 0; i < products.length; i++){
		html += item.replaceAll({
			"class" : (include(state.selectedProducts, products[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
			"product_name" : products[i].term,
			"product_count" : products[i].count
		});
	}//for

	html += '</ul>';

	$("#products").html(html);
};


ProductUI.prototype.Success = function(resultsObj, data){

	var products = data.facets.Products.terms;
	this.injectHTML(products);

	$("#productsList").selectable({
		selected: function(event, ui){
			if (!include(state.selectedProducts, ui.selected.id)){
				state.selectedProducts.push(ui.selected.id);
				GUI.UpdateURL();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}
		},
		unselected: function(event, ui){
			var i = state.selectedProducts.indexOf(ui.unselected.id);
			if (i != -1){
				state.selectedProducts.splice(i, 1);
				GUI.UpdateURL();
				state.programFilter.Refresh();
				state.productFilter.Refresh();
				state.componentFilter.Refresh();
			}
		}
	});
}

ProductUI.prototype.Error = function(requestObj, errorData, errorMsg, errorThrown){

};