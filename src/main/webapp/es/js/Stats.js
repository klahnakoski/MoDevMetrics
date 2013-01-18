


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


Stats={};

//GIVEN A STEPWISE df, RETURN THE STEP WHICH APPROXIMATES THE percentile
Stats.percentile=function(df, percentile){
	var df=Stats.normalize(df);

	var total=0;
	for(var i=0;i<df.length;i++) {
		total+=df[i];
		if (total>=percentile){
			var part=(percentile-total)/df[i];
			return part+i+1;
		}//endif
	}//for
	return df.length;		//HAPPENS WHEN df[i]==0
};//method

//NORMALIZE TO A DISTRIBUTION FUNCTION
Stats.normalize=function(df){
	var total=0;
	for(var t=df.length;t--;) total+=Math.abs(df[t]);
	if (total==0 || (1-epsilon)<total && total<(1+epsilon)) return df;

	var output=[];
	for(var i=df.length;i--;) output[i]=df[i]/total;
	return output;
};//method

epsilon=1/1000000;