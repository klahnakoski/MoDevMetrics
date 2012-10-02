FilterUI = function()
{
   var html = "";

	html += '<h3><a href="#">Selection</a></h3>';
	html += '<div id="summary"></div>';
	if( customFilters.length != 0 )
	{
		html += '<h3><a href="#">Custom Filters</a></h3>';
		html += '<div id="customFilters"></div>';
	}
	html += '<h3><a href="#">Products</a></h3>';
	html += '<div id="products"></div>';
	html += '<h3><a href="#">Components</a></h3>';
	html += '<div id="components"></div>';
		
    $( "#filters").html(html);

    $( "#filters" ).accordion({
		autoHeight: false,
		navigation: true
	});
	
    this.GenerateCustomFilters();
    this.Refresh();
}

FilterUI.prototype.Refresh = function()
{
	this.query = {
         "query" : {
                "filtered" : {
                    "query": {
                        "bool": {
                            "must" : [
                                { "range" : { "expires_on" : { "gt" : Date.now().addDay(1) } } }
                            ]
                        }
                    },
                    "filter" : {
                        "not" : {
                            "terms" : { "bug_status" : ["resolved", "verified", "closed"] }
                        }
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
	}
	
	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();	
}

FilterUI.prototype.GenerateCustomFilters = function()
{
	if( customFilters.length == 0 )
		return;
	
    var html = "";

	html += '<ul id="customFiltersList" class="menu ui-selectable">';
		
	for(i=0; i<customFilters.length; i++)
	{
		html += '<li class="ui-selectee';
	
		if(include(state['customFilters'], customFilters[i].name))
			html += ' ui-selected';
			
		html +=	'" id="' + customFilters[i].name + 
		'">' + customFilters[i].name + '</li>';
	}
	
	html += '</ul>';

    document.getElementById("customFilters").innerHTML = html;

	var callBackObj = this;
	
	$( "#customFiltersList" ).selectable({
		selected: function(event, ui) {    
			if( !include(state['customFilters'], ui.selected.id))
			{
				state['customFilters'].push(ui.selected.id);
				UpdateURL();
				UpdateSummary();
				createChart();
			}
		},
		unselected: function(event, ui) {    
			var i = state['customFilters'].indexOf( ui.unselected.id);
			if( i != -1)
			{
				state['customFilters'].splice(i,1);
				UpdateURL();
				UpdateSummary();
				createChart();
			}
		}
	});
}

FilterUI.prototype.Success = function(resultsObj, data)
{

	var products = data.facets.Products.terms;
	componentUI = new ComponentUI();
	
   var html = "";

	html += '<ul id="productsList" class="menu ui-selectable">';

    var item='<li class="{class}" id="{product_name}">{product_name} ({product_count})</li>';

	for(i=0; i<products.length; i++){
        html+=item.replaceAll({
            "class" : (include(state['products'], products[i].term) ? "ui-selectee ui-selected" : "ui-selectee"),
            "product_name" : products[i].term,
            "product_count" : products[i].count
        });
   	}//for
	
	html += '</ul>';

    document.getElementById("products").innerHTML = html;

	var callBackObj = this;
	
	$( "#productsList" ).selectable({
		selected: function(event, ui) {    
			if( !include(state['products'], ui.selected.id))
			{
				state['products'].push(ui.selected.id);
				UpdateURL();
				componentUI.Refresh();
			}
		},
		unselected: function(event, ui) {    
			var i = state['products'].indexOf( ui.unselected.id);
			if( i != -1)
			{
				state['products'].splice(i,1);
				UpdateURL();
				componentUI.Refresh();
			}
		}
	});
}

FilterUI.prototype.Error = function( requestObj, errorData, errorMsg, errorThrown ) {
	
};

ComponentUI = function() 
{
	this.Refresh()
}

ComponentUI.prototype.Refresh = function()
{
	this.query = 
	{
         "query" : {
            "filtered" : {
                "query": {
                    "bool": {
                        "must" : [
                            { "range" : { "expires_on" : { "gt" : Date.now().addDay(1) } } }
                        ]
                    }
                },
                "filter" : {
                    "not" : {
                        "terms" : { "bug_status" : ["resolved", "verified", "closed"] }
                    }
                }
            }
        },
		"from": 0,
		"size": 0,
		"sort": [],
		"facets": {
			"Components": {
				"terms": {
					"field": "component",
					"size": 100000
		      	}
		    }
		}
	};
	
	this.InjectFilter();
	
	this.restQuery = new RestQuery(this, 0, this.query);
	this.results = null;
	this.restQuery.Run();
}

ComponentUI.prototype.InjectFilter = function()
{
	if( state['products'].length != 0)
	{
		this.query.query.bool.should = [];
		this.query.query.bool.minimum_number_should_match = 1;
		
		for(i=0; i < state['products'].length; i++)
		{
			this.query.query.bool.should.push( {"term" : { "product" : state['products'][i] }} );
		}
	}
};

ComponentUI.prototype.Success = function(resultsObj, data)
{
    var html = "";
	var components = data.facets.Components.terms;
	var terms = [];
	
	for(i=0; i<components.length; i++)
	{	
		terms.push(components[i].term);
	}
	
	var newComponentState = [];
	
	for( i=0; i<state['components'].length; i++)
	{
		if( include(terms, state['components'][i]) )
		{
			newComponentState.push( state['components'][i])
		}
			
	}
	
	state['components'] = newComponentState;
	UpdateURL();	

	html += '<ul id="componentsList" class="menu ui-selectable">';
	
	for(i=0; i<components.length; i++)
	{	
		html += '<li class="ui-selectee';
	
		if(include(state['components'], components[i].term))
			html += ' ui-selected';
			
		html +=	'" id="' + components[i].term + 
		'">' + components[i].term + 
		' (' + components[i].count + ')</li>';
	}
	
	html += '</ul>';
	html += '</div>';
	
	var callBackObj = this;
	
	$( "#components").html(html);
	
	$( "#componentsList" ).selectable({
		selected: function(event, ui) {    
			if( !include(state['components'], ui.selected.id))
			{
				state['components'].push(ui.selected.id);
				UpdateURL();
				UpdateSummary();
				createChart();
			}
		},
		unselected: function(event, ui) {    
			var i = state['components'].indexOf( ui.unselected.id);
			if( i != -1)
			{
				state['components'].splice(i,1);
				UpdateURL();
				UpdateSummary();
				createChart();
			}
		}
	});
	
	UpdateSummary();
	createChart();
};

InjectFilters = function( queries )
{
	//console.info("InjectFilters Called")
	
	if( state['products'].length == 0 &&
		state['components'].length == 0 &&
		state['customFilters'].length == 0)
		return;
	
	for(i=0; i<queries.length; i++)
	{
		var query = queries[i].query;
		
		if( !("filter" in query) )
			query.filter = {};
		
		var temp = null;

		if( !jQuery.isEmptyObject( query.filter ) )
		{
			if( !("and" in query.filter) )
			{			
				temp = clone(query.filter);
				query.filter = {};
				query.filter.and = [];
			}
		} 
		else 
		{
			query.filter.and = [];
		}
		
		if( temp != null)
			query.filter.and.push(temp);
	
		ParseState(query, 'products', 'product')
		ParseState(query, 'components', 'component')
		ParseCustomFilters( query );
	}
};

ParseCustomFilters = function(query)
{
	//console.info('ParseCustomFilters');
	
	if( state['customFilters'].length == 0)
		return;
		
	query.filter.and.push({"or" : []});
	
	var or = query.filter.and[query.filter.and.length-1].or;
	
	for(j=0; j<customFilters.length; j++)
	{
//		console.info('customFilters check: ' + customFilters[i].name + " : " + state['customFilters']);
		if( include(state['customFilters'], customFilters[j].name) )
		{
//			console.info('customFilters found: ' + customFilters[i].name);
			for(x=0; x<customFilters[j].filters.length; x++)
			{
//				console.info("customFilters[i].filters[x]: " + JSON.stringify(customFilters[i].filters[x]));
				or.push( customFilters[j].filters[x] );
			}
		}
	}
};

ParseState = function(query, stateName, fieldName)
{
	if( state[stateName].length == 0)
		return;
		
	query.filter.and.push({"or" : []});
	
	var or = query.filter.and[query.filter.and.length-1].or;
	
	for(x=0; x<state[stateName].length; x++)
	{
		var newTerm = {};
		newTerm.term = {}
		newTerm.term[fieldName] = state[stateName][x];
		or.push( newTerm );
	}
	
//	query.filter.and[query.filter.and.length-1].or = or;
//	console.info("query: " + JSON.stringify( query ));
//  return query;
};


UpdateSummary = function()
{
	var html = "";

	if( state["customFilters"].length > 0 )
	{
		html += "Custom Filters: "
		for(i=0; i<state["customFilters"].length; i++)
		{
			html += state["customFilters"][i];
			if( state["customFilters"].length-1 != i )
				html += ", "
		}
		html += "<br><br>";
	}
	
	html += "Products: ";
	
	if( state["products"].length == 0 )
		html += "All";
	
	for(i=0; i<state["products"].length; i++)
	{
		html += state["products"][i];
		if( state["products"].length-1 != i )
			html += ", "
	}
	
	html += "<br><br>Components: ";

	if( state["components"].length == 0 )
		html += "All";
			
	for(i=0; i<state["components"].length; i++)
	{
		html += state["components"][i];
		if( state["components"].length-1 != i )
			html += ", "
	}
	
	html += "<br><br><br><b>Hold CTRL while clicking to multi-select and deselect from the lists below.</b>"
	html += '<br><br><a href="index.html">Return to Query List</a>'
	
	$("#summary").html(html);
};

state['products'] = [];
state['components'] = [];
state['customFilters'] = [];
customFilters = [];
componentUI = null;