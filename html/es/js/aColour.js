/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


//http://en.wikipedia.org/wiki/Luminance_%28relative%29  Y = 0.2126 R + 0.7152 G + 0.0722 B

importScript("CNV.js");


var colors={
	aliceblue: "#f0f8ff",
	antiquewhite: "#faebd7",
	aqua: "#00ffff",
	aquamarine: "#7fffd4",
	azure: "#f0ffff",
	beige: "#f5f5dc",
	bisque: "#ffe4c4",
	black: "#000000",
	blanchedalmond: "#ffebcd",
	blue: "#0000ff",
	blueviolet: "#8a2be2",
	brown: "#a52a2a",
	burlywood: "#deb887",
	cadetblue: "#5f9ea0",
	chartreuse: "#7fff00",
	chocolate: "#d2691e",
	coral: "#ff7f50",
	cornflowerblue: "#6495ed",
	cornsilk: "#fff8dc",
	crimson: "#dc143c",
	cyan: "#00ffff",
	darkblue: "#00008b",
	darkcyan: "#008b8b",
	darkgoldenrod: "#b8860b",
	darkgray: "#a9a9a9",
	darkgreen: "#006400",
	darkgrey: "#a9a9a9",
	darkkhaki: "#bdb76b",
	darkmagenta: "#8b008b",
	darkolivegreen: "#556b2f",
	darkorange: "#ff8c00",
	darkorchid: "#9932cc",
	darkred: "#8b0000",
	darksalmon: "#e9967a",
	darkseagreen: "#8fbc8f",
	darkslateblue: "#483d8b",
	darkslategray: "#2f4f4f",
	darkslategrey: "#2f4f4f",
	darkturquoise: "#00ced1",
	darkviolet: "#9400d3",
	deeppink: "#ff1493",
	deepskyblue: "#00bfff",
	dimgray: "#696969",
	dimgrey: "#696969",
	dodgerblue: "#1e90ff",
	firebrick: "#b22222",
	floralwhite: "#fffaf0",
	forestgreen: "#228b22",
	fuchsia: "#ff00ff",
	gainsboro: "#dcdcdc",
	ghostwhite: "#f8f8ff",
	gold: "#ffd700",
	goldenrod: "#daa520",
	gray: "#808080",
	green: "#008000",
	greenyellow: "#adff2f",
	grey: "#808080",
	honeydew: "#f0fff0",
	hotpink: "#ff69b4",
	indianred: "#cd5c5c",
	indigo: "#4b0082",
	ivory: "#fffff0",
	khaki: "#f0e68c",
	lavender: "#e6e6fa",
	lavenderblush: "#fff0f5",
	lawngreen: "#7cfc00",
	lemonchiffon: "#fffacd",
	lightblue: "#add8e6",
	lightcoral: "#f08080",
	lightcyan: "#e0ffff",
	lightgoldenrodyellow: "#fafad2",
	lightgray: "#d3d3d3",
	lightgreen: "#90ee90",
	lightgrey: "#d3d3d3",
	lightpink: "#ffb6c1",
	lightsalmon: "#ffa07a",
	lightseagreen: "#20b2aa",
	lightskyblue: "#87cefa",
	lightslategray: "#778899",
	lightslategrey: "#778899",
	lightsteelblue: "#b0c4de",
	lightyellow: "#ffffe0",
	lime: "#00ff00",
	limegreen: "#32cd32",
	linen: "#faf0e6",
	magenta: "#ff00ff",
	maroon: "#800000",
	mediumaquamarine: "#66cdaa",
	mediumblue: "#0000cd",
	mediumorchid: "#ba55d3",
	mediumpurple: "#9370db",
	mediumseagreen: "#3cb371",
	mediumslateblue: "#7b68ee",
	mediumspringgreen: "#00fa9a",
	mediumturquoise: "#48d1cc",
	mediumvioletred: "#c71585",
	midnightblue: "#191970",
	mintcream: "#f5fffa",
	mistyrose: "#ffe4e1",
	moccasin: "#ffe4b5",
	navajowhite: "#ffdead",
	navy: "#000080",
	oldlace: "#fdf5e6",
	olive: "#808000",
	olivedrab: "#6b8e23",
	orange: "#ffa500",
	orangered: "#ff4500",
	orchid: "#da70d6",
	palegoldenrod: "#eee8aa",
	palegreen: "#98fb98",
	paleturquoise: "#afeeee",
	palevioletred: "#db7093",
	papayawhip: "#ffefd5",
	peachpuff: "#ffdab9",
	peru: "#cd853f",
	pink: "#ffc0cb",
	plum: "#dda0dd",
	powderblue: "#b0e0e6",
	purple: "#800080",
	red: "#ff0000",
	rosybrown: "#bc8f8f",
	royalblue: "#4169e1",
	saddlebrown: "#8b4513",
	salmon: "#fa8072",
	sandybrown: "#f4a460",
	seagreen: "#2e8b57",
	seashell: "#fff5ee",
	sienna: "#a0522d",
	silver: "#c0c0c0",
	skyblue: "#87ceeb",
	slateblue: "#6a5acd",
	slategray: "#708090",
	slategrey: "#708090",
	snow: "#fffafa",
	springgreen: "#00ff7f",
	steelblue: "#4682b4",
	tan: "#d2b48c",
	teal: "#008080",
	thistle: "#d8bfd8",
	tomato: "#ff6347",
	turquoise: "#40e0d0",
	violet: "#ee82ee",
	wheat: "#f5deb3",
	white: "#ffffff",
	whitesmoke: "#f5f5f5",
	yellow: "#ffff00",
	yellowgreen: "#9acd32"
};



var Color = function(){
};

Color.showAll=function(divID){
	var template='<div style="float:left;height:20px;width:20px;background-color:{COLOR}" title="{NAME}"></div>';

	var list=[];
	forAllKey(colors, function(name, color, i){
		list.push({"name":name, "color":Color.newHTML(color).toLUV()});
	});

	list.sort(function(a, b){return a.color.U-b.color.U});
	list.sort(function(a, b){return a.color.V-b.color.V});
	list.sort(function(a, b){return (a.color.L-b.color.L)});


	var html="";
	list.forall(function(c, i){
		html+=template.replaceAll("{NAME}",c.name).replaceAll("{COLOR}", c.color.toHTML());
	});
	var temp=$("#"+divID);
		temp.html(html);
};//method


//EXPECT COLOUR AS HEX IN FORM #RRGGBB
Color.newHTML=function(html){
	return new ColorRGB(
		CNV.hex2int(html.substring(1,3)),
		CNV.hex2int(html.substring(3,5)),
		CNV.hex2int(html.substring(5,7))
	);
};



var ColorRGB=function(r, g, b){
	this.R=r;
	this.G=g;
	this.B=b;
};


var ColorXYZ=function(x, y, z){
	this.X=x;
	this.Y=y;
	this.Z=z;
};


var ColorLUV=function(L, u, v){
	this.L=L;
	this.U=u;
	this.V=v;
};





(function(){
	var DEBUG=true;


	ColorRGB.prototype.toHTML=function(){
		return "#"+CNV.int2hex(this.R, 2)+CNV.int2hex(this.G, 2)+CNV.int2hex(this.B, 2);
	};

	ColorRGB.prototype.toLUV=function(){
		return Rgb2Luv(this);
	};

	ColorLUV.prototype.toHTML=function(){
		return Luv2Rgb(this).toHTML();
	};

	ColorLUV.prototype.toRGB=function(){
		return Luv2Rgb(this);
	};

	ColorLUV.prototype.rotate=function(rads){
		var result=new aMath.Cart(this.U,this.V)
			.toPolar()
			.rotate(rads)
			.toCart()
		;

		return new ColorLUV(this.L, result.x, result.y);
	};




//TO KYLE: CIELUV SHOULD BE THE BEST FORMAT FOR HUMANE COLOUR TRANSITIONS
//C CODE FOR COLOR TRANSFORMATIONS FROM
// http://www.mathworks.com/matlabcentral/fileexchange/28790-colorspace-transformations

///**
// * @file colorspace.h
// * @author Pascal Getreuer 2005-2010 <getreuer@gmail.com>
// */
//#ifndef _COLORSPACE_H_
//#define _COLORSPACE_H_
//
///** @brief Datatype to use for representing real numbers
// * Set this typedef to either double or float depending on the application.
// */
//typedef double num;
//
//
/** @brief XYZ color of the D65 white point */
var WHITEPOINT_X=0.950456;
var WHITEPOINT_Y=1.0;
var WHITEPOINT_Z=1.088754;
//
//
//
///** @brief struct for representing a color transform */
//typedef struct
//{
//	int NumStages;
//	void (*Fun[2])(num*, num*, num*, num, num, num);
//} colortransform;
//
//int GetColorTransform(colortransform *Trans, const char *TransformString);
//void ApplyColorTransform(colortransform Trans,
//	num *D0, num *D1, num *D2, num S0, num S1, num S2);
//
//void Rgb2Yuv(num *Y, num *U, num *V, num R, num G, num B);
//void Yuv2Rgb(num *R, num *G, num *B, num Y, num U, num V);
//void Rgb2Ycbcr(num *Y, num *Cb, num *Cr, num R, num G, num B);
//void Ycbcr2Rgb(num *R, num *G, num *B, num Y, num Cb, num Cr);
//void Rgb2Jpegycbcr(num *R, num *G, num *B, num Y, num Cb, num Cr);
//void Jpegycbcr2Rgb(num *R, num *G, num *B, num Y, num Cb, num Cr);
//void Rgb2Ypbpr(num *Y, num *Pb, num *Pr, num R, num G, num B);
//void Ypbpr2Rgb(num *R, num *G, num *B, num Y, num Pb, num Pr);
//void Rgb2Ydbdr(num *Y, num *Db, num *Dr, num R, num G, num B);
//void Ydbdr2Rgb(num *R, num *G, num *B, num Y, num Db, num Dr);
//void Rgb2Yiq(num *Y, num *I, num *Q, num R, num G, num B);
//void Yiq2Rgb(num *R, num *G, num *B, num Y, num I, num Q);
//
//void Rgb2Hsv(num *H, num *S, num *V, num R, num G, num B);
//void Hsv2Rgb(num *R, num *G, num *B, num H, num S, num V);
//void Rgb2Hsl(num *H, num *S, num *L, num R, num G, num B);
//void Hsl2Rgb(num *R, num *G, num *B, num H, num S, num L);
//void Rgb2Hsi(num *H, num *S, num *I, num R, num G, num B);
//void Hsi2Rgb(num *R, num *G, num *B, num H, num S, num I);
//
//void Rgb2Xyz(num *X, num *Y, num *Z, num R, num G, num B);
//void Xyz2Rgb(num *R, num *G, num *B, num X, num Y, num Z);
//void Xyz2Lab(num *L, num *a, num *b, num X, num Y, num Z);
//void Lab2Xyz(num *X, num *Y, num *Z, num L, num a, num b);
//void Xyz2Luv(num *L, num *u, num *v, num X, num Y, num Z);
//void Luv2Xyz(num *X, num *Y, num *Z, num L, num u, num v);
//void Xyz2Lch(num *L, num *C, num *H, num X, num Y, num Z);
//void Lch2Xyz(num *X, num *Y, num *Z, num L, num C, num H);
//void Xyz2Cat02lms(num *L, num *M, num *S, num X, num Y, num Z);
//void Cat02lms2Xyz(num *X, num *Y, num *Z, num L, num M, num S);
//
//void Rgb2Lab(num *L, num *a, num *b, num R, num G, num B);
//void Lab2Rgb(num *R, num *G, num *B, num L, num a, num b);
//void Rgb2Luv(num *L, num *u, num *v, num R, num G, num B);
//void Luv2Rgb(num *R, num *G, num *B, num L, num u, num v);
//void Rgb2Lch(num *L, num *C, num *H, num R, num G, num B);
//void Lch2Rgb(num *R, num *G, num *B, num L, num C, num H);
//void Rgb2Cat02lms(num *L, num *M, num *S, num R, num G, num B);
//void Cat02lms2Rgb(num *R, num *G, num *B, num L, num M, num S);
//
//#endif  /* _COLORSPACE_H_ */





//
///**
// * @file colorspace.c
// * @author Pascal Getreuer 2005-2010 <getreuer@gmail.com>
// *
// * == Summary ==
// * This file implements routines for color transformations between the spaces
// * sRGB, Y'UV, Y'CbCr, Y'PbPr, Y'DbDr, Y'IQ, HSV, HSL, HSI, CIEXYZ, CIELAB,
// * CIELUV, CIELCH, and CIECAT02 LMS.
// *
// * == Usage ==
// * First call GetColorTransform, specifying the source and destination color
// * spaces as "dest<-src" or "src->dest".  Then call ApplyColorTransform to
// * perform the transform:
//@code
//       num S[3] = {173, 0.8, 0.5};
//       num D[3];
//       colortransform Trans;
//
//       if(!(GetColorTransform(&Trans, "HSI -> Lab")))
//       {
//           printf("Invalid syntax or unknown color space\n");
//           return;
//       }
//
//       ApplyColorTransform(Trans, &D[0], &D[1], &D[2], S[0], S[1], S[2]);
//@endcode
// * "num" is a typedef defined at the beginning of colorspace.h that may be set
// * to either double or float, depending on the application.
// *
// * Specific transformation routines can also be called directly.  The following
// * converts an sRGB color to CIELAB and then back to sRGB:
//@code
//     num R = 0.85, G = 0.32, B = 0.5;
//     num L, a, b;
//     Rgb2Lab(&L, &a, &b, R, G, B);
//     Lab2Rgb(&R, &G, &B, L, a, b);
//@endcode
// * Generally, the calling syntax is
//@code
//     Foo2Bar(&B0, &B1, &B2, F0, F1, F2);
//@endcode
// * where (F0,F1,F2) are the coordinates of a color in space "Foo" and
// * (B0,B1,B2) are the transformed coordinates in space "Bar."  For any
// * transformation routine, its inverse has the sytax
//@code
//     Bar2Foo(&F0, &F1, &F2, B0, B1, B2);
//@endcode
// *
// * The conversion routines are consistently named with the first letter of a
// * color space capitalized with following letters in lower case and omitting
// * prime symbols.  For example, "Rgb2Ydbdr" converts sRGB to Y'DbDr.  For
// * any transformation routine Foo2Bar, its inverse is Bar2Foo.
// *
// * All transformations assume a two degree observer angle and a D65 illuminant.
// * The white point can be changed by modifying the WHITEPOINT_X, WHITEPOINT_Y,
// * WHITEPOINT_Z definitions at the beginning of colorspace.h.
// *
// * == List of transformation routines ==
// *   - Rgb2Yuv(num *Y, num *U, num *V, num R, num G, num B)
// *   - Rgb2Ycbcr(num *Y, num *Cb, num *Cr, num R, num G, num B)
// *   - Rgb2Jpegycbcr(num *Y, num *Cb, num *Cr, num R, num G, num B)
// *   - Rgb2Ypbpr(num *Y, num *Pb, num *Pr, num R, num G, num B)
// *   - Rgb2Ydbdr(num *Y, num *Db, num *Dr, num R, num G, num B)
// *   - Rgb2Yiq(num *Y, num *I, num *Q, num R, num G, num B)
// *   - Rgb2Hsv(num *H, num *S, num *V, num R, num G, num B)
// *   - Rgb2Hsl(num *H, num *S, num *L, num R, num G, num B)
// *   - Rgb2Hsi(num *H, num *S, num *I, num R, num G, num B)
// *   - Rgb2Xyz(num *X, num *Y, num *Z, num R, num G, num B)
// *   - Xyz2Lab(num *L, num *a, num *b, num X, num Y, num Z)
// *   - Xyz2Luv(num *L, num *u, num *v, num X, num Y, num Z)
// *   - Xyz2Lch(num *L, num *C, num *h, num X, num Y, num Z)
// *   - Xyz2Cat02lms(num *L, num *M, num *S, num X, num Y, num Z)
// *   - Rgb2Lab(num *L, num *a, num *b, num R, num G, num B)
// *   - Rgb2Luv(num *L, num *u, num *v, num R, num G, num B)
// *   - Rgb2Lch(num *L, num *C, num *h, num R, num G, num B)
// *   - Rgb2Cat02lms(num *L, num *M, num *S, num R, num G, num B)
// * (Similarly for the inverse transformations.)
// *
// * It is possible to transform between two arbitrary color spaces by first
// * transforming from the source space to sRGB and then transforming from
// * sRGB to the desired destination space.  For transformations between CIE
// * color spaces, it is convenient to use XYZ as the intermediate space.  This
// * is the strategy used by GetColorTransform and ApplyColorTransform.
// *
// * == References ==
// * The definitions of these spaces and the many of the transformation formulas
// * can be found in
// *
// *    Poynton, "Frequently Asked Questions About Gamma"
// *    http://www.poynton.com/notes/colour_and_gamma/GammaFAQ.html
// *
// *    Poynton, "Frequently Asked Questions About Color"
// *    http://www.poynton.com/notes/colour_and_gamma/ColorFAQ.html
// *
// * and Wikipedia articles
// *    http://en.wikipedia.org/wiki/SRGB
// *    http://en.wikipedia.org/wiki/YUV
// *    http://en.wikipedia.org/wiki/YCbCr
// *    http://en.wikipedia.org/wiki/YPbPr
// *    http://en.wikipedia.org/wiki/YDbDr
// *    http://en.wikipedia.org/wiki/YIQ
// *    http://en.wikipedia.org/wiki/HSL_and_HSV
// *    http://en.wikipedia.org/wiki/CIE_1931_color_space
// *    http://en.wikipedia.org/wiki/Lab_color_space
// *    http://en.wikipedia.org/wiki/CIELUV_color_space
// *    http://en.wikipedia.org/wiki/LMS_color_space
// *
// * == License (BSD) ==
// * Copyright (c) 2005-2010, Pascal Getreuer
// * All rights reserved.
// *
// * Redistribution and use in source and binary forms, with or without
// * modification, are permitted provided that the following conditions are met:
// *
// * - Redistributions of source code must retain the above copyright
// *   notice, this list of conditions and the following disclaimer.
// * - Redistributions in binary form must reproduce the above copyright
// *   notice, this list of conditions and the following disclaimer in
// *   the documentation and/or other materials provided with the distribution.
// *
// * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// * POSSIBILITY OF SUCH DAMAGE.
// */
//#include <math.h>
//#include <stdio.h>
//#include <string.h>
//#include <ctype.h>
//#include "colorspace.h"
//
//#ifdef MATLAB_MEX_FILE
//#include "mex.h"
//#endif
//
///** @brief Min of A and B */
//#define MIN(A,B)	(((A) <= (B)) ? (A) : (B))
//
///** @brief Max of A and B */
//#define MAX(A,B)	(((A) >= (B)) ? (A) : (B))
//
///** @brief Min of A, B, and C */
//#define MIN3(A,B,C)	(((A) <= (B)) ? MIN(A,C) : MIN(B,C))
//
///** @brief Max of A, B, and C */
//#define MAX3(A,B,C)	(((A) >= (B)) ? MAX(A,C) : MAX(B,C))
//
//#ifndef M_PI
///** @brief The constant pi */
//#define M_PI	3.14159265358979323846264338327950288
//#endif
//
/**
* @brief sRGB gamma correction, transforms R to R'
* http://en.wikipedia.org/wiki/SRGB
*/
GAMMACORRECTION=function(t){
	return Math.round((((t) <= 0.0031306684425005883) ? (12.92*(t)) : (1.055*Math.pow((t), 0.416666666666666667) - 0.055)));
};//method

/**
* @brief Inverse sRGB gamma correction, transforms R' to R
*/
INVGAMMACORRECTION=function(t){
	return (((t) <= 0.0404482362771076) ? ((t)/12.92) : Math.pow(((t) + 0.055)/1.055, 2.4));
};//method


/**
* @brief CIE L*a*b* f function (used to convert XYZ to L*a*b*)
* http://en.wikipedia.org/wiki/Lab_color_space
*/
var LABF=function(t){
	return ((t >= 8.85645167903563082e-3) ? Math.pow(t,0.333333333333333) : (841.0/108.0)*(t) + (4.0/29.0));
};//method

/**
* @brief CIE L*a*b* inverse f function
* http://en.wikipedia.org/wiki/Lab_color_space
*/
function LABINVF(t){
	return ((t >= 0.206896551724137931) ? ((t)*(t)*(t)) : (108.0/841.0)*((t) - (4.0/29.0)));
}

/** @brief u'v' coordinates of the white point for CIE Lu*v* */
var WHITEPOINT_U=((4*WHITEPOINT_X) /(WHITEPOINT_X + 15*WHITEPOINT_Y + 3*WHITEPOINT_Z));
var WHITEPOINT_V=((9*WHITEPOINT_Y) /(WHITEPOINT_X + 15*WHITEPOINT_Y + 3*WHITEPOINT_Z));
//
///** @brief Enumeration of the supported color spaces */
//#define UNKNOWN_SPACE	0
//#define RGB_SPACE		1
//#define YUV_SPACE		2
//#define YCBCR_SPACE		3
//#define JPEGYCBCR_SPACE	4
//#define YPBPR_SPACE		5
//#define YDBDR_SPACE		6
//#define YIQ_SPACE		7
//#define HSV_SPACE		8
//#define HSL_SPACE		9
//#define HSI_SPACE		10
//#define XYZ_SPACE		11
//#define LAB_SPACE		12
//#define LUV_SPACE		13
//#define LCH_SPACE		14
//#define CAT02LMS_SPACE	15
//
//#define NUM_TRANSFORM_PAIRS		18
//
//
///** @brief Table representing all transformations in this file */
//static const struct
//{
//	int Space[2];
//	void (*Fun[2])(num*, num*, num*, num, num, num);
//} TransformPair[NUM_TRANSFORM_PAIRS] = {
//	{{RGB_SPACE, YUV_SPACE}, {Rgb2Yuv, Yuv2Rgb}},
//	{{RGB_SPACE, YCBCR_SPACE}, {Rgb2Ycbcr, Ycbcr2Rgb}},
//	{{RGB_SPACE, JPEGYCBCR_SPACE}, {Rgb2Jpegycbcr, Jpegycbcr2Rgb}},
//	{{RGB_SPACE, YPBPR_SPACE}, {Rgb2Ypbpr, Ypbpr2Rgb}},
//	{{RGB_SPACE, YDBDR_SPACE}, {Rgb2Ydbdr, Ydbdr2Rgb}},
//	{{RGB_SPACE, YIQ_SPACE}, {Rgb2Yiq, Yiq2Rgb}},
//	{{RGB_SPACE, HSV_SPACE}, {Rgb2Hsv, Hsv2Rgb}},
//	{{RGB_SPACE, HSL_SPACE}, {Rgb2Hsl, Hsl2Rgb}},
//	{{RGB_SPACE, HSI_SPACE}, {Rgb2Hsi, Hsi2Rgb}},
//	{{RGB_SPACE, XYZ_SPACE}, {Rgb2Xyz, Xyz2Rgb}},
//	{{XYZ_SPACE, LAB_SPACE}, {Xyz2Lab, Lab2Xyz}},
//	{{XYZ_SPACE, LUV_SPACE}, {Xyz2Luv, Luv2Xyz}},
//	{{XYZ_SPACE, LCH_SPACE}, {Xyz2Lch, Lch2Xyz}},
//	{{XYZ_SPACE, CAT02LMS_SPACE}, {Xyz2Cat02lms, Cat02lms2Xyz}},
//	{{RGB_SPACE, LAB_SPACE}, {Rgb2Lab, Lab2Rgb}},
//	{{RGB_SPACE, LUV_SPACE}, {Rgb2Luv, Luv2Rgb}},
//	{{RGB_SPACE, LCH_SPACE}, {Rgb2Lch, Lch2Rgb}},
//	{{RGB_SPACE, CAT02LMS_SPACE}, {Rgb2Cat02lms, Cat02lms2Rgb}}
//	};
//
//
///*
// * == Linear color transformations ==
// *
// * The following routines implement transformations between sRGB and
// * the linearly-related color spaces Y'UV, Y'PbPr, Y'DbDr, and Y'IQ.
// */
//
//
///**
// * @brief Convert sRGB to NTSC/PAL Y'UV Luma + Chroma
// *
// * @param Y, U, V pointers to hold the result
// * @param R, G, B the input sRGB values
// *
// * Wikipedia: http://en.wikipedia.org/wiki/YUV
// */
//void Rgb2Yuv(num *Y, num *U, num *V, num R, num G, num B)
//{
//	*Y = (num)( 0.299*R + 0.587*G + 0.114*B);
//	*U = (num)(-0.147*R - 0.289*G + 0.436*B);
//	*V = (num)( 0.615*R - 0.515*G - 0.100*B);
//}
//
//
///**
// * @brief Convert NTSC/PAL Y'UV to sRGB
// *
// * @param R, G, B pointers to hold the result
// * @param Y, U, V the input YUV values
// */
//void Yuv2Rgb(num *R, num *G, num *B, num Y, num U, num V)
//{
//	*R = (num)(Y - 3.945707070708279e-05*U + 1.1398279671717170825*V);
//	*G = (num)(Y - 0.3946101641414141437*U - 0.5805003156565656797*V);
//	*B = (num)(Y + 2.0319996843434342537*U - 4.813762626262513e-04*V);
//}
//
//
///** @brief sRGB to Y'CbCr Luma + Chroma */
//void Rgb2Ycbcr(num *Y, num *Cb, num *Cr, num R, num G, num B)
//{
//	*Y  = (num)( 65.481*R + 128.553*G +  24.966*B +  16);
//	*Cb = (num)(-37.797*R -  74.203*G + 112.0  *B + 128);
//	*Cr = (num)(112.0  *R -  93.786*G -  18.214*B + 128);
//}
//
//
///** @brief Y'CbCr to sRGB */
//void Ycbcr2Rgb(num *R, num *G, num *B, num Y, num Cr, num Cb)
//{
//	Y -= 16;
//	Cb -= 128;
//	Cr -= 128;
//	*R = (num)(0.00456621004566210107*Y + 1.1808799897946415e-09*Cr + 0.00625892896994393634*Cb);
//	*G = (num)(0.00456621004566210107*Y - 0.00153632368604490212*Cr - 0.00318811094965570701*Cb);
//	*B = (num)(0.00456621004566210107*Y + 0.00791071623355474145*Cr + 1.1977497040190077e-08*Cb);
//}
//
//
///** @brief sRGB to JPEG-Y'CbCr Luma + Chroma */
//void Rgb2Jpegycbcr(num *Y, num *Cb, num *Cr, num R, num G, num B)
//{
//	Rgb2Ypbpr(Y, Cb, Cr, R, G, B);
//	*Cb += (num)0.5;
//	*Cr += (num)0.5;
//}
//
///** @brief JPEG-Y'CbCr to sRGB */
//void Jpegycbcr2Rgb(num *R, num *G, num *B, num Y, num Cb, num Cr)
//{
//	Cb -= (num)0.5;
//	Cr -= (num)0.5;
//	Ypbpr2Rgb(R, G, B, Y, Cb, Cr);
//}
//
//
///** @brief sRGB to Y'PbPr Luma (ITU-R BT.601) + Chroma */
//void Rgb2Ypbpr(num *Y, num *Pb, num *Pr, num R, num G, num B)
//{
//	*Y  = (num)( 0.299    *R + 0.587   *G + 0.114   *B);
//	*Pb = (num)(-0.1687367*R - 0.331264*G + 0.5     *B);
//	*Pr = (num)( 0.5      *R - 0.418688*G - 0.081312*B);
//}
//
//
///** @brief Y'PbPr to sRGB */
//void Ypbpr2Rgb(num *R, num *G, num *B, num Y, num Pb, num Pr)
//{
//	*R = (num)(0.99999999999914679361*Y - 1.2188941887145875e-06*Pb + 1.4019995886561440468*Pr);
//	*G = (num)(0.99999975910502514331*Y - 0.34413567816504303521*Pb - 0.71413649331646789076*Pr);
//	*B = (num)(1.00000124040004623180*Y + 1.77200006607230409200*Pb + 2.1453384174593273e-06*Pr);
//}
//
//
///** @brief sRGB to SECAM Y'DbDr Luma + Chroma */
//void Rgb2Ydbdr(num *Y, num *Db, num *Dr, num R, num G, num B)
//{
//	*Y  = (num)( 0.299*R + 0.587*G + 0.114*B);
//	*Db = (num)(-0.450*R - 0.883*G + 1.333*B);
//	*Dr = (num)(-1.333*R + 1.116*G + 0.217*B);
//}
//
//
///** @brief SECAM Y'DbDr to sRGB */
//void Ydbdr2Rgb(num *R, num *G, num *B, num Y, num Db, num Dr)
//{
//	*R = (num)(Y + 9.2303716147657e-05*Db - 0.52591263066186533*Dr);
//	*G = (num)(Y - 0.12913289889050927*Db + 0.26789932820759876*Dr);
//	*B = (num)(Y + 0.66467905997895482*Db - 7.9202543533108e-05*Dr);
//}
//
//
///** @brief sRGB to NTSC YIQ */
//void Rgb2Yiq(num *Y, num *I, num *Q, num R, num G, num B)
//{
//	*Y = (num)(0.299   *R + 0.587   *G + 0.114   *B);
//	*I = (num)(0.595716*R - 0.274453*G - 0.321263*B);
//	*Q = (num)(0.211456*R - 0.522591*G + 0.311135*B);
//}
//
//
///** @brief Convert NTSC YIQ to sRGB */
//void Yiq2Rgb(num *R, num *G, num *B, num Y, num I, num Q)
//{
//	*R = (num)(Y + 0.9562957197589482261*I + 0.6210244164652610754*Q);
//	*G = (num)(Y - 0.2721220993185104464*I - 0.6473805968256950427*Q);
//	*B = (num)(Y - 1.1069890167364901945*I + 1.7046149983646481374*Q);
//}
//
//
//
///*
// * == Hue Saturation Value/Lightness/Intensity color transformations ==
// *
// * The following routines implement transformations between sRGB and
// * color spaces HSV, HSL, and HSI.
// */
//
//
///**
// * @brief Convert an sRGB color to Hue-Saturation-Value (HSV)
// *
// * @param H, S, V pointers to hold the result
// * @param R, G, B the input sRGB values scaled in [0,1]
// *
// * This routine transforms from sRGB to the hexcone HSV color space.  The
// * sRGB values are assumed to be between 0 and 1.  The output values are
// *   H = hexagonal hue angle   (0 <= H < 360),
// *   S = C/V                   (0 <= S <= 1),
// *   V = max(R',G',B')         (0 <= V <= 1),
// * where C = max(R',G',B') - min(R',G',B').  The inverse color transformation
// * is given by Hsv2Rgb.
// *
// * Wikipedia: http://en.wikipedia.org/wiki/HSL_and_HSV
// */
//void Rgb2Hsv(num *H, num *S, num *V, num R, num G, num B)
//{
//	num Max = MAX3(R, G, B);
//	num Min = MIN3(R, G, B);
//	num C = Max - Min;
//
//
//	*V = Max;
//
//	if(C > 0)
//	{
//		if(Max == R)
//		{
//			*H = (G - B) / C;
//
//			if(G < B)
//				*H += 6;
//		}
//		else if(Max == G)
//			*H = 2 + (B - R) / C;
//		else
//			*H = 4 + (R - G) / C;
//
//		*H *= 60;
//		*S = C / Max;
//	}
//	else
//		*H = *S = 0;
//}
//
//
///**
// * @brief Convert a Hue-Saturation-Value (HSV) color to sRGB
// *
// * @param R, G, B pointers to hold the result
// * @param H, S, V the input HSV values
// *
// * The input values are assumed to be scaled as
// *    0 <= H < 360,
// *    0 <= S <= 1,
// *    0 <= V <= 1.
// * The output sRGB values are scaled between 0 and 1.  This is the inverse
// * transformation of Rgb2Hsv.
// *
// * Wikipedia: http://en.wikipedia.org/wiki/HSL_and_HSV
// */
//void Hsv2Rgb(num *R, num *G, num *B, num H, num S, num V)
//{
//	num C = S * V;
//	num Min = V - C;
//	num X;
//
//
//	H -= 360*floor(H/360);
//	H /= 60;
//	X = C*(1 - fabs(H - 2*floor(H/2) - 1));
//
//	switch((int)H)
//	{
//	case 0:
//		*R = Min + C;
//		*G = Min + X;
//		*B = Min;
//		break;
//	case 1:
//		*R = Min + X;
//		*G = Min + C;
//		*B = Min;
//		break;
//	case 2:
//		*R = Min;
//		*G = Min + C;
//		*B = Min + X;
//		break;
//	case 3:
//		*R = Min;
//		*G = Min + X;
//		*B = Min + C;
//		break;
//	case 4:
//		*R = Min + X;
//		*G = Min;
//		*B = Min + C;
//		break;
//	case 5:
//		*R = Min + C;
//		*G = Min;
//		*B = Min + X;
//		break;
//	default:
//		*R = *G = *B = 0;
//	}
//}
//
//
///**
// * @brief Convert an sRGB color to Hue-Saturation-Lightness (HSL)
// *
// * @param H, S, L pointers to hold the result
// * @param R, G, B the input sRGB values scaled in [0,1]
// *
// * This routine transforms from sRGB to the double hexcone HSL color space
// * The sRGB values are assumed to be between 0 and 1.  The outputs are
// *   H = hexagonal hue angle                (0 <= H < 360),
// *   S = { C/(2L)     if L <= 1/2           (0 <= S <= 1),
// *       { C/(2 - 2L) if L >  1/2
// *   L = (max(R',G',B') + min(R',G',B'))/2  (0 <= L <= 1),
// * where C = max(R',G',B') - min(R',G',B').  The inverse color transformation
// * is given by Hsl2Rgb.
// *
// * Wikipedia: http://en.wikipedia.org/wiki/HSL_and_HSV
// */
//void Rgb2Hsl(num *H, num *S, num *L, num R, num G, num B)
//{
//	num Max = MAX3(R, G, B);
//	num Min = MIN3(R, G, B);
//	num C = Max - Min;
//
//
//	*L = (Max + Min)/2;
//
//	if(C > 0)
//	{
//		if(Max == R)
//		{
//			*H = (G - B) / C;
//
//			if(G < B)
//				*H += 6;
//		}
//		else if(Max == G)
//			*H = 2 + (B - R) / C;
//		else
//			*H = 4 + (R - G) / C;
//
//		*H *= 60;
//		*S = (*L <= 0.5) ? (C/(2*(*L))) : (C/(2 - 2*(*L)));
//	}
//	else
//		*H = *S = 0;
//}
//
//
///**
// * @brief Convert a Hue-Saturation-Lightness (HSL) color to sRGB
// *
// * @param R, G, B pointers to hold the result
// * @param H, S, L the input HSL values
// *
// * The input values are assumed to be scaled as
// *    0 <= H < 360,
// *    0 <= S <= 1,
// *    0 <= L <= 1.
// * The output sRGB values are scaled between 0 and 1.  This is the inverse
// * transformation of Rgb2Hsl.
// *
// * Wikipedia: http://en.wikipedia.org/wiki/HSL_and_HSV
// */
//void Hsl2Rgb(num *R, num *G, num *B, num H, num S, num L)
//{
//	num C = (L <= 0.5) ? (2*L*S) : ((2 - 2*L)*S);
//	num Min = L - 0.5*C;
//	num X;
//
//
//	H -= 360*floor(H/360);
//	H /= 60;
//	X = C*(1 - fabs(H - 2*floor(H/2) - 1));
//
//	switch((int)H)
//	{
//	case 0:
//		*R = Min + C;
//		*G = Min + X;
//		*B = Min;
//		break;
//	case 1:
//		*R = Min + X;
//		*G = Min + C;
//		*B = Min;
//		break;
//	case 2:
//		*R = Min;
//		*G = Min + C;
//		*B = Min + X;
//		break;
//	case 3:
//		*R = Min;
//		*G = Min + X;
//		*B = Min + C;
//		break;
//	case 4:
//		*R = Min + X;
//		*G = Min;
//		*B = Min + C;
//		break;
//	case 5:
//		*R = Min + C;
//		*G = Min;
//		*B = Min + X;
//		break;
//	default:
//		*R = *G = *B = 0;
//	}
//}
//
//
///**
// * @brief Convert an sRGB color to Hue-Saturation-Intensity (HSI)
// *
// * @param H, S, I pointers to hold the result
// * @param R, G, B the input sRGB values scaled in [0,1]
// *
// * This routine transforms from sRGB to the cylindrical HSI color space.  The
// * sRGB values are assumed to be between 0 and 1.  The output values are
// *   H = polar hue angle         (0 <= H < 360),
// *   S = 1 - min(R',G',B')/I     (0 <= S <= 1),
// *   I = (R'+G'+B')/3            (0 <= I <= 1).
// * The inverse color transformation is given by Hsi2Rgb.
// *
// * Wikipedia: http://en.wikipedia.org/wiki/HSL_and_HSV
// */
//void Rgb2Hsi(num *H, num *S, num *I, num R, num G, num B)
//{
//	num alpha = 0.5*(2*R - G - B);
//	num beta = 0.866025403784439*(G - B);
//
//
//	*I = (R + G + B)/3;
//
//	if(*I > 0)
//	{
//		*S = 1 - MIN3(R,G,B) / *I;
//		*H = atan2(beta, alpha)*(180/M_PI);
//
//		if(*H < 0)
//			*H += 360;
//	}
//	else
//		*H = *S = 0;
//}
//
//
///**
// * @brief Convert a Hue-Saturation-Intesity (HSI) color to sRGB
// *
// * @param R, G, B pointers to hold the result
// * @param H, S, I the input HSI values
// *
// * The input values are assumed to be scaled as
// *    0 <= H < 360,
// *    0 <= S <= 1,
// *    0 <= I <= 1.
// * The output sRGB values are scaled between 0 and 1.  This is the inverse
// * transformation of Rgb2Hsi.
// *
// * Wikipedia: http://en.wikipedia.org/wiki/HSL_and_HSV
// */
//void Hsi2Rgb(num *R, num *G, num *B, num H, num S, num I)
//{
//	H -= 360*floor(H/360);
//
//	if(H < 120)
//	{
//		*B = I*(1 - S);
//		*R = I*(1 + S*cos(H*(M_PI/180))/cos((60 - H)*(M_PI/180)));
//		*G = 3*I - *R - *B;
//	}
//	else if(H < 240)
//	{
//		H -= 120;
//		*R = I*(1 - S);
//		*G = I*(1 + S*cos(H*(M_PI/180))/cos((60 - H)*(M_PI/180)));
//		*B = 3*I - *R - *G;
//	}
//	else
//	{
//		H -= 240;
//		*G = I*(1 - S);
//		*B = I*(1 + S*cos(H*(M_PI/180))/cos((60 - H)*(M_PI/180)));
//		*R = 3*I - *G - *B;
//	}
//}
//
//
///*
// * == CIE color transformations ==
// *
// * The following routines implement transformations between sRGB and
// * the CIE color spaces XYZ, L*a*b, L*u*v*, and L*C*H*.  These
// * transforms assume a 2 degree observer angle and a D65 illuminant.
// */
//
//
/**
* @brief Transform sRGB to CIE XYZ with the D65 white point
*
* @param X, Y, Z pointers to hold the result
* @param R, G, B the input sRGB values
*
* Poynton, "Frequently Asked Questions About Color," page 10
* Wikipedia: http://en.wikipedia.org/wiki/SRGB
* Wikipedia: http://en.wikipedia.org/wiki/CIE_1931_color_space
*/
function Rgb2Xyz(rgb){
	var R = INVGAMMACORRECTION(rgb.R);
	var G = INVGAMMACORRECTION(rgb.G);
	var B = INVGAMMACORRECTION(rgb.B);
	var X = (0.4123955889674142161*R + 0.3575834307637148171*G + 0.1804926473817015735*B);
	var Y = (0.2125862307855955516*R + 0.7151703037034108499*G + 0.07220049864333622685*B);
	var Z = (0.01929721549174694484*R + 0.1191838645808485318*G + 0.9504971251315797660*B);

	var output=new ColorXYZ(X, Y, Z);

	if (DEBUG){
		var test=Xyz2Rgb(output);
		if (!Map.equals(rgb, test)){
			D.error("");
		}//endif
	}//endif
	return output;
}//method





/**
* @brief Transform CIE XYZ to sRGB with the D65 white point
*
* @param R, G, B pointers to hold the result
* @param X, Y, Z the input XYZ values
*
* Official sRGB specification (IEC 61966-2-1:1999)
* Poynton, "Frequently Asked Questions About Color," page 10
* Wikipedia: http://en.wikipedia.org/wiki/SRGB
* Wikipedia: http://en.wikipedia.org/wiki/CIE_1931_color_space
*/
function Xyz2Rgb(xyz){
	var R1 = ( 3.2406*xyz.X - 1.5372*xyz.Y - 0.4986*xyz.Z);
	var G1 = (-0.9689*xyz.X + 1.8758*xyz.Y + 0.0415*xyz.Z);
	var B1 = ( 0.0557*xyz.X - 0.2040*xyz.Y + 1.0570*xyz.Z);

	var Min = Math.min(R1, G1, B1);

	/* Force nonnegative values so that gamma correction is well-defined. */
	if(Min < 0){
		R1 -= Min;
		G1 -= Min;
		B1 -= Min;
	}

	/* Transform from RGB to R'G'B' */
	return new ColorRGB(GAMMACORRECTION(R1), GAMMACORRECTION(G1), GAMMACORRECTION(B1));
}


///**
// * Convert CIE XYZ to CIE L*a*b* (CIELAB) with the D65 white point
// *
// * @param L, a, b pointers to hold the result
// * @param X, Y, Z the input XYZ values
// *
// * Wikipedia: http://en.wikipedia.org/wiki/Lab_color_space
// */
//void Xyz2Lab(num *L, num *a, num *b, num X, num Y, num Z)
//{
//	X /= WHITEPOINT_X;
//	Y /= WHITEPOINT_Y;
//	Z /= WHITEPOINT_Z;
//	X = LABF(X);
//	Y = LABF(Y);
//	Z = LABF(Z);
//	*L = 116*Y - 16;
//	*a = 500*(X - Y);
//	*b = 200*(Y - Z);
//}
//
//
///**
// * Convert CIE L*a*b* (CIELAB) to CIE XYZ with the D65 white point
// *
// * @param X, Y, Z pointers to hold the result
// * @param L, a, b the input L*a*b* values
// *
// * Wikipedia: http://en.wikipedia.org/wiki/Lab_color_space
// */
//void Lab2Xyz(num *X, num *Y, num *Z, num L, num a, num b)
//{
//	L = (L + 16)/116;
//	a = L + a/500;
//	b = L - b/200;
//	*X = WHITEPOINT_X*LABINVF(a);
//	*Y = WHITEPOINT_Y*LABINVF(L);
//	*Z = WHITEPOINT_Z*LABINVF(b);
//}
//
//
///**
// * Convert CIE XYZ to CIE L*u*v* (CIELUV) with the D65 white point
// *
// * @param L, u, v pointers to hold the result
// * @param X, Y, Z the input XYZ values
// *
// * Wikipedia: http://en.wikipedia.org/wiki/CIELUV_color_space
// */
 function Xyz2Luv(xyz){
	var u1, v1;

	var Denom = xyz.X + 15*xyz.Y + 3*xyz.Z;
	if((Denom) > 0){
		u1 = (4*xyz.X) / Denom;
		v1 = (9*xyz.Y) / Denom;
	}else{
		u1 = v1 = 0;
	}//endif

	var Y = xyz.Y / WHITEPOINT_Y;
	Y = LABF(Y);

	var L = 116*Y - 16;
	var u = 13*L*(u1 - WHITEPOINT_U);
	var v = 13*L*(v1 - WHITEPOINT_V);

 	var output=new ColorLUV(L, u, v);
	if (DEBUG){
		var test=Luv2Xyz(output);
		if (!Map.equals(xyz, test)){
			D.error("");
		}//endif
	}//endif
	return output;


}
//
//
/**
* Convert CIE L*u*v* (CIELUV) to CIE XYZ with the D65 white point
*
* @param X, Y, Z pointers to hold the result
* @param L, u, v the input L*u*v* values
*
* Wikipedia: http://en.wikipedia.org/wiki/CIELUV_color_space
*/
function Luv2Xyz(luv){
	var Y = (luv.L + 16)/116;
	Y = WHITEPOINT_Y*LABINVF(Y);

	var u=luv.U;
	var v=luv.V;
	if(luv.L != 0){
		u /= luv.L;
		v /= luv.L;
	}
	u = u/13 + WHITEPOINT_U;
	v = v/13 + WHITEPOINT_V;

	var X = Y * ((9*u)/(4*v));
	var Z = Y * ((3 - 0.75*u)/v - 5);
	return new ColorXYZ(X, Y, Z);
}


///**
// * Convert CIE XYZ to CIE L*C*H* with the D65 white point
// *
// * @param L, C, H pointers to hold the result
// * @param X, Y, Z the input XYZ values
// *
// * CIE L*C*H* is related to CIE L*a*b* by
// *    a* = C* cos(H* pi/180),
// *    b* = C* sin(H* pi/180).
// */
//void Xyz2Lch(num *L, num *C, num *H, num X, num Y, num Z)
//{
//	num a, b;
//
//
//	Xyz2Lab(L, &a, &b, X, Y, Z);
//	*C = sqrt(a*a + b*b);
//	*H = atan2(b, a)*180.0/M_PI;
//
//	if(*H < 0)
//		*H += 360;
//}
//
///**
// * Convert CIE L*C*H* to CIE XYZ with the D65 white point
// *
// * @param X, Y, Z pointers to hold the result
// * @param L, C, H the input L*C*H* values
// */
//void Lch2Xyz(num *X, num *Y, num *Z, num L, num C, num H)
//{
//	num a = C * cos(H*(M_PI/180.0));
//	num b = C * sin(H*(M_PI/180.0));
//
//
//	Lab2Xyz(X, Y, Z, L, a, b);
//}
//
//
///** @brief XYZ to CAT02 LMS */
//void Xyz2Cat02lms(num *L, num *M, num *S, num X, num Y, num Z)
//{
//	*L = (num)( 0.7328*X + 0.4296*Y - 0.1624*Z);
//	*M = (num)(-0.7036*X + 1.6975*Y + 0.0061*Z);
//	*S = (num)( 0.0030*X + 0.0136*Y + 0.9834*Z);
//}
//
//
///** @brief CAT02 LMS to XYZ */
//void Cat02lms2Xyz(num *X, num *Y, num *Z, num L, num M, num S)
//{
//	*X = (num)( 1.096123820835514*L - 0.278869000218287*M + 0.182745179382773*S);
//	*Y = (num)( 0.454369041975359*L + 0.473533154307412*M + 0.072097803717229*S);
//	*Z = (num)(-0.009627608738429*L - 0.005698031216113*M + 1.015325639954543*S);
//}
//
//
///*
// * == Glue functions for multi-stage transforms ==
// */
//
//void Rgb2Lab(num *L, num *a, num *b, num R, num G, num B)
//{
//	num X, Y, Z;
//	Rgb2Xyz(&X, &Y, &Z, R, G, B);
//	Xyz2Lab(L, a, b, X, Y, Z);
//}
//
//
//void Lab2Rgb(num *R, num *G, num *B, num L, num a, num b)
//{
//	num X, Y, Z;
//	Lab2Xyz(&X, &Y, &Z, L, a, b);
//	Xyz2Rgb(R, G, B, X, Y, Z);
//}
//
//
function Rgb2Luv(rgb){
	var xyz=Rgb2Xyz(rgb);
	return Xyz2Luv(xyz);
}


function Luv2Rgb(luv){
	return Xyz2Rgb(Luv2Xyz(luv));
}

//void Rgb2Lch(num *L, num *C, num *H, num R, num G, num B)
//{
//	num X, Y, Z;
//	Rgb2Xyz(&X, &Y, &Z, R, G, B);
//	Xyz2Lch(L, C, H, X, Y, Z);
//}
//
//
//void Lch2Rgb(num *R, num *G, num *B, num L, num C, num H)
//{
//	num X, Y, Z;
//	Lch2Xyz(&X, &Y, &Z, L, C, H);
//	Xyz2Rgb(R, G, B, X, Y, Z);
//}
//
//
//void Rgb2Cat02lms(num *L, num *M, num *S, num R, num G, num B)
//{
//	num X, Y, Z;
//	Rgb2Xyz(&X, &Y, &Z, R, G, B);
//	Xyz2Cat02lms(L, M, S, X, Y, Z);
//}
//
//
//void Cat02lms2Rgb(num *R, num *G, num *B, num L, num M, num S)
//{
//	num X, Y, Z;
//	Cat02lms2Xyz(&X, &Y, &Z, L, M, S);
//	Xyz2Rgb(R, G, B, X, Y, Z);
//}
//
//
//
///*
// * == Interface Code ==
// * The following is to define a function GetColorTransform with a convenient
// * string-based interface.
// */
//
///** @brief Convert a color space name to an integer ID */
//static int IdFromName(const char *Name)
//{
//	if(!strcmp(Name, "rgb") || *Name == 0)
//		return RGB_SPACE;
//	else if(!strcmp(Name, "yuv"))
//		return YUV_SPACE;
//	else if(!strcmp(Name, "ycbcr"))
//		return YCBCR_SPACE;
//	else if(!strcmp(Name, "jpegycbcr"))
//		return YCBCR_SPACE;
//	else if(!strcmp(Name, "ypbpr"))
//		return YPBPR_SPACE;
//	else if(!strcmp(Name, "ydbdr"))
//		return YDBDR_SPACE;
//	else if(!strcmp(Name, "yiq"))
//		return YIQ_SPACE;
//	else if(!strcmp(Name, "hsv") || !strcmp(Name, "hsb"))
//		return HSV_SPACE;
//	else if(!strcmp(Name, "hsl") || !strcmp(Name, "hls"))
//		return HSL_SPACE;
//	else if(!strcmp(Name, "hsi"))
//		return HSI_SPACE;
//	else if(!strcmp(Name, "xyz") || !strcmp(Name, "ciexyz"))
//		return XYZ_SPACE;
//	else if(!strcmp(Name, "lab") || !strcmp(Name, "cielab"))
//		return LAB_SPACE;
//	else if(!strcmp(Name, "luv") || !strcmp(Name, "cieluv"))
//		return LUV_SPACE;
//	else if(!strcmp(Name, "lch") || !strcmp(Name, "cielch"))
//		return LCH_SPACE;
//	else if(!strcmp(Name, "cat02lms") || !strcmp(Name, "ciecat02lms"))
//		return CAT02LMS_SPACE;
//	else
//		return UNKNOWN_SPACE;
//}
//
//
///**
// * @brief Given a transform string, returns a colortransform struct
// *
// * @param Trans a colortransform pointer to hold the transform
// * @param TransformString string specifying the transformations
// * @return 1 on success, 0 on failure
// *
// * This function provides a convenient interface to the collection of transform
// * functions in this file.  TransformString specifies the source and
// * destination color spaces,
// *    TransformString = "dest<-src"
// * or alternatively,
// *    TransformString = "src->dest".
// *
// * Supported color spaces are
// *    "RGB"             sRGB Red Green Blue (ITU-R BT.709 gamma-corrected),
// *    "YPbPr"           Luma (ITU-R BT.601) + Chroma,
// *    "YCbCr"           Luma + Chroma ("digitized" version of Y'PbPr),
// *    "JPEG-YCbCr"      Luma + Chroma space used in JFIF JPEG,
// *    "YUV"             NTSC PAL Y'UV Luma + Chroma,
// *    "YIQ"             NTSC Y'IQ Luma + Chroma,
// *    "YDbDr"           SECAM Y'DbDr Luma + Chroma,
// *    "HSV" or "HSB"    Hue Saturation Value/Brightness,
// *    "HSL" or "HLS"    Hue Saturation Luminance,
// *    "HSI"             Hue Saturation Intensity,
// *    "XYZ"             CIE XYZ,
// *    "Lab"             CIE L*a*b* (CIELAB),
// *    "Luv"             CIE L*u*v* (CIELUV),
// *    "LCH"             CIE L*C*H* (CIELCH),
// *    "CAT02 LMS"       CIE CAT02 LMS.
// * Color space names are case-insensitive and spaces are ignored.  When sRGB
// * is the source or destination, it can be omitted.  For example "yuv<-" is
// * short for "yuv<-rgb".
// *
// * The routine returns a colortransform structure representing the transform.
// * The transform is performed by calling GetColorTransform.  For example,
//@code
//       num S[3] = {173, 0.8, 0.5};
//       num D[3];
//       colortransform Trans;
//
//       if(!(GetColorTransform(&Trans, "HSI -> Lab")))
//       {
//           printf("Invalid syntax or unknown color space\n");
//           return;
//       }
//
//       ApplyColorTransform(Trans, &D[0], &D[1], &D[2], S[0], S[1], S[2]);
//@endcode
// */
//int GetColorTransform(colortransform *Trans, const char *TransformString)
//{
//	int LeftNumChars = 0, RightNumChars = 0, LeftSide = 1, LeftToRight = 0;
//	int i, j, SrcSpaceId, DestSpaceId;
//	char LeftSpace[16], RightSpace[16], c;
//
//
//	Trans->NumStages = 0;
//	Trans->Fun[0] = 0;
//	Trans->Fun[1] = 0;
//
//	/* Parse the transform string */
//	while(1)
//	{
//		c = *(TransformString++);	/* Read the next character */
//
//		if(!c)
//			break;
//		else if(c == '<')
//		{
//			LeftToRight = 0;
//			LeftSide = 0;
//		}
//		else if(c == '>')
//		{
//			LeftToRight = 1;
//			LeftSide = 0;
//		}
//		else if(c != ' ' && c != '-' && c != '=')
//		{
//			if(LeftSide)
//			{	/* Append the character to LeftSpace */
//				if(LeftNumChars < 15)
//					LeftSpace[LeftNumChars++] = tolower(c);
//			}
//			else
//			{	/* Append the character to RightSpace */
//				if(RightNumChars < 15)
//					RightSpace[RightNumChars++] = tolower(c);
//			}
//		}
//	}
//
//	/* Append null terminators on the LeftSpace and RightSpace strings */
//	LeftSpace[LeftNumChars] = 0;
//	RightSpace[RightNumChars] = 0;
//
//	/* Convert names to colorspace enum */
//	if(LeftToRight)
//	{
//		SrcSpaceId = IdFromName(LeftSpace);
//		DestSpaceId = IdFromName(RightSpace);
//	}
//	else
//	{
//		SrcSpaceId = IdFromName(RightSpace);
//		DestSpaceId = IdFromName(LeftSpace);
//	}
//
//	/* Is either space is unknown? (probably a parsing error) */
//	if(SrcSpaceId == UNKNOWN_SPACE || DestSpaceId == UNKNOWN_SPACE)
//		return 0;	/* Return failure */
//
//	/* Is this an identity transform? */
//	if(SrcSpaceId == DestSpaceId)
//		return 1;	/* Return successfully */
//
//	/* Search the TransformPair table for a direct transformation */
//	for(i = 0; i < NUM_TRANSFORM_PAIRS; i++)
//	{
//		if(SrcSpaceId == TransformPair[i].Space[0]
//			&& DestSpaceId == TransformPair[i].Space[1])
//		{
//			Trans->NumStages = 1;
//			Trans->Fun[0] = TransformPair[i].Fun[0];
//			return 1;
//		}
//		else if(DestSpaceId == TransformPair[i].Space[0]
//			&& SrcSpaceId == TransformPair[i].Space[1])
//		{
//			Trans->NumStages = 1;
//			Trans->Fun[0] = TransformPair[i].Fun[1];
//			return 1;
//		}
//	}
//
//	/* Search the TransformPair table for a two-stage transformation */
//	for(i = 1; i < NUM_TRANSFORM_PAIRS; i++)
//		if(SrcSpaceId == TransformPair[i].Space[1])
//			for(j = 0; j < i; j++)
//			{
//				if(DestSpaceId == TransformPair[j].Space[1]
//					&& TransformPair[i].Space[0] == TransformPair[j].Space[0])
//				{
//					Trans->NumStages = 2;
//					Trans->Fun[0] = TransformPair[i].Fun[1];
//					Trans->Fun[1] = TransformPair[j].Fun[0];
//					return 1;
//				}
//			}
//		else if(DestSpaceId == TransformPair[i].Space[1])
//			for(j = 0; j < i; j++)
//			{
//				if(SrcSpaceId == TransformPair[j].Space[1]
//					&& TransformPair[j].Space[0] == TransformPair[i].Space[0])
//				{
//					Trans->NumStages = 2;
//					Trans->Fun[0] = TransformPair[j].Fun[1];
//					Trans->Fun[1] = TransformPair[i].Fun[0];
//					return 1;
//				}
//			}
//
//	return 0;
//}
//
//
///**
// * @brief Apply a colortransform
// *
// * @param Trans colortransform struct created by GetColorTransform
// * @param D0, D1, D2 pointers to hold the result
// * @param S0, S1, S2 the input values
// */
//void ApplyColorTransform(colortransform Trans,
//	num *D0, num *D1, num *D2, num S0, num S1, num S2)
//{
//	switch(Trans.NumStages)
//	{
//	case 1:
//		Trans.Fun[0](D0, D1, D2, S0, S1, S2);
//		break;
//	case 2:
//		{
//			num T0, T1, T2;
//			Trans.Fun[0](&T0, &T1, &T2, S0, S1, S2);
//			Trans.Fun[1](D0, D1, D2, T0, T1, T2);
//		}
//		break;
//	default:
//		*D0 = S0;
//		*D1 = S1;
//		*D2 = S2;
//		break;
//	}
//}
//
//
///* The code below allows this file to be compiled as a MATLAB MEX function.
// * From MATLAB, the calling syntax is
// *    B = colorspace('dest<-src', A);
// * See colorspace.m for details.
// */
//#ifdef MATLAB_MEX_FILE
///** @brief MEX gateway */
//void mexFunction(int nlhs, mxArray *plhs[], int nrhs, const mxArray*prhs[])
//{
//    #define	S_IN	     prhs[0]
//    #define	A_IN	     prhs[1]
//    #define	B_OUT	     plhs[0]
//#define IS_REAL_FULL_DOUBLE(P) (!mxIsComplex(P) \
//&& !mxIsSparse(P) && mxIsDouble(P))
//	num *A, *B;
//	char *SBuf;
//	const int *Size;
//	colortransform Trans;
//	int SBufLen, NumPixels, Channel, Channel2;
//
//
//    /* Parse the input arguments */
//    if(nrhs != 2)
//        mexErrMsgTxt("Two input arguments required.");
//    else if(nlhs > 1)
//        mexErrMsgTxt("Too many output arguments.");
//
//	if(!mxIsChar(S_IN))
//		mexErrMsgTxt("First argument should be a string.");
//    if(!IS_REAL_FULL_DOUBLE(A_IN))
//        mexErrMsgTxt("Second argument should be a real full double array.");
//
//	Size = mxGetDimensions(A_IN);
//
//	if(mxGetNumberOfDimensions(A_IN) > 3
//		|| Size[mxGetNumberOfDimensions(A_IN) - 1] != 3)
//		mexErrMsgTxt("Second argument should be an Mx3 or MxNx3 array.");
//
//	/* Read the color transform from S */
//	SBufLen = mxGetNumberOfElements(S_IN)*sizeof(mxChar) + 1;
//	SBuf = mxMalloc(SBufLen);
//	mxGetString(S_IN, SBuf, SBufLen);
//
//	if(!(GetColorTransform(&Trans, SBuf)))
//		mexErrMsgTxt("Invalid syntax or unknown color space.");
//
//	mxFree(SBuf);
//
//	A = (num *)mxGetData(A_IN);
//	NumPixels = mxGetNumberOfElements(A_IN)/3;
//
//	/* Create the output image */
//	B_OUT = mxCreateDoubleMatrix(0, 0, mxREAL);
//	mxSetDimensions(B_OUT, Size, mxGetNumberOfDimensions(A_IN));
//	mxSetData(B_OUT, B = mxMalloc(sizeof(num)*mxGetNumberOfElements(A_IN)));
//
//	Channel = NumPixels;
//	Channel2 = NumPixels*2;
//
//	/* Apply the color transform */
//	while(NumPixels--)
//	{
//		ApplyColorTransform(Trans, B, B + Channel, B + Channel2,
//			A[0], A[Channel], A[Channel2]);
//		A++;
//		B++;
//	}
//
//    return;
//}
//#endif

})();
