//// Utils
// Converts from degrees to radians.
Math.radians = (degrees) => degrees * Math.PI / 180;
Math.degrees = (radians) => radians * 180 / Math.PI;
var charCode = String.fromCharCode;

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
    messageQueue: [],
    get: (key) => {
        return Session.get('plotter.' + key);
    },
    set: (key, value) => {
        return Session.set('plotter.' + key, value);
    },
    pushMessage: (message) => {
        let messageQueue = plotter.get('queue');
        plotter.set('messageQueue', messageQueue.push(message));
    },
    popMessage: () => {
        let messageQueue = plotter.get('queue');
        plotter.set('messageQueue', messageQueue.pop());
    }
};

// This table contains a hash-table with the different possible error codes and their descriptions.
var errorCodeTable = {
    10: '[10] Output instruction received while another output instruction is \
              executing. The first instruction is executed while the next \
              instruction is ignored.',
    11: '[11] Invalid byte received after first two characters, ESC., in a \
              device control instruction.',
    12: '[12] Invalid byte received while parsing a device control instruction.\
              The parameter containing the invalid byte and all the following\
               parameters are defaulted.',
    13: '[13] Parameter out of range.',
    14: '[14] Too many parameters received. Additional parameters beyond the\
              correct number are ignored.',
    15: '[15] A framing error, parity error, or overrun error has occurred.',
    16: '[16] The input buffer has overflowed. This will result in loss of data \
              and probably an HPGL error.',
    17: '[17] Baud rate mismatch.',
    18: '[18] I/O error indeterminate.',
    20: '[20] RS232 Serial Tx/Rx Test Failed.',
    21: '[21] RS232 DTR Test Failed.'
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
    Meteor.call('write', string + ';', function(err, res){
        if(err){
            return serialError(err);
        } else {
            setTimeout(serialRead, 100);
            setTimeout(callback, 200);
            return res;
        }
    });
}

function smoothIncrement(variable, finish, step, speed){
    let val = plotter.get(variable);
    let newVal;
    ui.incrementingP = true;
    if (val < finish){
        newVal = Number(plotter.get(variable)) + step;
        setTimeout(function (){
            plotter.set(variable, newVal);
            smoothIncrement(variable, finish, step, speed);
        }, speed/100);
    } else if (val > finish){
        newVal = Number(plotter.get(variable)) - step;
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
    if(queue.length > 1) {
        let packet = _.first(queue);
        let message = packet[0];
        let callback = packet[1];
        serialWrite(message, callback);
        //console.log(message);
        queue.shift();
        setTimeout(() => {
            bufferedSerialWrite(queue, delay);
        }, delay);
    } else {
        let packet = _.first(queue);
        let message = packet[0];
        let callback = packet[1];
        //console.log(message);
        queue.shift();
        setTimeout(() => {
            serialWrite(message, callback);
        }, delay);
    }
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
    serialWrite('OE');
    let errorCode = parseInt(plotter.get('buffer')[0]);
    if (errorCode >= 0 && errorCode <= 7){
        plotter.set('error', plotterErrorCodes[errorCode]);
    }
}

function outputStatus(){
    serialWrite('OS');
    plotter.set('status', plotter.get('buffer')[0]);
}

function outputP1AndP2(){
    serialWrite('OP', function () {
        plotter.set('p1', plotter.get('buffer')[0]);
        plotter.set('p2', plotter.get('buffer')[1]);
    });
}

function outputActual(){
    serialWrite('OA', function (){
        let b = plotter.get('buffer');
        let x = b[0];
        let y = b[1];
        let p = b[2];

        plotter.set('x', x);
        plotter.set('y', y);
        plotter.set('penState', p);
    });
}

function outputCommandedPosition(){
    serialWrite('OC', function(){
        let b = plotter.get('buffer');
        let x = b[0];
        let y = b[1];
        let p = b[2];

        plotter.set('x', x);
        plotter.set('y', y);
        plotter.set('penState', p);
    });
}

function outputWindow(){
    serialWrite('OW', function (){
        let b = plotter.get('buffer');
        let mw = Number(b[2]);
        let mh = Number(b[3]);

        plotter.set('maxWidth', mw);
        plotter.set('maxHeight', mh);
    });
}

// Drawing Functions
function penUp(x, y){
    if (x && y){
        var string = 'PU,' + x + ',' + y;
        serialWrite(string, function () {
            outputActual();
        });
    } else {
        serialWrite('PU', function () {
            outputActual();
        });
    }
}

function penDown(x, y){
    if (x && y){
        serialWrite('PD' + x + ',' + y);
        outputActual();
    } else {
        serialWrite('PD');
        outputActual();
    }
}

function selectPen(penNumber){
    plotter.set('selectedPen', penNumber);
    serialWrite('SP,' + penNumber);
}

function home(topRightIfTrue){
    if(topRightIfTrue){
        penUp(plotter.get('maxWidth'), plotter.get('maxHeight'));
    } else {
        penUp(plotter.get('xMin'), plotter.get('yMin'));
    }
}

function increaseFontWidth (amount){
    let fsw = (Number(plotter.get('fontWidth')) + amount);
    let fsh = (Number(plotter.get('fontHeight')));
    plotter.set('fontWidth', fsw);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function decreaseFontWidth (amount){
    let fsw = (Number(plotter.get('fontWidth')) - amount);
    let fsh = (Number(plotter.get('fontHeight')));
    plotter.set('fontWidth', fsw);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function increaseFontHeight (amount){
    let fsw = (Number(plotter.get('fontWidth')));
    let fsh = (Number(plotter.get('fontHeight')) + amount);
    plotter.set('fontHeight', fsh);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function decreaseFontHeight (amount){
    let fsw = (Number(plotter.get('fontWidth')));
    let fsh = (Number(plotter.get('fontHeight'))  - amount);
    plotter.set('fontHeight', fsh);
    serialWrite('SR,' + fsw + ',' + fsh);
}

function rotate(angle){
    if (ui.incrementingP === false){
        let newAngle = Number(plotter.get('textAngle')) + angle;
        if (newAngle < 0){
            let a = 360 + (Number(plotter.get('textAngle')) + angle);
            plotter.set('textAngle', 360);
            smoothIncrement('textAngle', a, 1, ui.incrementSpeed);
        } else if (newAngle > 360) {
            let a = (Number(plotter.get('textAngle')) + angle) % 360;
            plotter.set('textAngle', 0);
            smoothIncrement('textAngle', a, 1, ui.incrementSpeed);
            //plotter.set('textAngle', a);
        } else {
            let a = (Number(plotter.get('textAngle')) + angle) % 360;
            smoothIncrement('textAngle', a, 1, ui.incrementSpeed);
        }
        //console.log(plotter.get('textAngle'), Math.cos(Math.radians(newAngle)), Math.sin(Math.radians(newAngle)));
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
    points: () => ScatterPoints.find({}),
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
    getFontDimensions: () => Math.round(plotter.get('fontWidth') * 80) + 'x' + Math.round(plotter.get('fontHeight') * 160),
    getTextAngle: () => getData('textAngle'),
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
    randomX: () => Math.random() * document.width,
    randomY: () => Math.random() * document.height
});

var cursor = {
    up: (spaces) => {
        if (Number(plotter.get('y')) < (Number(plotter.get('maxHeight')))){
            plotter.set('y', Number(plotter.get('y')) + (Number(plotter.get('lineHeight') * spaces)));
            serialWrite('CP,0,' + spaces);
        }
    },
    left: (spaces) => {
        if (Number(plotter.get('x')) > Number(plotter.get('xMin'))){
            plotter.set('x', Number(plotter.get('x') - (Number(plotter.get('charWidth'))) * spaces));
            serialWrite('CP,-' + spaces + ',0');
        }
    },
    right: (spaces) => {
        if (Number(plotter.get('x')) < Number(plotter.get('maxWidth'))){
            plotter.set('x', Number(plotter.get('x')) + (Number(plotter.get('charWidth')) * spaces));
            serialWrite('CP,' + spaces + ',0');
        }
    },
    down: (spaces) => {
        if (Number(plotter.get('y')) > Number(plotter.get('yMin'))){
            plotter.set('y', Number(plotter.get('y')) - (Number(plotter.get('lineHeight')) * spaces));
            serialWrite('CP,0,-' + spaces);
        }
    }
};

function newLine(){
    //console.log(Number(plotter.get('xMin')),Number(plotter.get('y')) + Number(plotter.get('lineHeight')));
    cursor.down(1);
    penUp(plotter.get('xMin'), plotter.get('y'));
}

function debug(e){
    if(plotter.get('debug')) {
        console.log('Writing to serial plotter: ' + 'LB' + charCode(e.keyCode) + plotter.get('terminator') + ';');
    }
}

var altKeydownTable = {
    37: () => rotate(-30),  // Left Arrow
    39: () => rotate(30)    // Right Arrow
};

var shiftedKeydownTable = {
    16: () => 0, // Shift Key
    37: () => cursor.left(5), // Shifted Left Arrow
    38: () => cursor.up(5),          // Shifted Up Arrow
    39: () => cursor.right(5), // Shifted Right Arrow
    40: () => cursor.down(5) // Shifted Down Arrow
};

function togglePen(){
    if(Number(plotter.get('penState')) === 0) {
        serialWrite('PD');
        //outputCommandedPosition();
    } else {
        serialWrite('PU');
        //outputCommandedPosition();
    }
}

var controlKeyTable = {
    17: undefined,
    32: togglePen,
    0: () => 0
};

function toggleVisor () {
    if(ui.hidden){
        $('#cursorValue')
            .stop(true, true)
            .fadeIn({ duration: ui.slideDuration, queue: false })
            .css('display', 'none')
            .slideDown(ui.slideDuration);
        ui.hidden = false;
    } else {
        $('#cursorValue')
            .stop(true, true)
            .fadeOut({ duration: ui.slideDuration, queue: false })
            .slideUp(ui.slideDuration);
        ui.hidden = true;
    }
}

var metaKeyTable = {
    27: () => selectPen(0),
    37: () => decreaseFontWidth(0.05),
    38: () => increaseFontHeight(0.05),
    39: () => increaseFontWidth(0.05),
    40: () => decreaseFontHeight(0.05),
    112: () => selectPen(1), // F1
    113: () => selectPen(2), // F2
    114: () => selectPen(3), // F3
    115: () => selectPen(4), // F4
    116: () => selectPen(5), // F5
    117: () => selectPen(6), // F6
    118: () => selectPen(7), // F7
    119: () => selectPen(8), // F8
    120: () => home(true), // F9
    121: () => home(true), // F10
    122: () => home(true), // F11
    123: () => toggleVisor()
};

var keydownTable = {
    // 8: () => cursor.left(1), // Backspace Key
    9: () => cursor.right(5), // Tab Key
    13: () => newLine(),  // Enter Key
    16: () => 0, // ignore shift key
    18: () => 0, // Alt Key
    27: () => selectPen(0), // Escape Key
    // 32: () => cursor.right(1), // Spacebar
    37: () => cursor.left(1),  // Left Arrow
    38: () => cursor.up(1),    // Up Arrow
    39: () => cursor.right(1), // Right Arrow
    40: () => cursor.down(1) // Down Arrow
};

function handleKeydown (e){
    if(e.shiftKey){
        if (shiftedKeydownTable.hasOwnProperty(e.keyCode)){
            shiftedKeydownTable[e.keyCode]();
        }
    } else if(e.metaKey) {
        if (metaKeyTable.hasOwnProperty(e.keyCode)){
            metaKeyTable[e.keyCode]();
        }
    } else if(e.ctrlKey) {
        if (controlKeyTable.hasOwnProperty(e.keyCode)){
            controlKeyTable[e.keyCode]();
        }
    } else if(e.altKey) {
        if (altKeydownTable.hasOwnProperty(e.keyCode)){
            altKeydownTable[e.keyCode]();
        }
    } else {
        if (keydownTable.hasOwnProperty(e.keyCode)){
            keydownTable[e.keyCode]();
        }
    }
}

Template.body.events({
    'click': function () {
        ScatterPoints.find({}).forEach((point) => {
            ScatterPoints.update(
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
       // }
    },
    'keypress': (e) => {
        //e.preventDefault();
        if (e.keyCode !== 27){
            if (e.keyCode === 8){
                if (Number(plotter.get('x')) > Number(plotter.get('xMin'))){
                    Session.set({
                        'plotter.x': (Number(plotter.get('x')) - Number(plotter.get('charWidth')))
                    });
                    let hpgl = 'LB' + charCode(e.charCode) + plotter.get('terminator');
                    serialWrite(hpgl);
                    plotter.set('code', plotter.get('code') + hpgl + plotter.get('terminator') + ';');
                }
            } else if (e.keyCode === 13){
                Session.set({
                    'plotter.x': parseFloat(plotter.get('xMin'))
                });
            } else {
                plotter.set('x', (parseFloat(plotter.get('x')) + parseFloat(plotter.get('charWidth'))));
                let hpgl = 'LB' + charCode(e.charCode) + plotter.get('terminator');
                serialWrite(hpgl);
                plotter.set('code', plotter.get('code') + hpgl + plotter.get('terminator') + ';');
            }
        }
    },
    'keyup': (e) => {
        if(e.ctrlKey) {
            controlKeyTable[e.charCode]();
        } else {
            //outputActual();
        }
    }
});

var ScatterPoints = new Meteor.Collection(null);

var createScatterPlotData = function(n){
    for(let i = 0; i < n; i += 1){
        ScatterPoints.insert({
            x:Math.floor(Math.random()*Session.get('svg.width')),
            y:Math.floor(Math.random()*Session.get('svg.height'))
        });
    }
};

Meteor.startup(() => {
    Session.setDefault({
        'svg.width': $(document).innerWidth(),
        'svg.height': $(document).innerHeight(),
        'plotter.messageQueue': [],
        'plotter.buffer': [0,0,0],
        'plotter.status': 0,
        'plotter.fontWidth': 1.0,
        'plotter.fontHeight': 1.0,
        'plotter.error': 0,
        'plotter.pageWidth': undefined,
        'plotter.pageHeight': undefined,
        'plotter.maxWidth': 0,
        'plotter.maxHeight': 0,
        'plotter.charWidth': 8,
        'plotter.lineHeight': 16,
        'plotter.xMin': 1000,
        'plotter.yMin': 1000,
        'plotter.p1': 0,
        'plotter.p2': 0,
        'plotter.x':  1081,
        'plotter.y':  1000,
        'plotter.textAngle': 0,
        'plotter.penState': 0,
        'plotter.selectedPen': undefined,
        'plotter.terminator': String.fromCharCode(3),
        'plotter.escape': String.fromCharCode(27),
        'plotter.debug': true
    });
    $('#svg').width(Session.get('svg.width'));
    $('#svg').height(Session.get('svg.height'));

    createScatterPlotData(100);

    setTimeout (() => {
        initialize();
    }, 500);
    setTimeout (() => {
        outputWindow();
    }, 1000);
    setTimeout (() => {
        penUp(1000,1000);
    }, 1500);
    setTimeout(() => {
        cursor.right(1);
        cursor.up(1);
    }, 2000);
    setTimeout (() => {
        outputActual();
    }, 2500);
    setTimeout(() => {
        plotter.set('lineHeight', parseFloat(plotter.get('y') - parseFloat(1000)));
        plotter.set('charWidth', parseFloat(plotter.get('x') - 1000));
        plotter.set('maxWidth', plotter.get('maxWidth') - (2 * plotter.get('charWidth')));
        plotter.set('maxHeight', plotter.get('maxHeight') - (2 * plotter.get('lineHeight')));
        //$('#cursorValue').css('background', ui.visorBackgroundColor);
        $('#cursorValue').fadeOut(ui.slideDuration).slideUp(ui.slideDuration);
        ui.hidden = true;
        $('#pleaseWait')
            .stop(true, true)
            .fadeOut({ duration: ui.slideDuration, queue: false })
            .slideUp(ui.slideDuration,() => {
                cursor.left(1);
                cursor.down(1);
            });
    }, 3000);
    var canvas = $('#canvas')[0];
    var ctx = canvas.getContext('2d');

    var w = parseFloat(plotter.get('maxWidth'));
    var h = parseFloat(plotter.get('maxHeight'));

    ctx.canvas.width = w;
    ctx.canvas.height = h;
});


function updateCanvas (){
    var canvas = $('#canvas')[0];
    var ctx = canvas.getContext('2d');

    var w = Math.round(parseFloat(plotter.get('maxWidth') / plotter.get('charWidth')));
    var h = Math.round(parseFloat(plotter.get('maxHeight') / plotter.get('lineHeight')));
    if (plotter.get('debug')){
        console.log(Number(plotter.get('x')) - 1081, Number(plotter.get('y'))-1000, w, h);
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(Number(plotter.get('x'))-1081, Number(plotter.get('y'))-1000, w, h);
}
