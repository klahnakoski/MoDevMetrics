var Colour = function(r, g, b){
	this.r = Math.pow(r / 255, Colour.BASE);
	this.g = Math.pow(g / 255, Colour.BASE);
	this.b = Math.pow(b / 255, Colour.BASE);
};


Colour.intensity = function(scale){
	var output = new Colour(
		Math.max(1.0, scale * r),
		Math.max(1.0, scale * g),
		Math.max(1.0, scale * b)
	);

	return output;
};//method


//KEEP INTENSITY, SACRIFICE SATURATION
Colour.prototype.addHue = function(degrees){
	var hsi = this.toHSI();
	hsi.h += degrees;
	var output = Colour.fromHSI(hsi);
};//method


Colour.prototype.addSaturation = function(saturation){
	var hsi = this.toHSI();
	hsi.s = Math.min(Math.max(hsi.s + saturation, 0.0), 1.0);
	return Colour.fromHSI(hsi);
};//method


Colour.prototype.toHSI = function(){
	return rgb2hsl(this.r, this.g, this.b);
//	var min = Math.min( this.r, this.g, this.b );
//	var max = Math.max( this.r, this.g, this.b );
//	var delta = max - min;
//
//	if( max == 0 ) return {"h":0, "s":0, "i":0}; //BLACK
//
//	var s = delta / max;		// s
//
//	var h=0;
//	if( this.r == max) h = ( g - b ) / delta;		// between yellow & magenta
//	else if( this.g == max) h = 2 + ( b - r ) / delta;	// between cyan & yellow
//	else h = 4 + ( r - g ) / delta;	// between magenta & cyan
//	h=((h+6)%6)*60;
//
//	var I=0.3*this.r+0.59*this.g+0.11*this.b;
//
//	return {"h":h, "s": s, "i":I};
};//method


Colour.fromHSI = function(hsi){
	return hsl2rgb(hsi.h, hsi.s, hsi.i);
};//method


Colour.prototype.toHex = function(){
	var r = Colour.logRound(Math.pow(this.r, 0.4545454545) * 255);
	var g = Colour.logRound(Math.pow(this.g, 0.4545454545) * 255);
	var b = Colour.logRound(Math.pow(this.b, 0.4545454545) * 255);

	return CNV.int2hex(r, 2) + CNV.int2hex(g, 2) + CNV.int2hex(b, 2);
};//method

Colour.BASE = 2.2;
Colour.ROUNDING_FACTOR = Math.log((1 + Colour.BASE) / 2) / Math.log(Colour.BASE);

Colour.logRound = function(value){
	return Math.floor(value + 1 - Colour.ROUNDING_FACTOR);
};//method



// MODIFIED SLIGHTLY FROM http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
function rgb2hsl(r, g, b){
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, i = (max + min) / 2;

	if (max == min){
		h = s = 0; // achromatic
	} else{
		var d = max - min;
		s = i > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max){
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return {"h":h * 360, "s":s, "i":i};
}

// MODIFIED SLIGHTLY FROM  http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
function hsl2rgb(h, s, l){
	h = h / 360;
	var r, g, b;

	if (s == 0){
		r = g = b = l; // achromatic
	} else{
		function hue2rgb(p, q, t){
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	var output = new Colour(0, 0, 0);
	output.r = r;
	output.g = g;
	output.b = b;
	return output;
}


