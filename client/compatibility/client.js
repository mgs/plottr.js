// Databases
Plottr = new Meteor.Collection('Plottr');

//// Utils
// Converts from degrees to radians.
Math.radians = (degrees) => degrees * Math.PI / 180;
Math.degrees = (radians) => radians * 180 / Math.PI;
var charCode = String.fromCharCode;
var mySVG;

function generateStringFromChars(length, stringOfPossibleCharacters) {
    var text = '';
    for(var i=0; i < length; i += 1) {
        text += stringOfPossibleCharacters.charAt(Math.floor(Math.random() * stringOfPossibleCharacters.length));
	  }
    return text;
}

function readPointsFromSVG (xml) {
    let svg = $.parseXML(xml);
    //let paths = svg.g.path;
    //let paths = svg.path;
    //let n = paths.length;
    console.log(svg);
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

ui = {
    hidden: false,
    bgColor: 'rgb(255,255,255)',
    visorBackgroundColor: 'rgba(40,0,40,0.8)',
    slideDuration: 1000,
    incrementSpeed: 0.1,
    incrementingP: false
};

plotter = {
    lines: [''],
    maxLines: 11700/300,
    currentLine: 0,
    currentChar: 0,
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
    write: (string) => {
        serialWrite('LB' + string + plotter.get('terminator'));
    },
    plot: (commandString) => {
        serialWrite(commandString);
    },
    calibrate: () => {
        initialize();
        setTimeout(() => {
            outputWindow();
        }, 1000);
        // setTimeout(() => {
        //     outputActual();
        // }, 1500);
        setTimeout(() => {
            serialWrite(penUp(plotter.get('xMin'), plotter.get('maxHeight')));
            ui.hidden = false;
            $('#pleaseWait')
                .stop(true, true)
                .fadeOut({ duration: ui.slideDuration, queue: false })
                .slideUp(ui.slideDuration,() => {});
        }, 2000);
    }
};

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
    return('OE;');
    // serialWrite('OE',() => {
    //     // setTimeout(() => {
    //     //     let errorCode = plotter.get('buffer')[0];
    //     //     if (errorCode >= 0 && errorCode <= 7){
    //     //         plotter.set('error', plotterErrorCodes[errorCode]);
    //     //     }
    // }, 500);
    //});
}

function outputStatus(){
    return('OS;');
    // serialWrite('OS', () => {
    //     // setTimeout(() => {
    //     //     let status = parseInt(plotter.get('buffer')[0]);
    //     //     plotter.set('status', status);
    //     // }, 500);
    // });
}

function outputP1AndP2(){
    return('OP;');
    // serialWrite
    // ('OP', () => {
    //     // setTimeout(() => {
    //     //     let p1 = parseInt(plotter.get('buffer')[0]),
    //     //         p2 = parseInt(plotter.get('buffer')[1]);
    //     //     plotter.set('p1', p1);
    //     //     plotter.set('p2', p2);
    //     // }, 500);
    // });
}

function outputActual(){
    return('OA;');
    //serialWrite('OA', () => {
    // setTimeout(() => {
    //     let b = plotter.get('buffer'),
    //         x = parseInt(b[0]),
    //         y = parseInt(b[1]),
    //         p = parseInt(b[2]);

    //     console.log (x, y, p);
    //     plotter.set('x', x);
    //     plotter.set('y', y);
    //     plotter.set('penState', p);
    // }, 500);
    //});
}

function outputCommandedPosition(){
    return('OC');
    // serialWrite('OC', function(){
    //     // setTimeout(function (){
    //     //     let b = plotter.get('buffer'),
    //     //         x = parseInt(b[0]),
    //     //         y = parseInt(b[1]),
    //     //         p = parseInt(b[2]);

    //     //     plotter.set('x', x);
    //     //     plotter.set('y', y);
    //     //     plotter.set('penState', p);
    //     // }, 500);
    // });
}

function outputWindow(){
    return('OW;');
    // serialWrite('OW', function (){
    //     // setTimeout(function (){
    //     // let b = plotter.get('buffer'),
    //     //     mw = parseInt(b[2]),
    //     //     mh = parseInt(b[3]);

    //     // plotter.set('maxWidth', mw);
    //     // plotter.set('maxHeight', mh);
    //     // }, 500);
    // });
}

// Drawing Functions
// function penUp(x, y){
//     if(x && y){
//         return('PU,' + x + ',' + y + ';');
//     } else {
//         return('PU;');
//     }
// }

// function penDown(x, y){
//     if(x && y){
//         return('PD,' + x + ',' + y + ';');
//     } else {
//         return('PD;');
//     }
// }

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
        //console.log(newAngle);
        // if (newAngle < 0){
        //     plotter.set('textAngle', 360);
        //     smoothIncrement('textAngle', 360 + angle, 1, ui.incrementSpeed);
        // } else 
        if (Math.abs(newAngle) === 360) {
            plotter.set('textAngle', 0);
        } else if (newAngle > 360) {
            //plotter.set('textAngle', 0);
            //smoothIncrement('textAngle', newAngle % 360, 1, ui.incrementSpeed);
            plotter.set('textAngle', newAngle);
        } else {
            plotter.set('textAngle', newAngle);
            //smoothIncrement('textAngle', newAngle, 1, ui.incrementSpeed);
        }
        if(newAngle > 0){
            serialWrite('DI' + Math.cos(Math.radians(newAngle)) + ',' + Math.sin(Math.radians(newAngle)));
        } else {
            newAngle = 360 - Math.abs(newAngle);
            serialWrite('DI' + Math.cos(Math.radians(newAngle)) + ',' + Math.sin(Math.radians(newAngle)));
        }
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
    addPadding: (n) => {
        let string = '';
        for(let i = 0; i < n; i += 1){
            string += '&nbsp;';
        }
        return string;
    },
    getPlotterPosition: () => getData('x') + ' , ' + getData('y'),
    getPlotterDimensions: () => getData('maxWidth') + ' x ' + getData('maxHeight'),
    getPageDimensions: () => getData('pageWidth') + ' x ' + getData('pageHeight'),
    getPageHeight: () => getData('pageHeight'),
    getPageWidth: () => getData('pageWidth'),
    getHeight: () => getData('maxHeight'),
    getWidth: () => getData('maxWidth'),
    getPenState: () => {
        if(plotter.get('penState') === 1){
            return('DOWN');
        } else {
            return('UP');
        }
    },
    getSelectedPen: () => getData('selectedPen'),
    getAngleVector: () => {
        let angleTable = {
            0:   '→',
            45:  '↘',
            90:  '↓',
            135: '↙',
            180: '←',
            225: '↖',
            270: '↑',
            315: '↗',
            360: '→',
            '-45':  '↗',
            '-90':  '↑',
            '-135': '↖',
            '-180': '←',
            '-225': '↙',
            '-270': '↓',
            '-315': '↘',
            '-360': '→'
        };

        return angleTable[plotter.get('textAngle')];
    },
    getFontDimensions: () => Math.round(plotter.get('fontWidth') * 100) + 'x' + Math.round(plotter.get('fontHeight') * 100),
    getTextAngle: () => getData('textAngle'),
    getRecordingState: () => {
        if(plotter.get('recordingState') === 1){
           return('TRUE');
        } else {
            return('FALSE');
        }
    },
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
            return '#FF0000';
        } else {
            return '#FFFFFF';
        }
    },
    getErrorColor: () => {
        if(plotter.get('error') > 0){
            return 'red';
        } else {
            return '#00ff00';
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
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') + height;
        if(newY <= plotter.get('maxHeight')){
            cursor.y += spaces;
            plotter.set('y', newY);
            serialWrite('CP,0,' + spaces);
        }
        plotter.currentLine -= 1;
    },
    left: (spaces) => {
        let width = plotter.get('charWidth') * spaces;
        let newX = plotter.get('x') - (width);
        if(newX >= plotter.get('xMin')){
            cursor.x -= spaces;
            plotter.set('x', newX);
            serialWrite('CP,-' + spaces + ',0');
        }
        plotter.currentChar -= 1;
    },
    right: (spaces) => {
        let width = plotter.get('charWidth') * spaces;
        let newX = plotter.get('x') + width;
        if(newX <= plotter.get('maxWidth')){
            cursor.x += spaces;
            plotter.set('x', newX);
            serialWrite('CP,' + spaces + ',0');
        }
        plotter.currentChar += 1;
    },
    down: (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') - height;
        if(newY >= plotter.get('yMin')){
            cursor.y -= spaces;
            plotter.set('y', newY);
            serialWrite('CP,0,-' + spaces);
        }
        // if(plotter.lines[plotter.currentLine+1]){
        //     plotter.lines[plotter.currentLine+1] = '';
        // }
        plotter.currentLine += 1;
    }
};

function newLine(){
    cursor.down(1);
    if (plotter.get('x') > plotter.get('xMin')){
        plotter.plot(penUp(plotter.get('xMin'), plotter.get('y')));
    }
}

function togglePen(){
    if(plotter.get('penState') === 0) {
        plotter.set ('penState', 1);
        return(penDown(plotter.get('x'),plotter.get('y')));
    } else {
        plotter.set ('penState', 0);
        return(penUp(plotter.get('x'),plotter.get('y')));
    }
}

function toggleRecording(){
    if(plotter.get('recordingState') === 0) {
        plotter.set ('recordingState', 1);
    } else {
        plotter.set ('recordingState', 0);
    }
}

// var ui = {
//     toggleVisor()
// }

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

// var Keyboard = {
//     keydown: keydownTable,
//     alt: altKeydownTable,
//     shift: shiftedKeydownTable,
//     meta: metaKeyTable,
//     control: controlKeyTable
// };

var altKeydownTable = {
    'left': () => rotate(-45),     // Left Arrow
    'right': () => rotate(45)       // Right Arrow
};

var shiftedKeydownTable = {
    'shift': () => 0,
    'left': () => cursor.left(5),
    'up': () => cursor.up(5),
    'right': () => cursor.right(5),
    'down': () => cursor.down(5),
    'tab': () => cursor.left(5)
};

var metaKeyTable = {
    'escape': () => selectPen(0),
    'left': () => decreaseFontWidth(0.05),
    'up': () => increaseFontHeight(0.05),
    'right': () => increaseFontWidth(0.05),
    'down': () => decreaseFontHeight(0.05)
};

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

var controlKeyTable = {
    'control': () => 0, // ignore control key
    'enter': () => plotter.set('xMin', plotter.get('x')),
    'space': () => plotter.plot(togglePen()),
    'backspace': () => plotter.plot(strikeOutLastCharacter()),
    0: () => 0
};

var keydownTable = {
    'shift': () => 0,
    'alt': () => 0,
    'control': () => 0,
    'meta': () => 0,
    'tab': () => cursor.right(5),
    'enter': () => newLine(),
    'escape': () => selectPen(0),
    'left': () => cursor.left(1),
    'up': () => cursor.up(1),
    'right': () => cursor.right(1),
    'down': () => cursor.down(1),
    'backspace': () => cursor.left(1),
    'space': () => cursor.right(1),
    'F1': () => selectPen(1),
    'F2': () => selectPen(2),
    'F3': () => selectPen(3),
    'F4': () => selectPen(4),
    'F5': () => selectPen(5),
    'F6': () => selectPen(6),
    'F7': () => selectPen(7),
    'F8': () => selectPen(8),
    'F9': () => plotter.plot(togglePen()),
    'F10': () => toggleRecording(),
    'F11': () => saveMessagesToFile(),
    'F12': () => toggleVisor()
};

function saveMessagesToFile (){
    Meteor.call('saveMessagesToFile', plotter.get('messageQueue').join(';\n') + ';');
};

function onKeydown (e){
    if (keyTable.hasOwnProperty(e.keyCode)){
        let name = keyTable[e.keyCode];
        if(e.shiftKey && shiftedKeydownTable.hasOwnProperty(name)){
            shiftedKeydownTable[name]();
            e.preventDefault();
        } else if(e.metaKey && metaKeyTable.hasOwnProperty(name)) {
            metaKeyTable[name]();
            e.preventDefault();
        } else if(e.ctrlKey && controlKeyTable.hasOwnProperty(name)) {
            controlKeyTable[name]();
            e.preventDefault();
        } else if(e.altKey && altKeydownTable.hasOwnProperty(name)) {
            altKeydownTable[name]();
            e.preventDefault();
        } else {
            console.log(name);
            if(keydownTable.hasOwnProperty(name)){
                keydownTable[name]();
            }
            e.preventDefault();
        }
    }
}

function onKeypress (e) {
    //e.preventDefault();
    if (chrTable.hasOwnProperty(e.charCode)){
        let letter = chrTable[e.charCode];
        if (letter === '`' && e.metaKey){
            
        } else {
            if(plotter.get('xMin') <=  plotter.get('x') <= plotter.get('maxWidth')){
                plotter.set('x', plotter.get('x') + plotter.get('charWidth'));

                let hpgl = 'LB' + letter + plotter.get('terminator');
                let hpglOut = plotter.get('code') + hpgl + ';';
                serialWrite(hpgl);
                if(plotter.currentLine+1 < plotter.maxLines) {
                    if (plotter.lines[plotter.currentLine+1]){
                        plotter.lines[plotter.currentLine+1] = letter;
                    } else {
                        plotter.lines[plotter.currentLine+1] += letter;
                    }
                }
                plotter.set('code', hpglOut);
            }
        }
    }
}
function onKeyup(e) {
    // if(e.ctrlKey) {
    //     //controlKeyTable[keyTable[e.charCode]]();
    // } else {
    //     //outputActual();
    // }
}

function onDrop(e) {
    e.originalEvent.dataTransfer.dropEffect = 'copy';

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

    e.preventDefault();
}

function onDrag(e){
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'copy';
    //e.stopPropagation(); ??
}

function onClick (e) {
    svg.points.find({}).forEach((point) => {
        svg.points.update(
            {_id: point._id}, {
                $set: {
                    x: Math.floor(Math.random()*Session.get('svg.width')),
                    y: Math.floor(Math.random()*Session.get('svg.height'))
                }
            });
    });
}

Template.body.events({
    'click': (e) => onClick(e),
    'keydown': (e) => onKeydown(e),
    'keypress': (e) => onKeypress(e),
    'keyup': (e) => onKeyup(e),
    'drop': (e) => onDrop(e),
    'dragover': (e) => onDrag(e)
});

Meteor.startup(() => {
    options = {
        'plotter.messageQueue': [],
        'plotter.buffer': [],
        'plotter.status': 0,
        'plotter.fontWidth': 0.8,
        'plotter.fontHeight': 1.6,
        'plotter.error': 0,
        'plotter.pageWidth': 11,
        'plotter.pageHeight': 17,
        'plotter.maxWidth': 8262,
        'plotter.maxHeight': 11700,
        'plotter.charWidth': 81,
        'plotter.lineHeight': 300,
        'plotter.verticalCharacterSpacing': 0,
        'plotter.horizontalCharacterSpacing': 0,
        'plotter.xMin': 757,
        'plotter.yMin': 600,
        'plotter.p1': [0,0],
        'plotter.p2': [8262,11700],
        'plotter.x':  757,
        'plotter.y':  11700,
        'plotter.textAngle': 0,
        'plotter.recordingState': 1,
        'plotter.penState': 0,
        'plotter.selectedPen': 0,
        'plotter.code': '',
        'plotter.terminator': String.fromCharCode(3),
        'plotter.escape': String.fromCharCode(27),
        'plotter.homePosition': 'topLeft',
        'plotter.debug': true
    };
    Session.setDefault(options);
    //svg.setupCanvas($(document).innerWidth(), $(document).innerHeight());
    //svg.createRandomPoints(100);
    plotter.calibrate();
});
