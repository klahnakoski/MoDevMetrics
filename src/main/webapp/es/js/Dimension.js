/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("aLibrary.js");
importScript("ESQuery.js");


var Dimension={};

Dimension.prototype={
	"getDomain":function(){
		var output=Map.copy(this);
		output.field=undefined;
		output.parent=undefined;
		output["default"]=undefined;
		output.index=undefined;
		return Map.copy(output);
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

			if (dim.limit===undefined) dim.limit=20;

			if (dim.field!==undefined && dim.type=="set" && dim.allParts===undefined){
				dim.partitions=aThread.run(function(){
					//IF dim.field IS A NUMBER, THEN SET-WISE EDGES DO NOT WORK (CLASS CAST EXCEPTION)
					if (dim.field=="info.appBuildID"){
						D.warning("Special case for info.appBuildID, please fix Telemetry schema");
						edge={"name":dim.field, "value":"\"\"+"+dim.field};
					}else{
						edge={"name":dim.field, "value":dim.field};
					}//endif


					var parts=yield (ESQuery.run({
						"from":dim.index,
						"select":{"name":"count", "value":dim.field, "aggregate":"count"},
						"edges":[edge],
						"limit":dim.limit
					}));

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
						dim.partitions=temp.partitions;
					}else{
						//SIMPLE LIST OF PARTS RETURNED, BE SURE TO INTERRELATE THEM
						dim.partitions=parts.cube.map(function(count, i){
							return {
								"name":d.partitions[i].name,
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