

var Colour=function(r, g, b){
	this.r=Math.pow(r/255, Colour.BASE);
	this.g=Math.pow(g/255, Colour.BASE);
	this.b=Math.pow(b/255, Colour.BASE);
};


Colour.intensity=function(scale){
	var output=new Colour(
		Math.max(1.0, scale*r),
		Math.max(1.0, scale*g),
		Math.max(1.0, scale*b)
	);

	return output;
};//method


//KEEP INTENSITY, SACRIFICE SATURATION
Colour.addHue=function(degrees){
	var hsi=this.toHSI();
	hsi.h+=degrees;
	var output=Colour.fromHSI(hsi);
};//method

Colour.prototype.toHSI=function(){

	var min = Math.min( this.r, this.g, this.b );
	var max = Math.max( this.r, this.g, this.b );
	var delta = max - min;

	if( max == 0 ) return {"h":0, "s":0, "i":0}; //BLACK

	var s = delta / max;		// s

	var h=0;
	if( this.r == max) h = ( g - b ) / delta;		// between yellow & magenta
	else if( this.g == max) h = 2 + ( b - r ) / delta;	// between cyan & yellow
	else h = 4 + ( r - g ) / delta;	// between magenta & cyan
	h=((h+6)%6)*60;

	var I=0.3*this.r+0.59*this.g+0.11*this.b;

	return {"h":h, "s": s, "i":I};
};//method


Colour.fromHSI=function(hsi){

}//method







Colour.toHex=function(){
	var r=Colour.logRound(Math.pow(this.r, 0.4545454545)*255);
	var g=Colour.logRound(Math.pow(this.g, 0.4545454545)*255);
	var b=Colour.logRound(Math.pow(this.b, 0.4545454545)*255);

	return CNV.int2hex(r, 2)+ CNV.int2hex(g, 2)+ CNV.int2hex(b, 2);
};//method

Colour.BASE=2.2;
Colour.ROUNDING_FACTOR=Math.log((1+Colour.BASE)/2)/Math.log(Colour.BASE);

Colour.logRound=function(value){
	return Math.floor(value+1-Colour.ROUNDING_FACTOR);
};//method



}