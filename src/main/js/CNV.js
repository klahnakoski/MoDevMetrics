
var CNV=function(){};


//
//PULL THE BUGS OUT OF THE E:LASTIC SEARCH RESULT OBJECT
//
CNV.ESResult2List=function(esResult){
    var output=[];
    for(x in esResult.hits.hits){
	    output.push(esResult.hits.hits[x]._source);
    }//for
    return output;
};//method


CNV.ESFacet2List=function(esFacet){

	if (!(esFacet.terms===undefined)){
		var output=[];
		var list=esFacet.terms;
		for(i in list){
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
    for(x in keys){
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






CNV.List2HTMLTable=function(data){

    //WRITE HEADER
    var header="";
    var columns=SQL.getColumns(data);
    for(c in columns) header+="<td>"+CNV.String2HTML(CNV.Object2JSON(columns[c].name))+"</td>";
    header="<tr>"+header+"</tr>";



    var output="";
    //WRITE DATA
    for(i in data){
        var row="";
        for(c in columns) {
            var json=CNV.Object2JSON(data[i][columns[c].name]);
            if (json===undefined){
                row += "<td>&lt;undefined&gt;</td>";
            }else if (json.indexOf("\n") == -1) {
                row += "<td>" + CNV.String2HTML(json) + "</td>";
            } else {
                row += "<td>&lt;json not included&gt;</td>";
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
    for(c in columns) output+=CNV.String2Quote(columns[c].name)+"\t";
    output=output.substring(0, output.length-1)+"\n";

    //WRITE DATA
    for(i in data){
        for(c in columns){
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
		for(i in table.columns){
			table.columns[i]={"name":table.columns[i]};
		}//for
	}//endif


	for(d in table.data){
		var item={};
		var row=table.data[d];
		for(c in table.columns){
			item[table.columns[c].name]=row[c];
		}//for
		output.push(item);
	}//for
	return output;
};
