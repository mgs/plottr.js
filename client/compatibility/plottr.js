var mouseDownTimer;
var leftMouseButton;

// Databases
Plottr = new Meteor.Collection('Plottr');

// Tables
var angleTable = {
    '-315': '↘',
    '-270': '↓',
    '-180': '⥳',
    '-225': '↙',
    '-135': '↖',
    '-90': '↑',
    '-45': '↗',
    0: '⥲',
    45: '↘',
    90: '↓',
    135: '↙',
    180: '⥳',
    225: '↖',
    270: '↑',
    315: '↗'
};

var directionTable = {
    '-315': ' 1, -1;',
    '-270': ' 0, -1;',
    '-225': '-1, -1;',
    '-180': '-1,  0;',
    '-135': '-1,  1;',
    '-90': ' 0,  1;',
    '-45': ' 1,  1;',
    0: ' 1,  0;',
    45: ' 1, -1;',
    90: ' 0, -1;',
    135: '-1, -1;',
    180: '-1,  0;',
    225: '-1,  1;',
    270: ' 0,  1;',
    315: ' 1,  1;'
};

// $$ = plotter.plot;
// $p = plotter.plot;
// $et = plotter.set;

//// Utils
// Converts from degrees to radians.
Math.radians = (degrees) => degrees * Math.PI / 180;
Math.degrees = (radians) => radians * 180 / Math.PI;
var charCode = String.fromCharCode;

ui = {
    hidden: false,
    bgColor: 'rgb(255,255,255)',
    visorBackgroundColor: 'rgba(40,0,40,0.8)',
    slideDuration: 1000,
    incrementSpeed: 0.1,
    incrementingP: false
};

plotter = {
    mode: 'typewriter', // 'plotter', 'turtle', 'typewriter'
    lines: [''],
    lineNumber: 0,
    charNumber: 0,
    data: {
        size: 0,
        queue: []
    },
    get: (key) => Session.get('plotter.' + key),
    set: (key, value) => Session.set('plotter.' + key, value),
    typewrite: (string) => serialWrite('LB' + string + plotter.get('terminator')),
    pushMessage: (message) => {
        let messageQueue = plotter.get('queue');
        messageQueue.push(message);
        plotter.set('messageQueue', messageQueue);
    },
    popMessage: () => {
        let messageQueue = plotter.get('queue');
        plotter.set('messageQueue', messageQueue.pop());
    },
    plot: (commandString) => {
        if(commandString){
            if (plotter.get('sendingToSerial')){
                serialWrite(commandString);
            } else {
                console.log('serialMonitor mode: ' + commandString);
            }
        } else {
            //console.log('Bad Command');
        }
    },
    plotAndRead: (commandString) => {
        if(commandString){
            if (plotter.get('sendingToSerial')){
                serialWrite(commandString, true);
            } else {
                console.log('serialMonitor mode: ' + commandString);
            }
        } else {
            //console.log('Bad Command');
        }
    },
    calibrate: () => {
        plotter.plot(initialize());
        plotter.plotAndRead(outputWindow());
        // setTimeout(() => {
        //     outputActual();
        // }, 1500);
        setTimeout(() => {
            plotter.plot(penUp(plotter.get('xMin'), plotter.get('maxHeight')));
            ui.hidden = false;
            $('#pleaseWait')
                //.stop(true, true)
                .fadeOut({
                    duration: ui.slideDuration,
                    queue: false
                });
                //.slideUp(ui.slideDuration,() => {});
        }, 2500);
    }
};

// Serial Functions
function lookupSerialError(err){
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

function serialWrite(string, hasData, callback){
    if (plotter.get('recordingState')){
        let q = plotter.get('messageQueue');
        q.push(string + ';');
        plotter.set('messageQueue', q);
    }
    Meteor.call('write', string + ';', (err, res) => {
        if(hasData){
            if(err){
                return lookupSerialError(err);
            } else {
                setTimeout(serialRead, 100);
                if(callback){
                    setTimeout(callback, 200);
                }
                return res;
            }
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

function bufferedLabel(queue){
    let commandString = '';
    for(let i = 0; i < queue.length; i += 1){
        commandString += 'LB' + queue[i] + plotter.get('terminator') + ';' + 'CP-' + queue[i].length + ',-1;';
    }
    return commandString;
}

// Maintenance Functions
function initialize(){
    return('IN');
}

function defaults(){
    return('DF');
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
    setTimeout(() => {
        let errorCode = plotter.get('buffer')[0];
        if (errorCode >= 0 && errorCode <= 7){
            plotter.set('error', plotterErrorCodes[errorCode]);
        }
    }, 1000);
    return('OE;');
}

function outputStatus(){
    setTimeout(() => {
        let status = parseInt(plotter.get('buffer')[0]);
        plotter.set('status', status);
    }, 1000);
    return('OS;');
}

function outputP1AndP2(){
    setTimeout(() => {
        let p1 = parseInt(plotter.get('buffer')[0]),
            p2 = parseInt(plotter.get('buffer')[1]);
        plotter.set('p1', p1);
        plotter.set('p2', p2);
    }, 1000);
    return('OP;');
}

function outputActual(){
    setTimeout(() => {
        let b = plotter.get('buffer'),
            x = parseInt(b[0]),
            y = parseInt(b[1]),
            p = parseInt(b[2]);

        plotter.set('x', x);
        plotter.set('y', y);
        plotter.set('penState', p);
    }, 1000);
    return('OA;');
}

function outputCommandedPosition(){
    setTimeout(function (){
        let b = plotter.get('buffer'),
            x = parseInt(b[0]),
            y = parseInt(b[1]),
            p = parseInt(b[2]);

        plotter.set('x', x);
        plotter.set('y', y);
        plotter.set('penState', p);
    }, 1000);
    return('OC');
}

function outputWindow(){
    setTimeout(function (){
        let b = plotter.get('buffer'),
            mw = parseInt(b[2]),
            mh = parseInt(b[3]);

        plotter.set('plotterWidth', mw);
        plotter.set('plotterHeight', mh);
    }, 1000);
    return('OW;');
}

function selectPen(penNumber){
    plotter.set('selectedPen', penNumber);
    serialWrite('SP,' + penNumber);
}

function home(){
    let homePoints = {
        'topRight': () => penUp(plotter.get('maxWidth'), plotter.get('maxHeight')),
        'bottomLeft': () => penUp(plotter.get('xMin'), plotter.get('yMin')),
        'topLeft': () => penUp(plotter.get('xMin'), plotter.get('yMin')),
        'bottomRight': () => penUp(plotter.get('xMin'), plotter.get('yMin'))
    };
    let homePoint = plotter.get('homePosition');

    return homePoints[homePoint]();
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
    let newAngle = plotter.get('textAngle') + angle;

    if (Math.abs(newAngle) === 360) {
        plotter.set('textAngle', 0);
        newAngle = 0;
    } else if (newAngle > 360) {
        newAngle = newAngle % 360;
        plotter.set('textAngle', newAngle);
    } else {
        newAngle = newAngle % 360;
        plotter.set('textAngle', newAngle);
    }
    // getting rid of the white space so things can be written legibly above
    let str = directionTable[newAngle].replace(/\s+/g, '');
    return('DI,' + str);
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

Template.plotterPreview.helpers({
    lines: () => plotter.get('lines')
})

Template.list.helpers({
    items: [
        {name: 'recording',
         value: () => plotter.get('recordingState') === true ? 'Yes' : 'No'},
        {name: 'sending-to-serial',
         value: () => plotter.get('sendingToSerial') === true ? 'Yes' : 'No'},
        {name: 'pen-mode',
         value: () => plotter.get('penMode')},
        {name: 'cursor-position',
         value: () => 'Line: ' + plotter.get('lineNumber') + ' / Char: ' + plotter.get('charNumber')},
        {name: 'pen-position',
         //value: () => Math.round(Number(plotter.get('x') / plotter.get('maxWidth')) * 1000) + ',' + Math.round(Number(plotter.get('y') / plotter.get('maxHeight')) * 1000)
         value: () => plotter.get('x') + ',' + plotter.get('y')},
        {name: 'max-position',
         value: () => plotter.get('plotterWidth') + ',' + plotter.get('plotterHeight')},
        {name: 'selected-pen',
         value: () => 'PEN ' + plotter.get('selectedPen')},
        {name: 'pen-state',
         value: () => plotter.get('penState') === 1 ? 'DOWN' : 'UP'},
        {name: 'page-dimensions',
         value: () => plotter.get('pageWidth') + 'x' + plotter.get('pageHeight')},
        {name: 'type-direction',
         value: () => angleTable[plotter.get('textAngle')]},
        {name: 'text-angle',
         value: () => plotter.get('textAngle') + '°'},
        {name: 'font-size',
         value: () => plotter.get('fontWidth')*10 + ' x ' + plotter.get('fontHeight')*10},
        {name: 'loaded-file',
         value: () => plotter.get('loadedFile.name')}
    ],
    randomId: (n) => {
        let chars = ':.';
        let str = '';

        for(let i = 0; i < n; i += 1){
            if(Math.random() > 0.50){
                str += chars[0];
            } else {
                str += chars[1];
            }
        }
        return str;
    }
});

function updateCursor(){
    $('#cursor').css('left', plotter.get('xOffset') + (plotter.get('charNumber') * plotter.get('letterWidth')) + 'px');
    $('#cursor').css('top',  plotter.get('yOffset') + (plotter.get('lineNumber') * plotter.get('letterHeight')) + 'px');
}

var cursor = {
    x: 0,
    y: 0,

    up: (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') + height;
        if(newY <= plotter.get('maxHeight')){
            cursor.y += spaces;
            plotter.set('y', newY);
            plotter.set('lineNumber', plotter.get('lineNumber') - 1);
            let lines = plotter.get('lines');
            let lineNumber = plotter.get('lineNumber');
            let charNumber = plotter.get('charNumber');
            let lineLength = lines[lineNumber].length;

            if(lineLength < charNumber){
                let spaces = charNumber - lineLength;
                console.log(spaces);
                for(let i = 0; i <= spaces; i++){
                    console.log(i);
                    lines[lineNumber] += '\u00a0';
                }
                plotter.set('lines', lines);
            }
            updateCursor();
            return('CP,0,' + spaces);
        } else {
            return 0;
        }
    },
    'up-left': (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') + height;
        if(newY <= plotter.get('maxHeight')){
            cursor.y += spaces;
            plotter.set('y', newY);
            plotter.set('lineNumber', plotter.get('lineNumber') - 1);
            plotter.set('charNumber', plotter.get('charNumber') - 1);
            updateCursor();
            return('CP,' + -spaces + ',' + spaces);
        } else {
            return 0;
        }
    },
    left: (spaces) => {
        let width = plotter.get('charWidth') * spaces;
        let newX = plotter.get('x') - (width);
        if(plotter.get('charNumber') === 0){
            if(plotter.get('lineNumber') === 0){
                //console.log('a');
                return 0;
            } else if(plotter.get('charNumber') === 0){
                //console.log('b');
                keydownTable.backspace();
            } else {
                //console.log('c');
                return 0;
            }
        } else if(newX >= plotter.get('xMin')){
            //console.log('d');
            cursor.x -= spaces;
            plotter.set('x', newX);
            plotter.set('charNumber', plotter.get('charNumber') - 1);
            updateCursor();
            return('CP,-' + spaces + ',0');
        }
    },
    'up-right': (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') + height;
        if(newY <= plotter.get('maxHeight')){
            cursor.y += spaces;
            plotter.set('y', newY);
            plotter.set('lineNumber', plotter.get('lineNumber') - 1);
            plotter.set('charNumber', plotter.get('charNumber') + 1);
            updateCursor();
            return('CP,' + spaces + ',' + spaces);
        } else {
            return 0;
        }
    },
    right: (spaces) => {
        let width = plotter.get('charWidth') * spaces;
        let newX = plotter.get('x') + width;
        if(newX <= plotter.get('maxWidth')){
            cursor.x += spaces;
            plotter.set('charNumber', plotter.get('charNumber') + 1);
            plotter.set('x', newX);

            let l = plotter.get('lines');
            let n = plotter.get('lineNumber');
            let c = plotter.get('charNumber');

            if(l[n].length < c){
                //console.log('adding space');
                for(let i = 0; i <= c-l[n].length+1; i+=1){
                    l[n] += '\u00a0';
                }
            }
            plotter.set('lines', l);
            updateCursor();
            return('CP,' + spaces + ',0');
        } else {
            return 0;
        }
    },
    down: (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') - height;
        if(newY >= plotter.get('yMin')){
            cursor.y -= spaces;
            plotter.set('y', newY);
            plotter.set('lineNumber', plotter.get('lineNumber') + 1);
            $('#cursor').css('left', plotter.get('xOffset')+(plotter.get('charNumber') * plotter.get('letterWidth')) + 'px');
            // updateCursor();
            let lines = plotter.get('lines');
            let lineNumber = plotter.get('lineNumber');
            let charNumber = plotter.get('charNumber');
            let lineLength = lines[lineNumber].length;

            if(lineLength < charNumber){
                let spaces = charNumber - lineLength;
                console.log(spaces);
                for(let i = 0; i <= spaces; i++){
                    console.log(i);
                    lines[lineNumber] += '\u00a0';
                }
                plotter.set('lines', lines);
            }

            $('#cursor').css('top', plotter.get('yOffset')+(plotter.get('lineNumber') * plotter.get('letterHeight')) + 'px');
            return('CP,0,-' + spaces);
        } else {
            return 0;
        }
    },
    'down-left': (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') - height;
        if(newY >= plotter.get('yMin')){
            cursor.y -= spaces;
            plotter.set('y', newY);
            plotter.set('lineNumber', plotter.get('lineNumber') + 1);
            plotter.set('charNumber', plotter.get('charNumber') - 1);
            updateCursor();
            return('CP,-' + spaces + ',-' + spaces);
        } else {
            return 0;
        }
    },
    'down-right': (spaces) => {
        let height = plotter.get('lineHeight') * spaces;
        let newY = plotter.get('y') - height;
        if(newY >= plotter.get('yMin')){
            cursor.y -= spaces;
            plotter.set('y', newY);
            plotter.set('charNumber', plotter.get('charNumber') + 1);
            plotter.set('lineNumber', plotter.get('lineNumber') + 1);
            updateCursor();
            return('CP,' + spaces + ',-' + spaces);
        } else {
            return 0;
        }
    }
};

function newLine(){
    // plotter.set('lineNumber', plotter.get('lineNumber') + 1);
    let cmd = '';
    let l = plotter.get('lines');
    let n = plotter.get('lineNumber');

    if (plotter.get('x') > plotter.get('xMin') && plotter.get('y') > plotter.get('yMin')){
        if(typeof(l[n+1]) === 'undefined') {
            l.push('');
            plotter.set('lines', l);
        }

        plotter.set('charNumber', 0);
        plotter.set('lineNumber', n + 1);
        let backspaces = l[n].length;
        //console.log(backspaces);
        cmd += 'CP,0,-1;CP,-' + backspaces + ',0;';
        plotter.set('x', plotter.get('xMin'));
        plotter.set('y', plotter.get('y') - plotter.get('lineHeight'));
        plotter.plot(cmd);

        updateCursor();
    } else if (plotter.get('charNumber') === 0){
        if(typeof(l[n+1]) === 'undefined') {
            l.push('');
            plotter.set('lines', l);
        }
        plotter.set('lineNumber', plotter.get('lineNumber') + 1);
        plotter.set('x', plotter.get('xMin'));
        plotter.set('y', plotter.get('y') - plotter.get('lineHeight'));
        cmd += 'CP,0,-1;';
        plotter.plot(cmd);
        updateCursor();
    }
}

function togglePen(){
    if(plotter.get('penState')) {
        return(penDown(plotter.get('x'), plotter.get('y')));
    } else {
        return(penUp(plotter.get('x'), plotter.get('y')));
    }
    toggle('penState');
}

function toggleRecording(){
    plotter.set('recordingState', !plotter.get('recordingState'));
}

function toggleVisor () {
    if(ui.hidden){
        $('#consoleValues').fadeIn({ duration: ui.slideDuration, queue: false });
        ui.hidden = false;
    } else {
        $('#consoleValues').fadeOut({ duration: ui.slideDuration, queue: false });
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
    'left': () => plotter.plot(rotate(-45)), // Left Arrow
    'right': () => plotter.plot(rotate(45))  // Right Arrow
};

var shiftedKeydownTable = {
    'shift': () => 0,
    'left': () => plotter.plot(cursor.left(5)),
    'up': () => plotter.plot(cursor.up(5)),
    'right': () => plotter.plot(cursor.right(5)),
    'down': () => plotter.plot(cursor.down(5)),
    'tab': () => plotter.plot(cursor.left(5))
};

var metaKeyTable = {
    'escape': () => selectPen(0),
    'left': () => decreaseFontWidth(0.05),
    'up': () => increaseFontHeight(0.05),
    'right': () => increaseFontWidth(0.05),
    'down': () => decreaseFontHeight(0.05),
    'F1': () => toggle('sendingToSerial'),
    '=': () => 0,
    '-': () => 0,
    '+': () => 0,
    '_': () => 0
};

// function moveCursor(line, char){
//     plotter.set('lineNumber', line);
//     plotter.set('charNumber', char);

//     let h = plotter.get('lineHeight');
//     let w = plotter.get('charWidth');

//     plotter.set('x', plotter.get('xMin') + (w * char));
//     plotter.set('y', plotter.get('maxHeight') - (h * line));

//     updateCursor();
// }

var controlKeyTable = {
    'control': () => 0, // ignore control key
    'enter': () => plotter.set('xMin', plotter.get('x')),
    'space': () => plotter.plot(togglePen()),
    'A': () => {
        console.log('BLAM');
        moveCursor(plotter.get('lineNumber'), 0);
    },
    'backspace': () => plotter.plot(strikeOutLastCharacter()),
    0: () => 0
};

var keydownTable = {
    'shift': () => 0,
    'alt': () => 0,
    'control': () => 0,
    'meta': () => 0,
    'tab': () => plotter.plot(cursor.right(5)),
    'enter': () => plotter.plot(newLine()),
    'escape': () => plotter.plot(selectPen(0)),
    'left': () => plotter.plot(cursor.left(1)),
    'up': () => plotter.plot(cursor.up(1)),
    'right': () => plotter.plot(cursor.right(1)),
    'down': () => plotter.plot(cursor.down(1)),
    'backspace': () => {
        if(plotter.get('charNumber') === 0 && plotter.get('lineNumber') === 0){
            return 0;
        }
        if(plotter.get('charNumber') === 0 && plotter.get('lineNumber') > 0){
            let n = plotter.get('lineNumber');
            let h = plotter.get('lineHeight');
            let w = plotter.get('charWidth');
            let c = plotter.get('lines')[n-1].length;
            if(c > 0){
                plotter.set('lineNumber', n-1);
                plotter.set('charNumber', c);
                plotter.set('x', plotter.get('x') + (w * c));
                plotter.set('y', plotter.get('maxHeight') - ((n-1) * h));
                plotter.plot('CP,' + c + ',0;CP,0,1;');
            } else {
                plotter.set('lineNumber', n-1);
                plotter.set('charNumber', 0);
                plotter.set('x', plotter.get('xMin'));
                plotter.set('y', plotter.get('maxHeight') - ((n-1) * h));
                plotter.plot('CP,0,1;');
            }
        } else {
            plotter.plot(cursor.left(1));
        }

        updateCursor();
    },
    'space': () => plotter.plot(cursor.right(1)),
    'F1': () => plotter.plot(selectPen(1)),
    'F2': () => plotter.plot(selectPen(2)),
    'F3': () => plotter.plot(selectPen(3)),
    'F4': () => plotter.plot(selectPen(4)),
    'F5': () => plotter.plot(selectPen(5)),
    'F6': () => plotter.plot(selectPen(6)),
    'F7': () => plotter.plot(selectPen(7)),
    'F8': () => plotter.plot(selectPen(8)),
    'F9': () => plotter.plot(togglePen()),
    'F10': () => toggleRecording(),
    'F11': () => saveMessagesToFile(),
    'F12': () => toggleVisor()
};

function saveMessagesToFile (){
    Meteor.call('saveMessagesToFile', plotter.get('messageQueue').join(';\n') + ';');
};

// function onMouseMove (e){
//     console.log(e);
//     mouseDownTimer = setInterval(() => XYtoCharLine(e.pageX, e.pageY), 500);
//     return false;
// }

function onKeydown (e){
    if (keyTable.hasOwnProperty(e.keyCode)){
        let name = keyTable[e.keyCode];
        
        if(e.shiftKey && shiftedKeydownTable.hasOwnProperty(name)){
            shiftedKeydownTable[name]();
            //e.preventDefault();
        } else if(e.metaKey && metaKeyTable.hasOwnProperty(name)) {
            metaKeyTable[name]();
            //e.preventDefault();
        } else if(e.ctrlKey) {
            let char = chrTable[e.keyCode];
            console.log(name,char,e.keyCode);
            controlKeyTable[name]();
            //e.preventDefault();
        } else if(e.altKey && altKeydownTable.hasOwnProperty(name)) {
            altKeydownTable[name]();
            //e.preventDefault();
        } else if(keydownTable.hasOwnProperty(name)){
            keydownTable[name]();
            //e.preventDefault();
        }
    }
}

function onKeypress (e) {
    //e.preventDefault();
    if (chrTable.hasOwnProperty(e.charCode)){
        let letter = chrTable[e.charCode];
        if (letter === '`' && e.metaKey){

        } else {
            if(plotter.get('xMin') <= plotter.get('x') <= plotter.get('maxWidth')){
                plotter.set('x', plotter.get('x') + plotter.get('charWidth'));
                let hpgl = 'LB' + letter + plotter.get('terminator');
                let hpglOut = plotter.get('code') + hpgl + ';';
                if(plotter.get('lineNumber') < plotter.get('maxLines')) {
                    if ((plotter.get('charNumber')+1) <= plotter.get('charsPerLine')){
                        let l = plotter.get('lines');
                        let n = plotter.get('lineNumber');
                        let c = plotter.get('charNumber');
                        if(typeof(letter) !== 'undefined'){
                            if(typeof(l[n][c]) === 'string'){
                                if(letter === ' '){
                                    letter = S('&nbsp;').decodeHTMLEntities().s;
                                    l[n] = replaceLetterAtIndex(l[n], plotter.get('charNumber'), letter);
                                } else {
                                    l[n] = replaceLetterAtIndex(l[n], plotter.get('charNumber'), letter);
                                }
                            } else {
                                if(letter === ' '){
                                    l[n] += S('&nbsp;').decodeHTMLEntities().s;
                                } else {
                                    l[n] += letter;
                                }
                            }
                        }
                        plotter.set('charNumber', plotter.get('charNumber') + 1);
                        plotter.set('lines', l);
                        plotter.plot(hpgl);
                        plotter.set('code', hpglOut);
                        updateCursor();
                    } else {
                        let l = plotter.get('lines');
                        let n = plotter.get('lineNumber');
                        if(typeof(letter) !== 'undefined'){
                            if(typeof(l[n][c]) === 'string'){
                                l[n] = replaceLetterAtIndex(l[n], plotter.get('charNumber'), letter);
                            } else {
                                l[n] = letter;
                            }
                        }

                        plotter.plot(hpgl);
                        plotter.set('code', hpglOut);
                        updateCursor();
                    }
                }
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
    plotter.set('loadedFile', f);
    plotter.set('loadedFile.name', f.name);

    reader.onload = (e) => {
        if (extension === 'hpgl'){
            bufferedSerialWrite(e.target.result.split(';'),0);
        } else if (extension === 'txt'){
            let l = e.target.result.split('\n');
            plotter.set('lines', l);
            if(plotter.get('sendingToSerial')){
                serialWrite(bufferedLabel(plotter.get('lines')));
            }
        } else if (extension === 'svg') {
            plotter.set('svg', ($($.parseXML(e.target.result)).find('svg')[0]));
            plotter.set('hpgl', convertSvgToHPGL(plotter.get('svg'), 10, 3000, 3000, 20));
        } else {

        }
    };

    if (extension === 'hpgl' || extension === 'txt' || extension === 'svg'){
        reader.readAsText(f);
    } else {
        reader.readAsDataURL(f);
    }

    e.preventDefault();
}

function onDragOver(e){
    e.preventDefault();
    e.originalEvent.dataTransfer.dropEffect = 'copy';
}

function onDrag(e){
    e.preventDefault();
    // e.originalEvent.dataTransfer.dropEffect = 'copy';
    console.log(e);
    //XYtoCharLine(e.pageX, e.pageY);
}

function onCut(e){
    console.log('CUTTING!');
}

function onCopy(e){
    console.log('COPYING!');
}

function onPaste(e){
    console.log('PASTING!');
}

function onClick (e) {
    // svg.points.find({}).forEach((point) => {
    //     svg.points.update(
    //         {_id: point._id}, {
    //             $set: {
    //                 x: Math.floor(Math.random()*Session.get('svg.width')),
    //                 y: Math.floor(Math.random()*Session.get('svg.height'))
    //             }
    //         });
    // });
    XYtoCharLine(e.pageX, e.pageY);
}

// function onMouseUp(e){
//     clearInterval(mouseDownTimer);
//     return false;
// }

function onMouseDown(e){
    if(e.which === 1) leftMouseButton = true;
}

function onMouseUp(e){
    if(leftMouseButton && e.which === 1) leftMouseButton = false;
}

function onMouseMove(e){
    if(leftMouseButton === true){
        XYtoCharLine(e.pageX, e.pageY);
    }
}

function XYtoCharLine(x,y){
    let c = x / plotter.get('letterWidth');
    let l = y / plotter.get('letterHeight');

    plotter.set('charNumber', Math.round(c)-1);
    plotter.set('lineNumber', Math.round(l)-1);

    plotter.set('x', plotter.get('xMin') + (plotter.get('charNumber') * plotter.get('charWidth')));
    plotter.set('y', plotter.get('maxHeight') - (plotter.get('lineNumber') * plotter.get('lineHeight')));

    updateCursor();
    plotter.plot(penUp(plotter.get('x'),plotter.get('y')));
    let lines = plotter.get('lines');
    let lineNumber = plotter.get('lineNumber');
    let charNumber = plotter.get('charNumber');
    let lineLength = lines[lineNumber].length;

    if(lineLength < charNumber){
        let spaces = charNumber - lineLength;
        console.log(spaces);
        for(let i = 0; i <= spaces; i++){
            console.log(i);
            lines[lineNumber] += '\u00a0';
        }
        plotter.set('lines', lines);
    }
}

// Template.body.rendered = function(){
//     $('body').mousedown((e) => {
//         if(e.buttons === 1){
//             $('body').mousemove((e) => {
//                 XYtoCharLine(e.pageX, e.pageY);
//             });
//         }
//     });
// };

Template.body.events({
    'click': (e) => onClick(e),
    'mouseup': (e) => onMouseUp(e),
    'mousedown': (e) => onMouseDown(e),
    'mousemove': (e) => onMouseMove(e),
    'keydown': (e) => onKeydown(e),
    'keypress': (e) => onKeypress(e),
    'keyup': (e) => onKeyup(e),
    'drop': (e) => onDrop(e),
    'dragover': (e) => onDragOver(e),
    'drag': (e) => onDrag(e),
    'cut': (e) => onCut(e),
    'copy': (e) => onCopy(e),
    'paste': (e) => onPaste(e)
});

Meteor.startup(() => {
    let options = {
        'plotter.messageQueue': [],
        'plotter.buffer': [],
        'plotter.lines': [''],
        'plotter.charNumber': 0,
        'plotter.lineNumber': 0,
        'plotter.sendingToSerial': true,
        'plotter.status': 0,
        'plotter.penMode': 'typewriter',
        'plotter.fontWidth': 0.8,
        'plotter.fontHeight': 1.6,
        'plotter.error': 0,
        'plotter.pageWidth': 11,
        'plotter.pageHeight': 17,
        'plotter.maxWidth': 8262,
        'plotter.maxHeight': 11400,
        'plotter.plotterWidth': 0,
        'plotter.plotterHeight': 0,
        'plotter.charWidth': 81,
        'plotter.lineHeight': 300,
        'plotter.verticalCharacterSpacing': 0,
        'plotter.horizontalCharacterSpacing': 0,
        'plotter.xMin': 757,
        'plotter.yMin': 600,
        'plotter.p1': [757,11400],
        'plotter.p2': [8262,600],
        'plotter.x':  757,
        'plotter.y':  11400,
        'plotter.textAngle': 0,
        'plotter.recordingState': 1,
        'plotter.penState': 0,
        'plotter.selectedPen': 0,
        'plotter.code': '',
        'plotter.terminator': String.fromCharCode(3),
        'plotter.escape': String.fromCharCode(27),
        'plotter.homePosition': 'topLeft',
        'plotter.debug': true,
        'plotter.loadedFile': '',
        'plotter.loadedFile.name': 'none',
        'plotter.maxLines': 11400/300,
        'plotter.charsPerLine': 8262/81,
        'plotter.letterWidth': 12.96875,
        'plotter.letterHeight': 27,
        'plotter.xOffset': 5,
        'plotter.yOffset': 8
    };
    Session.setDefault(options);
    //svg.setupCanvas($(document).innerWidth(), $(document).innerHeight());
    //svg.createRandomPoints(100);
    plotter.calibrate();
    let arr = [];
    for(var i = 0; i < 33; i += 1){
        arr.push('');
    }
    plotter.set('lines', arr);
});
