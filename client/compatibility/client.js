//// Utils
// Converts from degrees to radians.
Math.radians = (degrees) => degrees * Math.PI / 180;
Math.degrees = (radians) => radians * 180 / Math.PI;
var charCode = String.fromCharCode;
var mySVG;


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

function readPointsFromSVG (xml) {
    let svg = xmlToJson(xml).svg;
    let paths = svg.g.path;
    //let paths = svg.path;
    //let n = paths.length;
    console.log(paths);
    // let points = [],
    //     jsonPaths = [];

    // for (let i = 0; i < n; i += 1){
    //     console.log(xmlToJson(paths[i]['@attributes']));
    // }
    //return jsonPaths;
}

//enccode base64
// function de
// var rawStr = 'hello world!';
// var wordArray = CryptoJS.enc.Utf8.parse(rawStr);
// var base64 = CryptoJS.enc.Base64.stringify(wordArray);
// console.log('encrypted:', base64);

// //decode base64
// var parsedWordArray = CryptoJS.enc.Base64.parse(base64);
// var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
// console.log('parsed:',parsedStr);

// Objects

var ui = {
    hidden: false,
    bgColor: 'rgb(255,255,255)',
    visorBackgroundColor: 'rgba(40,0,40,0.8)',
    slideDuration: 1000,
    incrementSpeed: 0.1,
    incrementingP: false
};

var plotter = {
    data: {
        size: 0,
        queue: []
    },
    get: (key) => {
        return Session.get('plotter.' + key);
    },
    set: (key, value) => {
        return Session.set('plotter.' + key, value);
    },
    pushMessage: (message) => {
        let messageQueue = plotter.get('queue');
        messageQueue.push(message);
        plotter.set('messageQueue', messageQueue);
    },
    popMessage: () => {
        let messageQueue = plotter.get('queue');
        plotter.set('messageQueue', messageQueue.pop());
    },
    calibrate: () => {
        setTimeout(() => {
            initialize();
        }, 500);
        setTimeout(() => {
            outputWindow();
        }, 1000);
        setTimeout(() => {
            outputActual();
        }, 1500);
        setTimeout(() => {
            penUp(plotter.get('xMin'), plotter.get('maxHeight') - plotter.get('lineHeight'));
            ui.hidden = false;
            $('#pleaseWait')
                .stop(true, true)
                .fadeOut({ duration: ui.slideDuration, queue: false })
                .slideUp(ui.slideDuration,() => {});
        }, 2000);
    }
};

// Database
var svg = {
    points: new Meteor.Collection(null),
    createRandomPoints: (n) => {
        for(let i = 0; i < n; i += 1){
            svg.points.insert({
                x: Math.floor(Math.random()*Session.get('svg.width')),
                y: Math.floor(Math.random()*Session.get('svg.height'))
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

// Serial Functions
function serialError(err){
    if (err >= 10 && err <= 21){
        plotter.set('error', errorCodeTable[err]);
    }
}

function serialRead(){
    Meteor.call('read', function(err, data){
        //console.log('Error: ' + err + '\n' + 'Data: ' + data);
        plotter.set('buffer', data);
    });
}

function serialWrite(string, callback){
    if (plotter.get('recordingState')){
        let q = plotter.get('messageQueue');
        q.push(string + ';');
        plotter.set('messageQueue', q);
    }
    Meteor.call('write', string + ';', (err, res) => {
        if(err){
            return serialError(err);
        } else {
            setTimeout(serialRead, 500);
            setTimeout(callback, 600);
            return res;
        }
    });
}

function smoothIncrement(variable, finish, step, speed){
    let val = plotter.get(variable);
    let newVal;
    ui.incrementingP = true;
    if (val < finish){
        newVal = plotter.get(variable) + step;
        setTimeout(function (){
            plotter.set(variable, newVal);
            smoothIncrement(variable, finish, step, speed);
        }, speed/100);
    } else if (val > finish){
        newVal = plotter.get(variable) - step;
        setTimeout(function (){
            plotter.set(variable, newVal);
            smoothIncrement(variable, finish, step, speed);
        }, speed/100);
    } else {
        ui.incrementingP = false;
        plotter.set(variable, finish);
    }
}

function bufferedSerialWrite(queue, delay){
    setTimeout(() => {
        if (queue.length > 1) {
            serialWrite(queue[0]);
            queue.shift();
            bufferedSerialWrite(queue, delay);
        } else {
            serialWrite(queue[0]);
            queue.shift();
        }
    }, delay);
}

function bufferedLabel(queue, delay){
    let commandString = "";
    for(let i = 0; i < queue.length; i += 1){
        commandString += 'LB' + queue[i] + plotter.get('terminator') + ';' + 'CP-' + queue[i].length + ',-1;';
    }
    console.log(commandString);
    serialWrite(commandString);
    // setTimeout(() => {
    //     console.log (queue);
    //     if (queue.length > 1)
    //     {
    //         serialWrite('LB' + queue[0] + plotter.get('terminator') + ';' + 'CP-' + queue[0].length + ',-1');
    //         queue.shift();
    //         bufferedSerialWrite(queue, delay);
    //     } else {
    //         serialWrite('LB' + queue[0] + plotter.get('terminator') + ';' + 'CP-' + queue[0].length + ',-1');
    //         queue.shift();
    //     }
    // }, delay);
}

// Maintenance Functions
function initialize(){
    serialWrite('IN');
}

function defaults(){
    serialWrite('DF');
}

// Helper Functions
function setPageHeight(pageWidth, pageHeight){
    plotter.set('pageWidth', pageWidth);
    plotter.set('pageHeight', pageHeight);
}

var plotterErrorCodes = {
    0: '[0] No Error',
    1: '[1] Instruction not recognized.',
    2: '[2] Wrong number of parameters. Not enough parameters have been sent with an instruction.',
    3: '[3] Parameter out of range.',
    4: '[4] Not used.',
    5: '[5] Not used.',
    6: '[6] Position overflow. An attempt to draw a character (LB or UC) or perform a CP that is located outside the plotter\'s numeric range.',
    7: '[7] Polygon buffer or downloadable character buffer overflow.'
};

// Output Functions
function outputError(){
    serialWrite('OE',() => {
        setTimeout(() => {
            let errorCode = plotter.get('buffer')[0];
            if (errorCode >= 0 && errorCode <= 7){
                plotter.set('error', plotterErrorCodes[errorCode]);
            }
        }, 500);
    });
}

function outputStatus(){
    serialWrite('OS', () => {
        setTimeout(() => {
            let status = parseInt(plotter.get('buffer')[0]);
            plotter.set('status', status);
        }, 500);
    });
}

function outputP1AndP2(){
    serialWrite('OP', () => {
        setTimeout(() => {
            let p1 = parseInt(plotter.get('buffer')[0]),
                p2 = parseInt(plotter.get('buffer')[1]);
            plotter.set('p1', p1);
            plotter.set('p2', p2);
        }, 500);
    });
}

function outputActual(){
    serialWrite('OA', () => {
        setTimeout(() => {
            let b = plotter.get('buffer'),
                x = parseInt(b[0]),
                y = parseInt(b[1]),
                p = parseInt(b[2]);

            console.log (x, y, p);
            plotter.set('x', x);
            plotter.set('y', y);
            plotter.set('penState', p);
        }, 500);
    });
}

function outputCommandedPosition(){
    serialWrite('OC', function(){
        setTimeout(function (){
            let b = plotter.get('buffer'),
                x = parseInt(b[0]),
                y = parseInt(b[1]),
                p = parseInt(b[2]);

            plotter.set('x', x);
            plotter.set('y', y);
            plotter.set('penState', p);
        }, 500);
    });
}

function outputWindow(){
    serialWrite('OW', function (){
        let b = plotter.get('buffer'),
            mw = parseInt(b[2]),
            mh = parseInt(b[3]);

        plotter.set('maxWidth', mw);
        plotter.set('maxHeight', mh);
    });
}

// Drawing Functions
function penUp(x, y){
    if (x && y){
        let string = 'PU,' + x + ',' + y;
        plotter.set('x', x);
        plotter.set('y', y);
        serialWrite(string, function () {});
    } else {
        plotter.set('x', x);
        plotter.set('y', y);
        serialWrite('PU', () => {});
    }
}

function penDown(x, y){
    if (x && y){
        let string = 'PD,' + x + ',' + y;
        plotter.set('x', x);
        plotter.set('y', y);
        serialWrite(string, () => {});
    } else {
        plotter.set('x', x);
        plotter.set('y', y);
        serialWrite('PD');
    }
}

function selectPen(penNumber){
    plotter.set('selectedPen', penNumber);
    serialWrite('SP,' + penNumber);
}

function home(){
    switch(plotter.options.homePosition){
        case 'topRight':
            penUp(plotter.get('maxWidth'), plotter.get('maxHeight'));
            break;
        case 'bottomLeft':
            penUp(plotter.get('xMin'), plotter.get('yMin'));
            break;
        case 'topLeft':
            penUp(plotter.get('xMin'), plotter.get('yMin'));
            break;
        case 'bottomRight':
            penUp(plotter.get('xMin'), plotter.get('yMin'));
            break;
        default:
            return 0;
    }
}

function increaseFontWidth (amount){
    let fsw = plotter.get('fontWidth') + amount;
    let fsh = plotter.get('fontHeight');
    plotter.set('fontWidth', fsw);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function decreaseFontWidth (amount){
    let fsw = plotter.get('fontWidth') - amount;
    let fsh = plotter.get('fontHeight');
    plotter.set('fontWidth', fsw);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function increaseFontHeight (amount){
    let fsw = plotter.get('fontWidth');
    let fsh = plotter.get('fontHeight') + amount;
    plotter.set('fontHeight', fsh);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function decreaseFontHeight (amount){
    let fsw = plotter.get('fontWidth');
    let fsh = plotter.get('fontHeight')  - amount;
    plotter.set('fontHeight', fsh);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function rotate(angle){
    if (ui.incrementingP === false){
        let newAngle = plotter.get('textAngle') + angle;
        console.log(newAngle);
        if (newAngle < 0){
            plotter.set('textAngle', 360);
            smoothIncrement('textAngle', 360 + angle, 1, ui.incrementSpeed);
        } else if (newAngle > 360) {
            plotter.set('textAngle', 0);
            smoothIncrement('textAngle', newAngle % 360, 1, ui.incrementSpeed);
            //plotter.set('textAngle', a);
        } else {
            smoothIncrement('textAngle', newAngle, 1, ui.incrementSpeed);
        }
        if (newAngle === 360) {
            setTimeout(function (){
                plotter.set('textAngle', 0);
            }, 400);
        }
        serialWrite('DI' + Math.cos(Math.radians(newAngle)) + ',' + Math.sin(Math.radians(newAngle)));
    }
}

function getData(variable){
    let data = plotter.get(variable);
    if (isNaN(data)){
        return '.....';
    } else if (typeof(data) === 'number'){
        return data;
    } else {
        return '.....';
    }
}

Template.body.helpers({
    points: () => svg.points.find({}),
    xValue: () => getData('x'),
    yValue: () => getData ('y'),
    getPlotterPosition: () => '(' + getData('x') + ' , ' + getData('y') + ')',
    getPlotterDimensions: () => '[' + getData('maxWidth') + ' x ' + getData('maxHeight') + ']',
    getPageDimensions: () => '[' + getData('pageWidth') + ' x ' + getData('pageHeight') + ']',
    getPageHeight: () => getData('pageHeight'),
    getHeight: () => getData('maxHeight'),
    getWidth: () => getData('maxWidth'),
    getPenState: () => getData('penState'),
    getSelectedPen: () => getData('selectedPen'),
    getFontDimensions: () => Math.round(plotter.get('fontWidth') * 100) + 'x' + Math.round(plotter.get('fontHeight') * 100),
    getTextAngle: () => getData('textAngle'),
    getRecordingState: () => getData('recordingState'),
    getErrorCode: () => {
        let error = plotter.get('error');
        if(error) {
            return error;
        } else {
            return 'no errors';
        }
    },
    getColor: (data) =>  {
        if(data === '.....'){
            return 'red';
        } else {
            return '#00ff60';
        }
    },
    getErrorColor: () => {
        if(plotter.get('error') > 0){
            return 'red';
        } else {
            return '#00ff60';
        }
    },
    getMessageQueue: () => {
        return plotter.get('messageQueue').length;
    },
    getSpacing: () => {
        return '[' + plotter.get ('horizontalCharacterSpacing') + ',' + plotter.get('verticalCharacterSpacing') + ']';
    },
    randomX: () => Math.random() * document.width,
    randomY: () => Math.random() * document.height
});

var cursor = {
    x: 0,
    y: 0,
    up: (spaces) => {
        let height = (plotter.get('lineHeight') * spaces);
        let newY = plotter.get('y') + height + (plotter.get('verticalCharacterSpacing') * spaces);
        if (newY < plotter.get('maxHeight')){
            cursor.y += spaces;
            plotter.set('y', newY);
            serialWrite('CP,0,' + spaces);
        }
    },
    left: (spaces) => {
        let width = (plotter.get('charWidth') * spaces);
        let newX = plotter.get('x') - (width + (plotter.get('horizontalCharacterSpacing')  * spaces));
        if (newX >= plotter.get('xMin')){
            cursor.x -= spaces;
            plotter.set('x', newX);
            serialWrite('CP,-' + spaces + ',0');
        }
    },
    right: (spaces) => {
        let width = (plotter.get('charWidth') * spaces);
        let newX = plotter.get('x') + (width + (plotter.get('horizontalCharacterSpacing')  * spaces));
        if (newX < plotter.get('maxWidth')){
            cursor.x += spaces;
            plotter.set('x', newX);
            serialWrite('CP,' + spaces + ',0');
        }
    },
    down: (spaces) => {
        let height = (plotter.get('lineHeight') + plotter.get('verticalCharacterSpacing')) * spaces;
        let newY = plotter.get('y') - height;
        if(newY > plotter.get('yMin')){
            cursor.y -= spaces;
            plotter.set('y', newY);
            serialWrite('CP,0,-' + spaces);
        }
    }
};

function newLine(){
    cursor.down(1);
    if (plotter.get('x') > plotter.get('xMin')){
        penUp(plotter.get('returnPoint'), plotter.get('y'));
    }
}

var altKeydownTable = {
    37: () => rotate(-45),     // Left Arrow
    39: () => rotate(45)       // Right Arrow
};

var shiftedKeydownTable = {
    16: () => 0, // Shift Key
    37: () => cursor.left(5),  // Shifted Left Arrow
    38: () => cursor.up(5),    // Shifted Up Arrow
    39: () => cursor.right(5), // Shifted Right Arrow
    40: () => cursor.down(5)   // Shifted Down Arrow
};

function togglePen(){
    if(plotter.get('penState') === 0) {
        plotter.set ('penState', 1);
        penDown(plotter.get('x'),plotter.get('y'));
    } else {
        plotter.set ('penState', 0);
        penUp(plotter.get('x'),plotter.get('y'));
    }
}

function toggleRecording(){
    if(plotter.get('recordingState') === 0) {
        plotter.set ('recordingState', 1);
    } else {
        plotter.set ('recordingState', 0);
    }
}

var controlKeyTable = {
    13: () => plotter.set('returnPoint', plotter.get('x')),
    17: undefined,
    32: () => {
        togglePen();
    },
    0: () => 0
};

function toggleVisor () {
    if(ui.hidden){
        $('#cursorValue')
            .stop(true, true)
            .fadeIn({ duration: ui.slideDuration, queue: false });
        //.css('display', 'none');
        //.slideDown(ui.slideDuration);
        ui.hidden = false;
    } else {
        $('#cursorValue')
            .stop(true, true)
            .fadeOut({ duration: ui.slideDuration, queue: false });
        //.slideUp(ui.slideDuration);
        ui.hidden = true;
    }
}

var metaKeyTable = {
    27: () => selectPen(0),
    37: () => decreaseFontWidth(0.05),
    38: () => increaseFontHeight(0.05),
    39: () => increaseFontWidth(0.05),
    40: () => decreaseFontHeight(0.05)
};

var keydownTable = {
    9: () => cursor.right(5), // Tab Key
    13: () => newLine(),  // Enter Key
    16: () => 0, // ignore shift key
    18: () => 0, // Alt Key
    27: () => selectPen(0), // Escape Key
    37: () => cursor.left(1),  // Left Arrow
    38: () => cursor.up(1),    // Up Arrow
    39: () => cursor.right(1), // Right Arrow
    40: () => cursor.down(1), // Down Arrow
    112: () => selectPen(1), // F1
    113: () => selectPen(2), // F2
    114: () => selectPen(3), // F3
    115: () => selectPen(4), // F4
    116: () => selectPen(5), // F5
    117: () => selectPen(6), // F6
    118: () => selectPen(7), // F7
    119: () => selectPen(8), // F8
    120: () => togglePen(), // F9
    121: () => toggleRecording(), // F10
    122: () => saveMessagesToFile(),    // F11
    123: () => toggleVisor()
};

function saveMessagesToFile (){
    Meteor.call('saveMessagesToFile', plotter.get('messageQueue').join(';\n') + ';');
};

function handleKeydown (e){
    if(e.shiftKey){
        if (shiftedKeydownTable.hasOwnProperty(e.keyCode)){
            shiftedKeydownTable[e.keyCode]();
        }
    } else if(e.metaKey) {
        e.preventDefault();
        if (metaKeyTable.hasOwnProperty(e.keyCode)){
            metaKeyTable[e.keyCode]();
        }
    } else if(e.ctrlKey) {
        e.preventDefault();
        if (controlKeyTable.hasOwnProperty(e.keyCode)){
            controlKeyTable[e.keyCode]();
        }
    } else if(e.altKey) {
        e.preventDefault();
        if (altKeydownTable.hasOwnProperty(e.keyCode)){
            altKeydownTable[e.keyCode]();
        }
    } else {
        if (keydownTable.hasOwnProperty(e.keyCode)){
            keydownTable[e.keyCode]();
        }
    }
}

function onDrop(e) {
    let reader = new FileReader();
    let f = e.originalEvent.dataTransfer.files[0];
    let extension = f.name.split('.').pop().toLowerCase();

    reader.onload = (e) => {
        if (extension === 'hpgl'){
            bufferedSerialWrite(e.target.result.split(';'),100);
        } else if (extension === 'txt'){
            let lines = e.target.result.split('\n');
            bufferedLabel(lines, 500);
            //serialWrite('LB' + e.target.result + plotter.get('terminator'));
        } else if (extension === 'svg') {
            mySVG = $.parseXML(e.target.result);
        } else {
            console.log(e);
        }
    };
    if (extension === 'hpgl' || extension === 'txt' || extension === 'svg'){
        reader.readAsText(f);
    } else {
        reader.readAsDataURL(f);
    }
}

Template.body.events({
    'click': function () {
        svg.points.find({}).forEach((point) => {
            svg.points.update(
                {_id: point._id}, {
                    $set: {
                        x: Math.floor(Math.random()*Session.get('svg.width')),
                        y: Math.floor(Math.random()*Session.get('svg.height'))
                    }
                });
        });
    },
    'keydown': (e) => {
        //if (keydownTable.hasOwnProperty(e.keyCode)){
        handleKeydown(e);
        //e.preventDefault();
        // }
    },
    'keypress': (e) => {
        //e.preventDefault();
        //e.preventDefault();
        if (e.keyCode !== 27){
            if (e.keyCode === 8){
                if (plotter.get('x') > plotter.get('xMin')){
                    plotter.set('x', plotter.get('x') + plotter.get('charWidth') + plotter.get('horizontalCharacterSpacing'));
                    let hpgl = 'LB' + charCode(e.charCode) + plotter.get('terminator');
                    serialWrite(hpgl);
                    plotter.set('code', plotter.get('code') + hpgl + plotter.get('terminator') + ';');
                }
            } else if (e.keyCode === 13){
                plotter.set('x', plotter.get('xMin'));
            } else {
                plotter.set('x', plotter.get('x') + plotter.get('charWidth') + plotter.get('horizontalCharacterSpacing'));
                let hpgl = 'LB' + charCode(e.charCode) + plotter.get('terminator');
                serialWrite(hpgl);
                plotter.set('code', plotter.get('code') + hpgl + plotter.get('terminator') + ';');
            }
        }
    },
    'keyup': (e) => {
        if(e.ctrlKey) {
            //e.preventDefault();
            controlKeyTable[e.charCode]();
        } else {
            //outputActual();
        }
    },
    'drop': (e) => {
        e.preventDefault();
        //e.stopPropagation();
        e.originalEvent.dataTransfer.dropEffect = 'copy';
        //let data = e.originalEvent;
        //console.log(e.originalEvent.dataTransfer);
        //console.log(data);
        onDrop(e);
        //dropEventHandler(e);
    },
    'dragover': (e) => {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'copy';
        //e.stopPropagation();
        //console.log(e.originalEvent.dataTransfer);
    }
});

// $('body').bind( 'drop', function(event){
//     console.log(event.originalEvent.dataTransfer);
//     event.preventDefault();
//     event.stopPropagation();
//     return false;
// });
// $('body').bind( 'dragover', function(event){
//     console.log(event.originalEvent.dataTransfer);
//     event.preventDefault();
//     event.stopPropagation();
//     return false;
// });

Meteor.startup(() => {
    plotter.options = {
        'svg.width': $(document).innerWidth(),
        'svg.height': $(document).innerHeight(),
        'plotter.messageQueue': [],
        'plotter.buffer': [],
        'plotter.status': 0,
        'plotter.fontWidth': 0.8,
        'plotter.fontHeight': 1.6,
        'plotter.error': 0,
        'plotter.pageWidth': 11,
        'plotter.pageHeight': 17,
        'plotter.maxWidth': 16000,
        'plotter.maxHeight': 11000,
        'plotter.charWidth': 171,
        'plotter.lineHeight': 300,
        'plotter.verticalCharacterSpacing': 0,
        'plotter.horizontalCharacterSpacing': 0,
        'plotter.xMin': 1000,
        'plotter.yMin': 1000,
        'plotter.returnPoint': 1000,
        'plotter.p1': 0,
        'plotter.p2': 0,
        'plotter.x':  1000,
        'plotter.y':  9700,
        'plotter.textAngle': 0,
        'plotter.recordingState': 1,
        'plotter.penState': 0,
        'plotter.selectedPen': 0,
        'plotter.terminator': String.fromCharCode(3),
        'plotter.escape': String.fromCharCode(27),
        'plotter.homePosition': 'topLeft',
        'plotter.debug': true
    };
    Session.setDefault(plotter.options);
    svg.setupCanvas(Session.get('svg.width'),Session.get('svg.height'));
    //svg.createRandomPoints(100);
    plotter.calibrate();
});
