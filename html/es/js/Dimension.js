/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("aLibrary.js");
importScript("ESQuery.js");


var Dimension={};


var DEFAULT_QUERY_LIMIT=20;

Dimension.prototype={
	"getDomain":function(simpleNames){
		var self=this;
		var output={
			"type":this.type,
			"name":this.name,
			"partitions":!this.partitions ? undefined : this.partitions.map(function(v, i){
				if (i>=nvl(self.limit, DEFAULT_QUERY_LIMIT)) return undefined;
				return {
					"name":v.name,
					"value":v.value,
					"esfilter":v.esfilter,
					"style":v.style,
					"weight":v.weight   //YO!  WHAT DO WE *NOT* COPY?
				};
			}),
			"min":this.min,
			"max":this.max,
			"interval":this.interval,
			//THE COMPLICATION IS THAT SOMETIMES WE WANT SIMPLE PARTITIONS, LIKE
			//STRINGS, DATES, OR NUMBERS.  OTHER TIMES WE WANT PARTITION OBJECTS
			//WITH NAME, VALUE, AND OTHER MARKUP.
			//USUALLY A "set" IS MEANT TO BE SIMPLE, BUT THE end() FUNCTION IS
			//OVERRIDES EVERYTHING AND IS EXPLICIT.  - NOT A GOOD SOLUTION BECAUSE
			//end() IS USED BOTH TO INDICATE THE QUERY PARTITIONS *AND* DISPLAY
			//COORDINATES ON CHARTS

			//PLEASE SPLIT end() INTO value() (replacing the string value) AND
			//label() (for presentation)
			"value": (!this.value && this.partitions) ? "name" : this.value,
			"end":nvl(this.end, (this.type=="set" && this.name!==undefined) ? function(v){return v;} : undefined),
//			"value":(!this.value && this.partitions) ? "name" : this.value,
			"isFacet":this.isFacet

		};
		return output;


//		var output=Map.copy(this);
//		output.field=undefined;
//		output.parent=undefined;
//		output["default"]=undefined;
//		output.index=undefined;
//		return Map.copy(output);
	},//method

	"getSelect":function(){
		var domain=this.getDomain();
		if (domain.getKey===undefined) domain.getKey=function(v){return v.name;}; //BASIC COMPILE
		if (domain.NULL===undefined) domain.NULL={"name":"Other"};

		var output={
			"name":this.name,
			"value":MVEL.Parts2TermScript(this.index, domain)
		};
		return output;
	}
};




(function(){



	////////////////////////////////////////////////////////////////////////////
	// BUILD A HIERARCHY BY REPEATEDLY CALLING THIS METHOD WITH VARIOUS childPaths
	// count IS THE NUMBER FOUND FOR THIS PATH
	function addParts(parentPart, childPath, count, index){
		if (index===undefined) index=0;
		if (index==childPath.length) return;
		var c=childPath[index];
		parentPart.count=nvl(parentPart.count, 0)+count;

		if (parentPart.partitions===undefined) parentPart.partitions=[];
		for(var i=0;i<parentPart.partitions.length;i++){
			if (parentPart.partitions[i].name==c.name){
				addParts(parentPart.partitions[i], childPath, count, index+1);
				return;
			} //endif
		}//for
		parentPart.partitions.push(c);
//		parentPart[c.name]=c;  //HANDLED BY convertPart()
//		c.parent=parentPart;    //HANDLED BY convertPart()
		addParts(c, childPath, count, index+1);
	}//method



	Dimension.addEdges=function(lowerCaseOnly, parentDim, edges){
		function convertPart(part){
			if (part.partitions){
				part.partitions.forall(function(p,i){
					convertPart(p);
					p.value=nvl(p.value, p.name);
					p.parent=part;
					if (part.index) p.index=part.index;   //COPY INDEX DOWN
					part[p.name]=nvl(part[p.name], p);
				});
			}//endif

			if (part.esfilter){
				if (lowerCaseOnly) part.esfilter=CNV.JSON2Object(CNV.Object2JSON(part.esfilter).toLowerCase());
			}else if (part.partitions){
				if (part.partitions.length>100){
					D.error("Must define an esfilter on "+part.name+", there are too many partitions ("+part.partitions.length+")");
				}else{
					//DEFAULT esfilter IS THE UNION OF ALL CHILD FILTERS
					if (part.partitions){
						part.esfilter={"or":part.partitions.select("esfilter")};
					}//endif
				}//endif
			}//endif
		}

		function convertDim(dim){
//			if (dim.name=="DWriteEnabled"){
//				D.println();
//			}


			if (dim.edges){
				//ALLOW ACCESS TO SUB-PART BY NAME (IF ONLY THERE IS NO NAME COLLISION)
				dim.edges.forall(function(e, i){
					dim[e.name]=nvl(dim[e.name], e);
					e.parent=dim;
					if (dim.index) e.index=dim.index;   //COPY INDEX DOWN
					convertDim(e);
				});
			}//endif

			convertPart(dim);

			if (dim.limit===undefined) dim.limit=DEFAULT_QUERY_LIMIT;

			if (dim.field!==undefined && CUBE.domain.PARTITION.contains(dim.type) && dim.partitions===undefined){
//				if (dim.type=="boolean"){
//					D.println("");
//				}

				dim.partitions=Thread.run(function(){
					//IF dim.field IS A NUMBER, THEN SET-WISE EDGES DO NOT WORK (CLASS CAST EXCEPTION)
//					if (dim.field=="info.appBuildID"){
//						D.warning("Special case for info.appBuildID, please fix Telemetry schema");
//						edge={"name":dim.field, "value":"\"\"+"+dim.field};
//					}else{
						edge={"name":dim.field, "value":dim.field};
//					}//endif

					var a=D.action("Get parts of "+dim.name, true);
					var parts=yield (ESQuery.run({
						"from":dim.index,
						"select":{"name":"count", "value":dim.field, "aggregate":"count"},
						"edges":[edge],
						"limit":dim.limit
					}));
					D.actionDone(a);

					var d=parts.edges[0].domain;

					if (dim.path!==undefined){
						//EACH TERM RETURNED IS A PATH INTO A PARTITION TREE
						var temp={"partitions":[]};
						parts.cube.forall(function(count, i){
							var a=dim.path(d.end(d.partitions[i]));
							if (!(a instanceof Array)) D.error("The path function on "+dim.name+" must return an ARRAY of parts");
							addParts(
								temp,
								dim.path(d.end(d.partitions[i])),
								count,
								0
							);
						});
						if (dim.value===undefined) dim.value="name";
						dim.partitions=temp.partitions;
					}else{
						dim.value="name";  //USE THE "name" ATTRIBUTE OF PARTS

						//SIMPLE LIST OF PARTS RETURNED, BE SURE TO INTERRELATE THEM
						dim.partitions=parts.cube.map(function(count, i){
							return {
								"name":""+d.partitions[i].name,  //CONVERT TO STRING
								"value":d.end(d.partitions[i]),
								"esfilter":{"term":Map.newInstance(dim.field, d.partitions[i].value)},
								"count":count
							};
						});
					}//endif

					convertPart(dim);//RELATE THE PARTS TO THE PARENTS

					yield (null)
				});

			}//endif


//			dim.isFacet=true;		//FORCE TO BE A FACET IN ES QUERIES
			if (dim.type===undefined) dim.type="set";

			//ADD CONVENIENCE METHODS
			Map.copy(Dimension.prototype, dim);
		}

		// CODE STARTS HERE
		edges.forall(function(e, i){
			convertDim(e);
			parentDim[e.name]=e;
			e.parent=parentDim;

			parentDim.edges.push(e);
		});

	};



})();