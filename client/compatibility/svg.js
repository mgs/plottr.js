// Database
svg = {
    points: new Meteor.Collection(null),
    createRandomPoints: (n) => {
        for(let i = 0; i < n; i += 1){
            svg.points.insert({
                x: Math.floor(Math.random()*$(document).innerWidth()),
                y: Math.floor(Math.random()*$(document).innerHeight())
            });
        }
    },
    loadPointsFromSVG: (points) => {
        for(let i = 0; i < 2; i += 1){
            svg.points.insert ({
                x: points[i][0],
                y: points[i][1]
            });
        }
    },
    setupCanvas: (width, height) => {
        $('#svg').width(width);
        $('#svg').height(height);
    }
};

// function convertSvgToHPGL(svg){
//     $(svg).find('path').each(function(i){
//         var path = this;
//         var len = path.getTotalLength();
//         var p=path.getPointAtLength(0);
//         stp=p.x+","+p.y
//         for(var i=1; i<len; i++){
//             p=path.getPointAtLength(i);
//             stp=stp+" "+p.x+","+p.y;
//         }
//         console.log(stp);
//         $(path).replaceWith('<polygon points="' +  stp + '" />');
//     });

//     return $(svg).find('g').find('polygon').attr('points').split(' ').map(function(c,i,a){
//         var temp = c.split(',');
//         return [ Number(temp[0]), Number(temp[1])]
//     });
// }

function convertSvgToHPGL(svg, scale, xOffset, yOffset, precision){
    let pointArray = [];

    $(svg).find('path').each(function(i){
        let path = this;
        let len = path.getTotalLength();
        let p = path.getPointAtLength(0);
        pointArray.push('PU,' + ((p.x*scale)+xOffset) + ',' + ((p.y*scale)+yOffset) + ';PD,');
        for(var i=1; i < len; i += precision){
            p=path.getPointAtLength(i);
            if(i > len-precision){
                pointArray.push(((p.x*scale)+xOffset) + ',' + ((p.y*scale)+yOffset) + ';');
            } else {
                pointArray.push(((p.x*scale)+xOffset) + ',' + ((p.y*scale)+yOffset) + ',');
            }
        }
    });

    return(pointArray.join(''));
}


function svgMatcher(s, match) {
    var matcher = {
        'M': 'PR;PU',
        'm': 'PA;PU',
        'l': 'PA;PU',
        'h': 'PR;PD',
        'v': 'PR;PD'
    };
    if(matcher.hasOwnProperty(match)){
        return matcher[match] + s.replace(/[A-z]/g, '');
    }
}

function rotatePoint(angle, x, y){
    newX = x * Math.cos(angle) - (y * Math.sin(angle));
    newY = y * Math.cos(angle) + (x * Math.sin(angle));

    return [newX, newY];
}

function simplifySVG(svgDData){
    let arr = [];
    //console.log(plotter['svg'][0].replace(/([A-z])/g, svgMatcher));
}

function readPointsFromSVG (svg) {
    let paths = svg.g;
    let points = [];
    for(let i = 0; i < paths.length; i += 1){
        let temp = paths[i].points.split(' ');
        temp.map(string.split(','));
    }
    //let svg = $.parseXML(xml);
    //let paths = svg.g.path;
    //let paths = svg.path;
    //let n = paths.length;
    //console.log(svg);
    // let points = [],
    //     jsonPaths = [];

    // for (let i = 0; i < n; i += 1){
    //     console.log(xmlToJson(paths[i]['@attributes']));
    // }
    //return jsonPaths;
}

// function polygonSampledFromPath(path,samples){
// 		var doc = path.ownerDocument;
// 		var poly = doc.createElementNS('http://www.w3.org/2000/svg','polygon');

// 		var points = [];
// 		var len  = path.getTotalLength();
// 		var step = step=len/samples;
// 		for (var i=0;i<=len;i+=step){
// 			  var p = path.getPointAtLength(i);
// 			  points.push( p.x+','+p.y );
// 		}
// 		poly.setAttribute('points',points.join(' '));
// 		return poly;
// }

// function createSamples(svg,func) {
// 		var samples = [
// 			  {count:  9, offset:-200},
//         {count: 15, offset:-100},
// 			  {count: 25, offset:   0},
// 			  {count: 50, offset: 100},
//         {count: 75, offset: 200}
// 		];
// 		for (var i=samples.length-1;  i>=0; --i){
// 			  var sample = samples[i];
// 			  var g = createOn(svg, 'g', {transform: 'translate(' + sample.offset + ',0)'});
// 			  createOn(g,'use',{'xlink:href':'#bat'});
// 			  var poly = g.appendChild(func(bat,sample.count));
// 			  createOn(g,'text',{y:100},sample.count+' samples');
// 			  for (var j=poly.points.numberOfItems-1; j>=0; --j){
// 				    var pt = poly.points.getItem(j);
// 				    createOn(g,'use',{'xlink:href':'#dot',x:pt.x,y:pt.y,'class':'dot'});
// 			  }
// 		}
// }

// createSamples(document.getElementById('sampled'),polygonSampledFromPath);

// function pathToPolygon(path,samples){
// 		if (!samples) samples = 0;
// 		var doc = path.ownerDocument;
// 		var poly = doc.createElementNS('http://www.w3.org/2000/svg','polygon');

// 		// Put all path segments in a queue
// 		for (var segs=[],s=path.pathSegList,i=s.numberOfItems-1;i>=0;--i) segs[i] = s.getItem(i);
// 		var segments = segs.concat();

// 		var seg,lastSeg,points=[],x,y;
// 		var addSegmentPoint = function(s){
// 			  if (s.pathSegType == SVGPathSeg.PATHSEG_CLOSEPATH){

// 			  }else{
// 				    if (s.pathSegType%2==1 && s.pathSegType>1){
// 					      // All odd-numbered path types are relative, except PATHSEG_CLOSEPATH (1)
// 					      x+=s.x; y+=s.y;
// 				    }else{
// 					      x=s.x; y=s.y;
// 				    }
// 				    var lastPoint = points[points.length-1];
// 				    if (!lastPoint || x!=lastPoint[0] || y!=lastPoint[1]) points.push([x,y]);
// 			  }
// 		};
// 		for (var d=0,len=path.getTotalLength(),step=len/samples;d<=len;d+=step){
// 			  var seg = segments[path.getPathSegAtLength(d)];
// 			  var pt  = path.getPointAtLength(d);
// 			  if (seg != lastSeg){
// 				    lastSeg = seg;
// 				    while (segs.length && segs[0]!=seg) addSegmentPoint( segs.shift() );
// 			  }
// 			  var lastPoint = points[points.length-1];
// 			  if (!lastPoint || pt.x!=lastPoint[0] || pt.y!=lastPoint[1]) points.push([pt.x,pt.y]);
// 		}
// 		for (var i=0,len=segs.length;i<len;++i) addSegmentPoint(segs[i]);
// 		for (var i=0,len=points.length;i<len;++i) points[i] = points[i].join(',');
// 		poly.setAttribute('points',points.join(' '));
// 		return poly;
// }

// //createSamples(document.getElementById('controlled'),pathToPolygon);
