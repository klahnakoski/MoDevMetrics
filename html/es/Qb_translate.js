/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TRANSLATOR FOR QUERIES Qb->ES
//   AS A STANDALONE FUNCTION
//     Adapted from MoDevMetrics

importScript("js/main.js");

function esTranslate ( qbQuery ) { //GENERATOR
    //EVAL THE qbQuery
    if (qbQuery.trim().left(1) != "{") {
        qbQuery = "{" + qbQuery;
    }
        
    if (qbQuery.trim().right(1) != "}") {
        qbQuery = qbQuery + "}";
    }
    
    var backupCode = qbQuery;
    var cubeQuery;
    
    try{
        //USE JSONLINT TO FORMAT AND TEST-COMPILE THE code
        qbQuery = jsl.format.formatJson(qbQuery);
        qbQuery = jsl.parser.parse(qbQuery);
	    yield(ESQuery.loadColumns(qbQuery));
        cubeQuery = new ESQuery(qbQuery);
        yield CNV.Object2JSON(cubeQuery.esQuery) ;
    
    } catch(e) {
        Log.error("Qb query is wrong", e);
    } //try

    yield ("");
}
    


