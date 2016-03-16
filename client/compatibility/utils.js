// Changes XML to JSON
function xmlToJson(xml) {
    // Create the return object
    var obj = {};

    if (xml.nodeType === 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj['@attributes'] = {};
            for (var j = 0; j < xml.attributes.length; j += 1) {
                var attribute = xml.attributes.item(j);
                obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType === 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i += 1) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof(obj[nodeName]) === 'undefined') {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof(obj[nodeName].push) === 'undefined') {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}

// Convert Plotter Units to Millimeters
function pu2mm(pu){
    return pu/40;
}

// Convert Millimeters to Plotter Units
function mm2pu(pu){
    return pu*40;
}

// Convert Plotter Units to Inches
function pu2in(pu){
    return pu/1016;
}

// Convert Inches to Plotter Units
function in2pu (pu){
    return pu*1016;
}


function replaceLetterAtIndex(string, index, replacementLetter){
    newString = '';
    for(let i = 0; i < string.length; i += 1){
        if(i === index){
            newString += replacementLetter;
        } else {
            newString += string[i];
        }
    }
    return newString;
}

function toggle(variable){
    plotter.set(S(variable).s, !plotter.get(S(variable).s));
}

//enccode base64
// function de
// var rawStr = 'plotters!';
// var wordArray = CryptoJS.enc.Utf8.parse(rawStr);
// var base64 = CryptoJS.enc.Base64.stringify(wordArray);
// console.log('encrypted:', base64);

// //decode base64
// var parsedWordArray = CryptoJS.enc.Base64.parse(base64);
// var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
// console.log('parsed:',parsedStr);

// Objects
