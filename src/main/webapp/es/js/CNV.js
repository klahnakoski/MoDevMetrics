/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var CNV = function(){
};


//
//PULL THE BUGS OUT OF THE E:LASTIC SEARCH RESULT OBJECT
//
CNV.ESResult2List = function(esResult){
	var output = [];
	for(var x = 0; x < esResult.hits.hits.length; x++){
		output.push(esResult.hits.hits[x]._source);
	}//for
	return output;
};//method


//MVEL.esFacet2List = function(esFacet){
//	if (esFacet._type == "terms_stats") return esFacet.terms;
//
//	if (!(esFacet.terms === undefined)){
//		//ASSUME THE .term IS JSON OBJECT WITH ARRAY OF RESULT OBJECTS
//		var output = [];
//		var list = esFacet.terms;
//		for(var i = 0; i < list.length; i++){
//			var esRow = list[i];
//			var values = CNV.JSON2Object(esRow.term);
//			for(var v = 0; v < (values).length; v++){
//				values[v].count = esRow.count;
//				output.push(values[v]);
//			}//for
//		}//for
//		return output;
//	} else if (!(esFacet.entries === undefined)){
//		return esFacet.entries;
//	}//endif
//
//};//method







CNV.ESResult2HTMLSummaries = function(esResult){
	var output = "";

	if (esResult["facets"] === undefined) return output;

	var keys = Object.keys(esResult.facets);
	for(var x = 0; x < keys.length; x++){
		output += CNV.ESResult2HTMLSummary(esResult, keys[x]);
	}//for
	return output;
};//method


CNV.ESResult2HTMLSummary = function(esResult, name){
	var output = "";
	output += "<h3>" + name + "</h3>";
	output += CNV.List2HTMLTable(esResult.facets[name].terms);
	return output;
};//method


CNV.JSON2Object = function(json){
	return JSON.parse(json);
};//method



CNV.Object2JSON = function(json){
//	return JSON.stringify(json);
	if (json instanceof Array){
		let singleLine=JSON.stringify(json);
		if (singleLine.length<60) return singleLine;

		if (json.length==0) return "[]";
		if (json.length==1) return "["+CNV.Object2JSON(json[0])+"]";

		return "[\n"+json.map(function(v, i){
			if (v===undefined) return "undefined";
			return CNV.Object2JSON(v).indent(1);
		}).join(",\n")+"\n]";
	}else if (json instanceof Object){
		let singleLine=JSON.stringify(json);
		if (singleLine.length<60) return singleLine;

		var keys=Object.keys(json);
		if (keys.length==0) return "{}";
		if (keys.length==1) return "{\""+keys[0]+"\":"+CNV.Object2JSON(json[keys[0]]).trim()+"}";

		return "{\n\t"+mapAllKey(json, function(k, v){
			if (v===undefined) return "";
			return "\""+k+"\":"+CNV.Object2JSON(v).indent(1).trim();
		}).join(",\n\t")+"\n}";
	}else if (json instanceof Date){
		return json.format("yyyy-NNN-dd HH:mm:ss");
//TOO BAD: CAN NOT PROVIDE FORMATTED STRINGS
//	}else if (typeof(json)=="string"){
//		var output=JSON.stringify(json);
//		if (json.length>40 && json.indexOf("\n")>=0){
//			return "\n\t"+output.split("\\n").join("\\n\"+\n\t\"");
//		}else{
//			return output;
//		}//endif
	}else{
		return JSON.stringify(json);
	}//endif
};//method


CNV.String2HTML = function(value){
	value=value.replaceAll("\n", "<br>").replaceAll("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
	return value;
};//method


CNV.String2Quote = function(str){
	return "\"" + (str + '').replaceAll("\n", "\\n").replace(/([\n\\"'])/g, "\\$1").replace(/\0/g, "\\0") + "\"";
};//method

CNV.Value2Quote=function(value){
	if (value === undefined){
		return "";
	} else if (value == null){
		return "null";
	} else if (aMath.isNumeric(value)){
		if ((""+value).length==13){
			//PROBABLY A TIMESTAMP
			value=new Date(value);
			if (value.floorDay().getMilli()==value.getMilli()){
				return value.format("yyyy/MM/dd");
			}else{
				return value.format("yyyy/MM/dd HH:mm:ss");
			}//endif
		}else{
			return ""+value;
		}
	} else if (value.milli){
		//DURATION
		return "\""+value.toString()+"\"";
	} else if (value.getTime){
		if (value.floorDay().getMilli()==value.getMilli()){
			return value.format("yyyy/MM/dd");
		}else{
			return value.format("yyyy/MM/dd HH:mm:ss");
		}//endif
	}//endif

	var json = CNV.Object2JSON(value);
	return CNV.String2Quote(json);
};//method


CNV.String2Integer = function(value){
	return value - 0;
};//method


CNV.Pipe2Value=function(value){
	var type=value.charAt(0);
	if (type=='0') return null;
	if (type=='n') return CNV.String2Integer(value.substring(1));
	if (type!='s') D.error("unknown pipe type");

	//EXPECTING MOST STRINGS TO NOT HAVE ESCAPED CHARS
	var s=value.indexOf("\\", 1);
	if (s>0){
		var result="";
		var e=1;
		while(true){
			var c=value.charAt(s+1);
			if (c=='p'){
				result=result+value.substring(e, s)+'|';
				s+=2;
				e=s;
			}else if (c=='\\'){
				result=result+value.substring(e, s)+'\\';
				s+=2;
				e=s;
			}else{
				s++;
			}//endif
			s=value.indexOf("\\", s);
			if (s<0) break;
		}//while
		return result+value.substring(e);
	}//endif
	return value.substring(1);	//EXIT EARLY ON MOST LIKELY CASE
};//method
CNV.Pipe2Value.pipe = new RegExp("\\\\p", "g");
CNV.Pipe2Value.bs = new RegExp("\\\\\\\\", "g");


CNV.Cube2HTMLTable=function(query){

	//WRITE HEADER

	var header = "";
	if (query.name) header+=HTML.tag("h2", query.name);
	var content = "";

	if (query.edges.length==1){
		header += "<td>" + CNV.String2HTML(query.edges[0].name) + "</td>";

		if (query.select instanceof Array){
			header+=query.select.map(function(s, i){
				return HTML.tag("td", s.name);
			}).join("");

			content=query.edges[0].domain.partitions.map(function(v, i){
				return "<tr>"+
					HTML.tag("th", v.name)+
					query.select.map(function(s, j){
						return HTML.tag("td", query.cube[i][s.name])
					}).join("")+
					"</tr>";
			}).join("\n");
		}else{
			header += HTML.tag("th", query.select.name);

			content=query.edges[0].domain.partitions.map(function(p, i){
				return "<tr>"+HTML.tag("th", p.name)+HTML.tag("td", query.cube[i])+"</tr>";
			}).join("\n");
		}//endif
	}else if (query.edges.length==2){
		if (query.select instanceof Array){
			D.error("Can not display cube: select clause can not be array, or there can be only one edge");
		}else{

			header+=HTML.tag("td", query.edges[1].name);	//COLUMN FOR SECOND EDGE
			query.edges[0].domain.partitions.forall(function(v, i){
				header += "<td>" + CNV.String2HTML(v.name) + "</td>";
			});

			content="";
			for (var r=0;r<query.edges[1].domain.partitions.length;r++){
				content+="<tr>"+HTML.tag("th", query.edges[1].domain.partitions[r].name);
				for(var c=0;c<query.cube.length;c++){
					content+=HTML.tag("td", query.cube[c][r]);
				}//for
				content+="</tr>";
			}//for
			if (query.edges[1].allowNulls){
				content+="<tr>"+HTML.tag("th", query.edges[1].domain.NULL.name);
				for(var c=0;c<query.cube.length;c++){
					content+=HTML.tag("td", query.cube[c][r]);
				}//for
				content+="</tr>";
			}//endif



			//SHOW FIRST EDGE AS ROWS, SECOND AS COLUMNS
//			header+=HTML.tag(query.edges[0].name);	//COLUMN FOR FIRST EDGE
//			query.edges[1].domain.partitions.forall(function(v, i){
//				header += "<td>" + CNV.String2HTML(v.name) + "</td>";
//			});
//
//			content=query.cube.map(function(r, i){
//				return "<tr>"+
//					HTML.tag(query.edges[0].domain.partitions[i].name, "th")+
//					r.map(function(c, j){
//						return HTML.tag(c);
//					}).join("")+
//					"</tr>";
//			}).join("");
		}//endif
	}else{
		D.error("Actual cubes not supported !!")
	}//endif

	return "<table class='table'>" +
		"<thead>" + header + "</thead>\n" +
		"<tbody>" + content + "</tbody>" +
		"</table>"
		;


};//method



CNV.List2HTMLTable = function(data, options){
	if (data.list && data.columns){
		//CONVERT FROM QUERY TO EXPECTED FORM
		options=data;
		data=data.list;
	}//endif


	if (data.length==0){
		return "<table class='table'><tbody><tr><td>no records to show</td></tr></tbody></table>";
	}//endif

	//WRITE HEADER
	var header = "";
	var columns;
	if (options && options.columns){
		columns=options.columns;
	}else{
		columns= CUBE.getColumnsFromList(data);
	}//endif
	columns.forall(function(v, i){
		header += HTML.tag("td", v.name);
	});
	header = "<thead><tr>" + header + "</tr></thead>";


	var output = "";
	var numRows=data.length;
	if (options!==undefined && options.limit!==undefined && numRows>options.limit) numRows=options.limit;
	//WRITE DATA
	for(var i = 0; i < data.length; i++){
		var row = "";
		for(var c = 0; c < columns.length; c++){
			var value = data[i][columns[c].name];
			row += HTML.tag("td", value);
		}//for
		output += "<tr>" + row + "</tr>\n";
	}//for

	return "<table class='table'>" +
		"<thead>" + header + "</thead>\n" +
		"<tbody>" + output + "</tbody>" +
		"</table>"
		;
};//method


var HTML={};
HTML.tag=function(tagName, value){
	if (tagName===undefined) tagName="td";

	if (value === undefined){
//		return "<"+tagName+">&lt;undefined&gt;</"+tagName+">";
		return "<"+tagName+"></"+tagName+">";
	} else if (value == null){
//		return "<"+tagName+">&lt;null&gt;</"+tagName+">";
		return "<"+tagName+"></"+tagName+">";
	} else if (typeof(value)=="string"){
		return "<"+tagName+">" + CNV.String2HTML(value) + "</"+tagName+">";
	} else if (aMath.isNumeric(value)){
		if ((""+value).length==13){
			//PROBABLY A TIMESTAMP
			value=new Date(value);
			if (value.floorDay().getMilli()==value.getMilli()){
				return "<"+tagName+">" + new Date(value).format("yyyy-NNN-dd") + "</"+tagName+">";
			}else{
				return "<"+tagName+">" + new Date(value).format("yyyy-NNN-dd HH:mm:ss") + "</"+tagName+">";
			}//endif
		}else{
			return "<"+tagName+" style='text-align:right;'>" + value + "</"+tagName+">";
		}
	} else if (value.milli){
		//DURATION
		return "<"+tagName+">" + value.toString() + "</"+tagName+">";
	} else if (value.getTime){
		if (value.floorDay().getMilli()==value.getMilli()){
			return "<"+tagName+">" + new Date(value).format("yyyy-NNN-dd") + "</"+tagName+">";
		}else{
			return "<"+tagName+">" + new Date(value).format("yyyy-NNN-dd HH:mm:ss") + "</"+tagName+">";
		}//endif
//	} else if (value.toString !== undefined){
//		return "<"+tagName+">" + CNV.String2HTML(value.toString()) + "</"+tagName+">";
	}//endif

	var json = CNV.Object2JSON(value);
//	if (json.indexOf("\n") == -1){
		return "<"+tagName+">" + CNV.String2HTML(json) + "</"+tagName+">";
//	} else{
//		return "<"+tagName+">&lt;json not included&gt;</"+tagName+">";
//	}//endif
};




///////////////////////////////////////////////////////////////////////////////
// CONVERT TO TAB DELIMITED TABLE
///////////////////////////////////////////////////////////////////////////////
CNV.List2Tab = function(data){
	var output = "";

	//WRITE HEADER
	var columns = CUBE.getColumnsFromList(data);
	for(var c = 0; c < columns.length; c++) output += CNV.String2Quote(columns[c].name) + "\t";
	output = output.substring(0, output.length - 1) + "\n";

	//WRITE DATA
	for(var i = 0; i < data.length; i++){
		for(var c = 0; c < columns.length; c++){
			output += CNV.Value2Quote(data[i][columns[c].name]) + "\t";
		}//for
		output = output.substring(0, output.length - 1) + "\n";
	}//for
	output = output.substring(0, output.length - 1);

	return output;
};//method


///////////////////////////////////////////////////////////////////////////////
// CONVERT TO TAB DELIMITED TABLE
///////////////////////////////////////////////////////////////////////////////
CNV.Table2List = function(table){
	var output = [];

	//MAP LIST OF NAMES TO LIST OF COLUMN OBJCETS
	if (table.columns[0].substr !== undefined){
		for(var i = 0; i < table.columns.length; i++){
			table.columns[i] = {"name":table.columns[i]};
		}//for
	}//endif


	for(var d = 0; d < table.rows.length; d++){
		var item = {};
		var row = table.rows[d];
		for(var c = 0; c < table.columns.length; c++){
			item[table.columns[c].name] = row[c];
		}//for
		output.push(item);
	}//for
	return output;
};//method


CNV.List2Table = function(list, columnOrder){
	var columns = CUBE.getColumnsFromList(list);
	if (columnOrder !== undefined){
		var newOrder = [];
		OO: for(var o = 0; o < columnOrder.length; o++){
			for(var c = 0; c < columns.length; c++){
				if (columns[c].name == columnOrder[o]){
					newOrder.push(columns[c]);
					continue OO;
				}//endif
			}//for
			D.error("Can not find column by name of '" + columnOrder[o] + "'");
		}//for

		CC: for(var c = 0; c < columns.length; c++){
			for(var o = 0; o < columnOrder.length; o++){
				if (columns[c].name == columnOrder[o]) continue CC;
			}//for
			newOrder.push(columns[c]);
		}//for

		columns = newOrder;
	}//endif

	var data = [];
	for(var i = 0; i < list.length; i++){
		var item = list[i];
		var row = [];
		for(var c = 0; c < columns.length; c++){
			row[c] = Util.coalesce(item[columns[c].name], null);
		}//for
		data.push(row);
	}//for
	return {"columns":columns, "data":data};
};//method


CNV.int2hex = function(value, numDigits){
	return ("0000000" + value.toString(16)).right(numDigits);
};//method

CNV.hex2int = function(value){
	return parseInt(value, 16);
};//method

CNV.String2JQuery=function(str){
	var output=str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
//	output=output.replaceAll(" ", "\\ ");
	return output;
};//method
