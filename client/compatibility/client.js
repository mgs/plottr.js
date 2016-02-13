var ui = {
    bgColor: '#fff'
};

var plotter = {
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

var charCode = String.fromCharCode;
var errorCodes = {
    10: '[10] Output instruction received while another output instruction is executing. The first instruction is executed while the next instruction is ignored.',
    11: '[11] Invalid byte received after first two characters, ESC., in a device control instruction.',
    12: '[12] Invalid byte received while parsing a device control instruction. The parameter containing the invalid byte and all the following parameters are defaulted.',
    13: '[13] Parameter out of range.',
    14: '[14] Too many parameters received. Additional parameters beyond the correct number are ignored.',
    15: '[15] A framing error, parity error, or overrun error has occurred.',
    16: '[16] The input buffer has overflowed. This will result in loss of data and probably an HPGL error.',
    17: '[17] Baud rate mismatch.',
    18: '[18] I/O error indeterminate.',
    20: '[20] RS232 Serial Tx/Rx Test Failed.',
    21: '[21] RS232 DTR Test Failed.'
};

// Serial Functions
function serialError(err){
    if (err >= 10 && err <= 21){
        plotter.set('error', errorCodes[err]);
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
        console.log(b);
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

Template.body.helpers({
    xValue: () => plotter.get('x'),
    yValue: () => plotter.get('y'),
    penState: () => plotter.get('penState'),
    getSelectedPen: () => plotter.get('selectedPen'),
    getError: () => {
        let error = plotter.get('error');
        if(error) {
            return error;
        } else {
            return 'No Error';
        }
    },
    getFontSize: () => plotter.get('fontSize'),
    getHeight: () => plotter.get('maxHeight'),
    getWidth: () => plotter.get('maxWidth')
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

var shiftedKeydownTable = {
    16: () => 0, // Shift Key
    37: () => cursor.left(5), // Shifted Left Arrow
    38: () => cursor.up(5),          // Shifted Up Arrow
    39: () => cursor.right(5), // Shifted Right Arrow
    40: () => cursor.down(5) // Shifted Down Arrow
};

var controlKeyTable = {
    32: () => {
        if(plotter.get('penState') === 0) {
            penDown();
        } else {
            penUp();
        }
    },
    0: () => {
        if(Number(plotter.get('penState')) === 0) {
            serialWrite('PD');
            outputCommandedPosition();
        } else {
            serialWrite('PU');
            outputCommandedPosition();
        }
    }
};

function incrementFontSize (){
    let fs = (Number(plotter.get('fontSize')) * 1.05);
    plotter.set('fontSize', fs);
    serialWrite('SR,' + fs + ',' + fs);
}

function decrementFontSize (){
    let fs = (Number(plotter.get('fontSize')) * 0.95);
    plotter.set('fontSize', fs);
    serialWrite('SR,' + fs + ',' + fs);
}

var metaKeyTable = {
    27: () => selectPen(0),
    43: () => incrementFontSize(),
    45: () => decrementFontSize(),
    38: () => incrementFontSize(),
    40: () => decrementFontSize(),
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
    123: () => {
        $('#cursorValue').fadeToggle(1000, 'swing', () => {
            $('canvas').attr({
                width: document.width,
                height: document.height
            });
            $('#canvas').fadeIn(1000);
            // fadeToggle (1000);
        });
    } 
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
    console.dir(e);
    if(e.shiftKey){
        console.log('shifted');
        if (shiftedKeydownTable.hasOwnProperty(e.keyCode)){
            shiftedKeydownTable[e.keyCode]();
        }
    } else if(e.metaKey) {
        console.log('metaed');
        if (metaKeyTable.hasOwnProperty(e.keyCode)){
            metaKeyTable[e.keyCode]();
        }
    } else if(e.ctrlKey) {
        console.log('controlled');
        if (controlKeyTable.hasOwnProperty(e.keyCode)){
            controlKeyTable[e.keyCode]();
        }
    } else {
        console.log('elsed');
        if (keydownTable.hasOwnProperty(e.keyCode)){
            keydownTable[e.keyCode]();
        }
    }
}

Template.body.events({
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
                    var hpgl = 'LB' + charCode(e.charCode) + plotter.get('terminator');
                    serialWrite(hpgl);
                    plotter.set('code', plotter.get('code') + hpgl + plotter.get('terminator') + ';');
                }
            } else if (e.keyCode === 13){
                Session.set({
                    'plotter.x': parseFloat(plotter.get('xMin'))
                });
            } else {
                plotter.set('x', (parseFloat(plotter.get('x')) + parseFloat(plotter.get('charWidth'))));
                var hpgl = 'LB' + charCode(e.charCode) + plotter.get('terminator');
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

Session.setDefault({
    'plotter.code': '',
    'plotter.messageQueue': [],
    'plotter.buffer': [0,0,0],
    'plotter.status': 0,
    'plotter.fontSize': 1.0,
    'plotter.error': 0,
    'plotter.pageWidth': 0,
    'plotter.pageHeight': 0,
    'plotter.maxWidth': 'calibrating',
    'plotter.maxHeight': 'calibrating',
    'plotter.charWidth': 'calibrating',
    'plotter.lineHeight': 'calibrating',
    'plotter.xMin': 1081,
    'plotter.yMin': 1000,
    'plotter.p1': 0,
    'plotter.p2': 0,
    'plotter.x':  1000,
    'plotter.y':  1000,
    'plotter.penState': 'calibrating',
    'plotter.selectedPen': 0,
    'plotter.terminator': String.fromCharCode(3),
    'plotter.escape': String.fromCharCode(27),
    'plotter.debug': true
});

Meteor.startup(() => {
    Session.set({
        'plotter.messageQueue': [],
        'plotter.buffer': [0,0,0],
        'plotter.status': 0,
        'plotter.fontSize': 1.0,
        'plotter.error': 0,
        'plotter.pageWidth': 0,
        'plotter.pageHeight': 0,
        'plotter.maxWidth': 'calibrating',
        'plotter.maxHeight': 'calibrating',
        'plotter.charWidth': 'calibrating',
        'plotter.lineHeight': 'calibrating',
        'plotter.xMin': 1000,
        'plotter.yMin': 1000,
        'plotter.p1': 0,
        'plotter.p2': 0,
        'plotter.x':  1081,
        'plotter.y':  1000,
        'plotter.penState': 'calibrating',
        'plotter.selectedPen': 0,
        'plotter.terminator': String.fromCharCode(3),
        'plotter.escape': String.fromCharCode(27),
        'plotter.debug': true
    });
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
        plotter.set ('maxWidth', plotter.get('maxWidth') - (2 * plotter.get('charWidth')));
        plotter.set ('maxHeight', plotter.get('maxHeight') - (2 * plotter.get('lineHeight')));
        $('#pleaseWait').fadeOut(800,function (){
            $('body').css('background', ui.bgColor);
            $('#cursorValue').css('background', ui.bgColor);
            $('#cursorValue').fadeIn(800);
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
    console.log(Number(plotter.get('x')) - 1081, Number(plotter.get('y'))-1000, w, h);

    ctx.fillStyle = '#000000';
    ctx.fillRect(Number(plotter.get('x'))-1081, Number(plotter.get('y'))-1000, w, h);
    // for(var i = 0; i < Math.round(w); i+=1) {
    //     for(var j = 0; j < Math.round(h); j+=1) {
    //         //ctx.fillStyle = '#' + Math.floor(Math.random()*99) + 'FF00';
    //         ctx.fillStyle = '#000000';
    //         ctx.fillRect(i*w, j*h, w, h);
    //     }
    // }
}
