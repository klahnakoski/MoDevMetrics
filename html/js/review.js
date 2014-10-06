
//USES GUI.state TO PULL THE TEAMS

function*getReviewers(timeDomain, maxReviewers){
	maxReviewers=nvl(maxReviewers, 100);

	var persons = [];

	var allEmails = GUI.state.emails.split(",").map(String.trim);
	var allSelected=(yield(GUI.state.teamFilter.getAllSelectedPeople()));

	if (allSelected.length==0 && allEmails.length==0){
		Log.alert("Must select a team", function(){});
		Log.error("No team selected");
	}//endif

	allSelected.forall(function(p){
		p = Map.copy(p);
		p.id = p.id.deformat();
		p.email = Array.newInstance(p.email);
		p.esfilter = {"terms" : {"reviewer" : p.email}};
		persons.append(p);

		allEmails = allEmails.subtract(p.email)
	});
	allEmails.forall(function(e){
		p = {
			"id" : e.deformat(),
			"name" : e,
			"email" : Array.newInstance(e),
			"esfilter" : {"term" : {"reviewer" : e}}
		};
		persons.append(p);
	});


	var domain = {"type" : "set", "key" : "name", "isFacet" : true, "partitions" : [
		{"name":"pending", "esfilter":{"missing" : {"field" : "review_time"}}},
		{"name" : "done", "esfilter" : {"and" : [
			{"exists" : {"field" : "review_time"}},
			{"range" : {"review_time" : {"gte" : timeDomain.min.getMilli(), "lt" : timeDomain.max.getMilli()}}}
		]}}
	]};


	var reviewers = yield (ESQuery.run({
		"from" : "reviews",
		"select" : {"name" : "count", "value" : "bug_id", "aggregate" : "count"},
		"edges" : [
			{"name" : "type", "domain" : domain},
			{"name" : "reviewer", "domain" : {"type" : "set", "key" : "id", "partitions" : persons, "isFacet" : true}}
		],
		"esfilter" : {"and" : [
			{"or" : [
				{"missing" : {"field" : "review_time"}},
				{"range" : {"review_time" : {"gte" : timeDomain.min.getMilli()}}}
			]},
			{"terms" : {"reviewer" : Array.union(persons.select("email"))}}
		]}
	}));




	//SORT REVIEWERS BY count
	//THIS IS WHAT WE WOULD HAVE LIKED TO DO
	//reviewers=yield(Q({
	//	"from":reviewers,
	//	"sort":{"reviewer":{"value":"count", "sort":-1, "aggregate":"sum", "where":{"term":{"type":"done"}}}}
	//}));
	var ordered = Qb.sort(Qb.Cube2List(reviewers).filter({"term":{"type.name":"done"}}), {"value" : "count", "sort" : -1});
	var old_parts = reviewers.edges[1].domain.partitions;
	var new_parts = [];
	var new_cube = reviewers.cube.map(function(){return [];});

	for (var n = 0; n < aMath.min(ordered.length, maxReviewers); n++) {
		var nn = ordered[n].reviewer;
		for (var o = 0; o < old_parts.length; o++) {
			var oo = old_parts[o];
//			oo.esfilter = {"terms" : {"reviewer" : oo.email}};
			if (nn == oo) {
				new_parts[n] = oo;
				for(var j=0;j<new_cube.length;j++){
					new_cube[j][n] = reviewers.cube[j][o];
				}//for
				break;
			}//endif
		}//for
	}//for
	reviewers.edges[1].domain.partitions = new_parts;
	reviewers.cube = new_cube;

	yield reviewers;
}
