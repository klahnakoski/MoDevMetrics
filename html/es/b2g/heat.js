
importScript("../js/util/aUtil.js");
importScript("../js/util/aString.js");
importScript("owners.js");

OWNERS = Map.zip(mapAllKey(OWNERS, function(k, v){
	var manager;
	var owner;
	if (v.indexOf("(")>=0){
		manager = v.left(v.indexOf("(")).trim();
		owner = v.between("(", ")").trim();
	}else{
		manager = v.trim();
		owner="?";
	}//endif

	return [k.deformat(), {"name":k, "owner":{"name":owner, "manager":manager}}];
}));

function getOwner(comp){
	var output = OWNERS[comp.deformat()];
	if (output!==undefined) return output;
	return {"name":comp, "owner":{"name":"", "manager":"unknown"}};
}//function


// SHOW BLOCKER COUNT FOR ONE COMPONENT
function showComponent(detail, showTYPE) {
	var TEMPLATE = '<div class="blocker">' +
		'<div class="component">{{component}}</div>' +
		'<div class="componentmanager">{{manager}}</div>' +
		'<div class="componentowner">{{owner}}</div>' +
		'{{projectDetail}}' +
		'</div>';

	var component = Map.copy(detail[0]);
	component.component = getOwner(component.component).name;
	component.manager = getOwner(component.component).owner.manager;
	component.owner = "("+getOwner(component.component).owner.name+")";
	component.projectDetail = detail.map(function (project, i) {
		if (project.count > 0) {
			return showTYPE(project);
		}//endif

	});
	return TEMPLATE.replaceVars(component)
}//function

// SHOW TRIAGE COUNT FOR ONE COMPONENT, ONE PROJECT
function showTriage(detail) {
	detail.param = CNV.Object2URL({
		"bug_status": ["UNCONFIRMED", "NEW", "ASSIGNED", "REOPENED"],
		"cf_blocking_b2g": detail.project + "?",
		"component": detail.component
	});
	detail.color = age2color(detail.age);

	var TEMPLATE = '<div class="project"  style="background-color:{{color}}" href="https://bugzilla.mozilla.org/buglist.cgi?{{param}}">' +
		'<div class="release">{{project}}</div>' +
		'<div class="count">{{count}}</div>' +
		'</div>';

	return TEMPLATE.replaceVars(detail)
}//function

// SHOW BLOCKER COUNT FOR ONE COMPONENT, ONE PROJECT
function showBlocker(detail) {
	var param = {
		"bug_status": ["UNCONFIRMED", "NEW", "ASSIGNED", "REOPENED"],
		"cf_blocking_b2g": detail.project + "+",
		"component": detail.component
	};
	detail.param = CNV.Object2URL(param);

	param.assigned_to = "nobody@mozilla.org";
	detail.unassigned = CNV.Object2URL(param);
	detail.color = age2color(detail.age);

	var TEMPLATE = '<div class="project"  style="background-color:{{color}}" href="https://bugzilla.mozilla.org/buglist.cgi?{{param}}">' +
		'<div class="release">{{project}}</div>' +
		'<div class="count">{{count}}</div>' +
		(detail.unassignedCount > 0 ? '<div class="unassigned"><a class="count_unassigned" href="https://bugzilla.mozilla.org/buglist.cgi?{{unassigned}}">{{unassignedCount}}</a></div>' : '') +
		'</div>';

	return TEMPLATE.replaceVars(detail)
}//function


// SHOW BLOCKER COUNT FOR ONE COMPONENT, ONE PROJECT
function showRegression(detail) {
	var param = {
		"bug_status": ["UNCONFIRMED", "NEW", "ASSIGNED", "REOPENED"],
		"keywords": "regression",
		"component": detail.component
	};
	detail.param = CNV.Object2URL(param);

	param.assigned_to = "nobody@mozilla.org";
	detail.unassigned = CNV.Object2URL(param);
	detail.color = age2color(detail.age);

	var TEMPLATE = '<div class="project"  style="background-color:{{color}}" href="https://bugzilla.mozilla.org/buglist.cgi?{{param}}">' +
		'<div class="release">{{project}}</div>' +
		'<div class="count">{{count}}</div>' +
		(detail.unassignedCount > 0 ? '<div class="unassigned"><a class="count_unassigned" href="https://bugzilla.mozilla.org/buglist.cgi?{{unassigned}}">{{unassignedCount}}</a></div>' : '') +
		'</div>';

	return TEMPLATE.replaceVars(detail)
}//function

function addProjectClickers(cube) {
	$(".project").hover(function (e) {
		var old_color = $(this).attr("old_color");
		if (old_color == undefined){
			old_color = $(this).css("background-color");
			$(this).attr("old_color", old_color);
		}//endif
		$(this).css("background-color", Color.newHTML(old_color).lighter().toHTML());
	},function (e) {
		var old_color = $(this).attr("old_color");
		$(this).css("background-color", old_color);
	}).click(function (e) {
			var link = $(this).attr("href");
			window.open(link);
		});

	$(".count_unassigned").click(function (e) {
		var link = $(this).attr("href");
		window.open(link);
		return false;
	});
}//function


function age2color(age) {
	var green = Color.green.multiply(0.4);
	var color = green.rotate(Math.min(1.0, age / 7) * 120);
	return color.toHTML();
}//function




