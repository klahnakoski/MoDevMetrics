


var CountPendingReviewers = function(data){
    var output=[];
    for(b=0; b<data.hits.hits.length; b++){
        var bug=data.hits.hits[b]._source;
        for (a=0;a<bug.attachments.length;a++){
            var attachment=bug.attachments[a];
            for(f=0;f<attachment.flags.length;f++){
                var flag=attachment.flags[f];
                if (flag.request_type=="review" && flag.request_status=="?"){
                       output.push({
                           "bug_id" : bug.bug_id,
                           "attachments.isobsolete" : attachment["attachments.isobsolete"],
                           "attachments.flags.request_type" : flag.request_type,
                           "attachments.flags.request_status" : flag.request_status,
                           "attachments.flags.requestee" : flag.requestee
                       });
                }//endif
            }//for
        }//for
	}//for

    return output;
}//method

