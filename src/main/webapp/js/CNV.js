
var CNV=function(){};


//
//PULL THE BUGS OUT OF THE E:LASTIC SEARCH RESULT OBJECT
//
CNV.ESResult2List=function(esResult){
    var output=[];
    for(var x in esResult.hits.hits){
	    output.push(esResult.hits.hits[x]._source);
    }//for
    return output;
};//method


CNV.ESFacet2List=function(esFacet){
	if (esFacet._type=="terms_stats") return esFacet.terms;

	if (!(esFacet.terms===undefined)){
		//ASSUME THE .term IS JSON OBJECT WITH ARRAY OF RESULT OBJECTS
		var output=[];
		var list=esFacet.terms;
		for(var i in list){
			var esRow=list[i];
			var values=CNV.JSON2Object(esRow.term);
			for (v in values){
				values[v].count=esRow.count;
				output.push(values[v]);
			}//for
		}//for
		return output;
	}else if (!(esFacet.entries===undefined)){
		return esFacet.entries;
	}//endif

};//method


CNV.ESResult2HTMLSummaries=function(esResult){
    var output="";

    if (esResult["facets"]===undefined) return output;

    var keys=Object.keys(esResult.facets);
    for(var x in keys){
        output+=CNV.ESResult2HTMLSummary(esResult, keys[x]);
    }//for
    return output;
};//method


CNV.ESResult2HTMLSummary=function(esResult, name){
    var output="";
    output+="<h1>"+name+"</h1>";
    output+=CNV.List2HTMLTable(esResult.facets[name].terms);
    return output;
};//method



CNV.JSON2Object=function(json){
	return JSON.parse(json);
};//method

CNV.Object2JSON=function(json){
    return JSON.stringify(json, null, "  ");
};//method



CNV.String2HTML=function(value){
    return value;
};//method


CNV.String2Quote=function(str){
	return "\""+(str+'').replace(/([\\"'])/g, "\\$1").replace(/\0/g, "\\0")+"\"";
};//method


CNV.String2Integer=function(value){
	return value-0;
};//method



CNV.List2HTMLTable=function(data){

    //WRITE HEADER
    var header="";
    var columns=SQL.getColumns(data);
    for(var c in columns) header+="<td>"+CNV.String2HTML(CNV.Object2JSON(columns[c].name))+"</td>";
    header="<tr>"+header+"</tr>";



    var output="";
    //WRITE DATA
    for(var i in data){
        var row="";
        for(var c in columns) {
			var value=data[i][columns[c].name];

			if (value===undefined){
				row += "<td>&lt;undefined&gt;</td>";
			}else if (value==null){
				row += "<td>&lt;null&gt;</td>";
			}else if (Math.isNumeric(value)){
				row += "<td>" + value + "</td>";
			}else if (value.toString!==undefined){
				row += "<td>" +  CNV.String2HTML(value.toString()) + "</td>";
			}else{
				var json=CNV.Object2JSON(value);
				if (json.indexOf("\n") == -1) {
					row += "<td>" + CNV.String2HTML(json) + "</td>";
				} else {
					row += "<td>&lt;json not included&gt;</td>";
				}//endif
			}//endif

        }//for
        output+="<tr>"+row+"</tr>\n";
    }//for

    return "<table>"+
            "<thead>"+header+"</thead>\n"+
            "<tbody>"+output+"</tbody>"+
        "</table>"
        ;
};//method



///////////////////////////////////////////////////////////////////////////////
// CONVERT TO TAB DELIMITED TABLE
///////////////////////////////////////////////////////////////////////////////
CNV.List2Tab=function(data){
    var output="";

    //WRITE HEADER
    var columns=CNV.getColumnNames(data);
    for(var c in columns) output+=CNV.String2Quote(columns[c].name)+"\t";
    output=output.substring(0, output.length-1)+"\n";

    //WRITE DATA
    for(var i in data){
        for(var c in columns){
            output+=CVN.String2Quote(data[i][columns[c].name])+"\t";
        }//for
        output=output.substring(0, output.length-1)+"\n";
    }//for
    output=output.substring(0, output.length-1);

    return output;
};//method


///////////////////////////////////////////////////////////////////////////////
// CONVERT TO TAB DELIMITED TABLE
///////////////////////////////////////////////////////////////////////////////
CNV.Table2List=function(table){
	var output=[];

	//MAP LIST OF NAMES TO LIST OF COLUMN OBJCETS
	if (table.columns[0].substr!==undefined){
		for(var i in table.columns){
			table.columns[i]={"name":table.columns[i]};
		}//for
	}//endif


	for(var d in table.data){
		var item={};
		var row=table.data[d];
		for(var c in table.columns){
			item[table.columns[c].name]=row[c];
		}//for
		output.push(item);
	}//for
	return output;
};//method



CNV.List2Table=function(list, columnOrder){
	var columns=SQL.getColumns(list);
	if (columnOrder!==undefined){
		var newOrder=[];
		OO: for(var o in columnOrder){
			for(var c in columns){
			if (columns[c].name==columnOrder[o]){
				newOrder.push(columns[c]);
				continue OO;
			}//endif
			}//for
			D.error("Can not find column by name of '"+columnOrder[o]+"'");
		}//for

 		CC: for(var c in columns){
			for(var o in columnOrder){
				if (columns[c].name==columnOrder[o]) continue CC;
			}//for
			newOrder.push(columns[c]);
		}//for

		columns=newOrder;
	}//endif

	var data=[];
	for(var i in list){
		var item=list[i];
		var row=[];
		for(var c in columns){
			row[c]=Util.coalesce(item[columns[c].name], null);
		}//for
		data.push(row);
	}//for
	return {"columns":columns, "data":data};
};//method


CNV.int2hex=function(value, numDigits){
	return ("0000000"+value.toString(16)).right(numDigits);
};//method

CNV.hex2int=function(value){
	return parseInt(value, 16);
};//method