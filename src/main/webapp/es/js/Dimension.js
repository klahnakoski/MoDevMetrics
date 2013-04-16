/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("aLibrary.js");
importScript("ESQuery.js");


var Dimension={};


(function(){

	Dimension.addEdges=function(lowerCaseOnly, parentDim, edges){
		function convertPart(part){
			if (part.partitions){
				part.partitions.forall(function(p,i){
					convertPart(p);
					p.value=p.name;
					p.parent=part;
				});
			}//endif

			if (part.esfilter){
				if (lowerCaseOnly) part.esfilter=CNV.JSON2Object(CNV.Object2JSON(part.esfilter).toLowerCase());
			}else{
				if (part.partitions){
					part.esfilter={"or":[]};
					part.partitions.forall(function(p,i){
						part.esfilter.or.push(p.esfilter);
						p.parent=part;
					});
				}//endif
			}//endif
		}



		function convertDim(dim){
			if (dim.edges){
				//ALLOW ACCESS TO EDGE BY NAME
				dim.edges.forall(function(e, i){
					dim[e.name]=e;
					e.parent=dim;
					if (dim.index) e.index=dim.index;   //COPY INDEX DOWN
					convertDim(e);
				});
			}//endif

			if (dim.partitions){
				dim.partitions.forall(function(v, i){
					dim[v.name]=v;
					v.parent=dim;
				});
			}//endif

			convertPart(dim);

			if (dim.limit===undefined) dim.limit=20;

			if (dim.field!==undefined && dim.type=="set" && dim.parts===undefined){
				aThread.run(function(){
					var parts=yield (ESQuery.run({
						"from":dim.index,
						"select":{"name":"count", "value":dim.field, "operation":"count"},
						"edges":[dim.field],
						"limit":dim.limit
					}));

					dim.partitions=parts.cube.map(function(v, i){
						return {
							"name":parts.edges[0].domain.partitions[i],
							"esfilter":{"term":Map.newInstance(dim.field, parts.edges[0].domain.partitions[i])},
							"count":v
						};
					});

					dim.partitions.forall(function(v, i){
						dim[v.name]=v;
						v.parent=dim;
						convertPart(v);
					});

				});

			}//endif


			dim.isFacet=true;		//FORCE TO BE A FACET IN ES QUERIES
			if (dim.type===undefined) dim.type="set";
			dim.value="name";
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