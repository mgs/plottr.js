var pMin = -2^15+1;
var pMax = 2^15-1;

function scaleHPGL(hpgl, scale){
	  _.map(parseHPGL(hpgl), function(e) {
		    let cmd = e.slice(0,2);
		    let arr = _.map(e.slice(2,-1).split(','), (n) => n * scale);
        return(cmd + arr + ';');
	  });
}

function parseHPGL(string){
    let hpglCommaString = string.replace(/;/gi, ';@');
    let hpgl = hpglCommaString.split('@');

    return hpgl.filter(function(el) {
        return el.length !== 0;
    });
}

function strikeOutLastCharacter(){
    return('PU;CP,0.0,0.2;PD;CP,-1,0;PU;CP,0,-0.2;');
}

function checkParams(paramsArray){
    if(paramsArray.length === _.filter(paramsArray, function(arr){
        return(arr[1] < arr[0] && arr[0] < arr[2]);
    }).length){
        return true;
    } else {
        return false;
    }
}

function p$(code, paramsArray){
    if(paramsArray){
        return code + ',' + paramsArray.join(',') + ';';
    } else {
        return code + ';';
    }
}

function arcAbsolute (centerX, centerY, angle, resolution){
    if(resolution){
        return p$('AA', [centerY, centerY, angle, resolution]);
    } else {
        return p$('AA', [centerY, centerY, angle, 5]);
    }
}

function arcRelative () {
    if(resolution){
        return p$('AR', [centerY, centerY, angle, resolution]);
    } else {
        return p$('AR', [centerY, centerY, angle, 5]);
    }
}

function circle (radius, resolution) {
    if(resolution){
        return p$('CI', [radius, resolution]);
    } else {
        return p$('CI', [radius, 5]);
    }
}

function chordTolerance () {
    return 'CT';
}

function plotAbsolute (x, y, pointList) {
    if(x && y){
        if(pointList){
            params = x.toString() + ',' + y.toString() + ',' + pointList.join(',');
            return p$('PA', params.split(','));
        } else {
            params = x.toString() + ',' + y.toString();
            return p$('PA', params.split(','));
        } 
    } else {
        return p$('PA');
    }
}

function penUp (x, y, pointList) {
    if(x && y){
        if(pointList){
            plotter.set('x', pointList[pointList.length-1][0]);
            plotter.set('y', pointList[pointList.length-1][1]);
            params = x.toString() + ',' + y.toString() + ',' + pointList.join(',');
            return p$('PU', params.split(','));
        } else {
            plotter.set('x', x);
            plotter.set('y', y);
            params = x.toString() + ',' + y.toString();
            return p$('PU', params.split(','));
        } 
    } else {
        return p$('PU');
    }
}

function penDown (x, y, pointList) {
    if(x && y){
        if(pointList){
            plotter.set('x', pointList[pointList.length-1][0]);
            plotter.set('y', pointList[pointList.length-1][1]);
            params = x.toString() + ',' + y.toString() + ',' + pointList.join(',');
            return p$('PD', params.split(','));
        } else {
            plotter.set('x', x);
            plotter.set('y', y);
            params = x.toString() + ',' + y.toString();
            return p$('PD', params.split(','));
        } 
    } else {
        return p$('PD');
    }
}

function plotRelative (x, y, pointList) {
    if(x && y){
        if(pointList){
            params = x.toString() + ',' + y.toString() + ',' + pointList.join(',');
            return p$('PR', params.split(','));
        } else {
            params = x.toString() + ',' + y.toString();
            return p$('PR', params.split(','));
        }
    } else {
        return p$('PR');
    }
}

function edgePolygon () {
    return 'EP';
}

function fillPolygon () {
    return 'FP';
}

function fillType (type, spacing, angle) {
    return p$('FT', type, spacing, angle);
}

function penThickness () {
    return 'PT';
}

function polygonMode () {
    return 'PM';
}

function shadeRectangleAbsolute () {
    return 'RA';
}

function shadeRectangleRelative () {
    return 'RR';
}

function edgeRectangleRelative (x, y) {
    return p$('ER', [x,y]);
}

function edgeRectangleAbsolute (x, y) {
    return p$('EA', [x,y]);
}

function shadeWedge () {
    return 'WG';
}

function edgeWedge (radius, startingAngle, centerAngle, resolution) {
     p$('EW',[radius, startingAngle, centerAngle, resolution]);
}

function userDefinedFillType () {
    return 'UF';
}

var vectorGroup = {
    AA: arcAbsolute,
    AR: arcRelative,
    CI: circle,
    CT: chordTolerance,
    PA: plotAbsolute,
    PU: penUp,
    PD: penDown,
    PR: plotRelative,
    EP: edgePolygon,
    FP: fillPolygon,
    FT: fillType,
    PT: penThickness,
    PM: polygonMode,
    RA: shadeRectangleAbsolute,
    RR: shadeRectangleRelative,
    EA: edgeRectangleAbsolute,
    ER: edgeRectangleRelative,
    WG: shadeWedge,
    EW: edgeWedge,
    UF: userDefinedFillType
};

function bufferedLabelString () {
    return 'BL';
}
function designateAlternateCharacterSet () {
    return 'CA';
}
function characterChordAngle () {
    return 'CC';
}
function characterSelectionMode () {
    return 'CM';
}
function characterPlot (x, y) {
     p$('CP',[x, y]);
}
function designateStandardCharacterSet () {
    return 'CS';
}
function absoluteDirection () {
    return 'DI';
}
function defineDownloadableCharacter () {
    return 'DL';
}
function relativeDirectionCharacterSet () {
    return 'DR';
}
function designateCharacterSetIntoSlot () {
    return 'DS';
}
function defineTerminator () {
    return 'DT';
}
function verticalLabelDirection () {
    return 'DV';
}
function extraSpace () {
    return 'ES';
}
function invokeCharacterSlot () {
    return 'IV';
}
function label () {
    return 'LB';
}
function labelOrigin () {
    return 'LO';
}
function outputLabelLength () {
    return 'OL';
}
function printBufferedLabel () {
    return 'PB';
}
function selectAlternateSet () {
    return 'SA';
}
function absoluteCharacterSize () {
    return 'SI';
}
function characterSlant () {
    return 'SL';
}
function relativeCharacterSize () {
    return 'SR';
}
function selectStandardSet () {
    return 'SS';
}
function userDefinedCharacter () {
    return 'UC';
}
function kanji () {
    return 'KB';
}

var characterGroup = {
    BL: bufferedLabelString,
    CA: designateAlternateCharacterSet,
    CC: characterChordAngle,
    CM: characterSelectionMode,
    CP: characterPlot,
    CS: designateStandardCharacterSet,
    DI: absoluteDirection,
    DL: defineDownloadableCharacter,
    DR: relativeDirectionCharacterSet,
    DS: designateCharacterSetIntoSlot,
    DT: defineTerminator,
    DV: verticalLabelDirection,
    ES: extraSpace,
    IV: invokeCharacterSlot,
    LB: label,
    LO: labelOrigin,
    OL: outputLabelLength,
    PB: printBufferedLabel,
    SA: selectAlternateSet,
    SI: absoluteCharacterSize,
    SL: characterSlant,
    SR: relativeCharacterSize,
    SS: selectStandardSet,
    UC: userDefinedCharacter,
    KB: kanji
};

function lineType (patternNumber, pitchLength) {
    if(pitchLength){
        p$('LT',[patternNumber, pitchLength]);
    } else {
        p$('LT',[patternNumber, 4]);
    }
}

function symbolMode (symbolNumber) {
     p$('SM',[symbolNumber]);
}

function selectPen (penNumber) {
    if(0 < penNumber < 9) {
        return p$('SP', [penNumber]);
    } else {
        return 'Cannot Grab Pen Due To Invalid Pen Number';
    }
}

// 'AS';
// function accelerationSelect () {
// }

// 'VS';
// function velocitySelect () {
// }

// 'FS';
// function forceSelect () {
// }

// 'FC';
// function cutterOffset () {
// }

// 'FD';
// function bladeRotationControl () {
// }

var lineTypeGroup = {
    LT: lineType,
    SM: symbolMode,
    SP: selectPen
    // AS: accelerationSelect,
    // VS: velocitySelect,
    // FS: forceSelect,
    // FC: cutterOffset,
    // FD: bladeRotationControl
};

function digitizeClear () {
    return p$('DC');
}

function digitizePoint () {
    return p$('DP');
}

function outputDigitizedPointAndPenStatus () {
    return p$('OD');
}

var digitizeGroup = {
    DC: digitizeClear,
    DP: digitizePoint,
    OD: outputDigitizedPointAndPenStatus
};

function tickLength (tickLengthPositiveDirection, tickLengthNegativeDirection) {
    return p$('TL', [tickLengthPositiveDirection, tickLengthNegativeDirection]);
}

function xTick () {
    return p$('XT');
}

function yTick () {
    return p$('YT');
}

var axisGroup = {
    TL: tickLength,
    XT: xTick,
    YT: yTick
};

function inputP1AndP2 (p1x, p1y, p2x, p2y) {
    if(p2x && p2y){
        return p$('IP', [p1x, p1y, p2x, p2y]);
    } else if (p1x && p1y) {
        return p$('IP', [p1x, p1y]);
    } else {
        return 'Must enter at least two parameters.';
    }
}

function outputP1AndP2 () {
    p$('OP');
}

function scale (x1, y1, x2, y2) {
    return p$('SC', [x1, y1, x2, y2]);
}

function outputWindow () {
    return p$('OW');
}

var setupGroup = {
    IP: inputP1AndP2,
    OP: outputP1AndP2,
    SC: scale,
    OW: outputWindow
};

function defaults () {
    p$('DF');
}

function inputMask () {
    return 'IM';
}

function initialize () {
    p$('IN');
}

function outputActualPositionAndPenStatus () {
    p$('OA');
}

function outputCommandedPositionAndPenStatus () {
    p$('OC');
}

function outputError () {
    p$('OE');
}

function outputFactor () {
    p$('OF');
}

function outputHardClipLimits () {
    p$('OH');
}

function outputIdentification () {
    p$('OI');
}

function outputOption () {
    p$('OO');
}

function outputStatus () {
    p$('OS');
}

// function outputTurretType () {
//     p$('OT');
// }

function graphicsMemory () {
    p$('GM');
}

var configurationAndStatusGroup = {
    DF: defaults,
    IM: inputMask,
    IN: initialize,
    OA: outputActualPositionAndPenStatus,
    OC: outputCommandedPositionAndPenStatus,
    OE: outputError,
    OF: outputFactor,
    OH: outputHardClipLimits,
    OI: outputIdentification,
    OO: outputOption,
    OS: outputStatus,
    // OT: outputTurretType,
    GM: graphicsMemory
};

function pageSet () {
    return 'PG';
}

function automaticPenOperation () {
    return 'AP';
}

function notReady () {
    return 'NR';
}

function rotateCoordinateSystem () {
    return 'RO';
}

function advanceFullPage () {
    return 'AF';
}

function advanceHalfPage () {
    return 'AH';
}

function pageFeed () {
    return 'PF';
}

var paperAdvanceGroup = {
    PG: pageSet,
    AP: automaticPenOperation,
    NR: notReady,
    RO: rotateCoordinateSystem,
    AF: advanceFullPage,
    AH: advanceHalfPage,
    PF: pageFeed
};

var utils = {
    parseHpglString: () => {

    }
};

var HPGL = jQuery.extend(vectorGroup,
                         characterGroup,
                         lineTypeGroup,
                         digitizeGroup,
                         axisGroup,
                         setupGroup,
                         configurationAndStatusGroup,
                         paperAdvanceGroup,
                         utils);
