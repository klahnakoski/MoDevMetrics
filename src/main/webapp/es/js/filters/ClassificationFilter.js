/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

ClassificationFilter = function(){
	//SET TO LOWERCASE
	forAllKey(ClassificationFilter.products, function(k,val){
		val.forall(function(v, i, a){
			a[i]=v.toLowerCase();
		});
	});

	this.refresh();
};


//FROM https://bugzilla.mozilla.org/query.cgi
ClassificationFilter.products={};
ClassificationFilter.products["Client Software"] = ['Add-on SDK','Boot2Gecko','Calendar','Camino','Composer','Fennec','Firefox','Firefox for Android','Firefox for Metro','Mozilla Localizations','Mozilla Services','Other Applications','Penelope','SeaMonkey','Thunderbird' ];
ClassificationFilter.products["Components"] = ['Core','Directory','JSS','MailNews Core','NSPR','NSS','Plugins','Rhino','Tamarin','Testing','Toolkit' ];
ClassificationFilter.products["Server Software"] = ['addons.mozilla.org','AUS','Bugzilla','Input','Marketplace','Skywriter','Socorro','Testopia','Webtools' ];
ClassificationFilter.products["Other"] = ['Air Mozilla','bugzilla.mozilla.org','Community Tools','Data Safety','Datazilla','Extend Firefox','Finance','Firefox Affiliates','L20n','Marketing','Mozilla Communities','Mozilla Corporation','Mozilla Developer Network','Mozilla Grants','Mozilla Labs','Mozilla Messaging','Mozilla Metrics','Mozilla QA','Mozilla Reps','mozilla.org','mozillaignite','Pancake','Petri','Popcorn','Privacy','quality.mozilla.org','Snippets','support.mozilla.org','support.mozillamessaging.com','Tech Evangelism','Thimble','Tracking','Untriaged Bugs','Web Apps','webmaker.org','Websites','www.mozilla.org' ];
ClassificationFilter.products["Graveyard"] = ['CCK','Core Graveyard','Derivatives','Documentation','Firefox Graveyard','Grendel','MailNews Core Graveyard','Minimo','Mozilla Labs Graveyard','Mozilla QA Graveyard','MozillaClassic','Other Applications Graveyard','Servo','Toolkit Graveyard','Websites Graveyard','Webtools Graveyard' ];




ClassificationFilter.makeFilter = function(){
	D.error("this filter is a fake!  it just selects product for you!");
};//method



ClassificationFilter.prototype.refresh = function(){
	this.injectHTML();
};


ClassificationFilter.prototype.injectHTML = function(){
	var html = '<ul id="classificationList" class="menu ui-selectable">';
	var item = '<li class="{class}" id="classification_{name}">{name}</li>';

	//LIST SPECIFIC CLASSIFICATIONS
	var classifications=Object.keys(ClassificationFilter.products);
	for(var i = 0; i < classifications.length; i++){
		html += item.replaceVars({
			"class" : (include(GUI.state.selectedClassifications, classifications[i]) ? "ui-selectee ui-selected" : "ui-selectee"),
			"name" : classifications[i]
		});
	}//for

	html += '</ul>';

	$("#classifications").html(html);


	$("#classificationList").selectable({
		selected: function(event, ui){
			var didChange = false;
			var selection=ui.selected.id.rightBut("classification_".length);
			if (!include(GUI.state.selectedClassifications, selection)){
				GUI.state.selectedClassifications.push(selection);

				//ADD TO THE SELECTED PROGRAMS LIST
				GUI.state.selectedProducts.appendArray(ClassificationFilter.products[selection]);

				didChange = true;
			}//endif

			if (didChange){
				aThread.run(GUI.refresh());
			}//endif
		},
		unselected: function(event, ui){
			var i = GUI.state.selectedClassifications.indexOf(ui.unselected.id.rightBut("classification_".length));
			if (i != -1){
				GUI.state.selectedClassifications.splice(i, 1);
				aThread.run(GUI.refresh());
			}
		}
	});


};


