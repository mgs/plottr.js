/* globals SerialPort */

// Databases
//var serialPort, serialBuffer, serialData, serialObject;

// serialPort = ;
// serialBuffer = new Buffer(16);
// serialData = undefined;
// serialObject = undefined;
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function writeAndDrain (data, callback){
    serialPort.write(data, function () {
        serialPort.drain(callback);
    });
}

// function serialWrite (fn){
//     if (writeFunctionTable.hasOwnProperty(fn)){
//         writeFunctionTable[fn]();
//     } else {
//         console.log(fn + ' is not a valid serialWrite Function. Please choose one of: ' + writeFunctionTable);
//     }
// }

Meteor.startup(function () {
    var Future = Npm.require ('fibers/future');
    var exec = Npm.require ('child_process').exec;

    Plottr = new Meteor.Collection('Plottr');

    Plottr.insert({
        buffer: [],
        x: 0,
        y: 0,
        penState: 0,
        p1: 1000,
        p2: 10880,
        status: 0,
        messageQueue: [],
        dataWritten: [],
        error: 0,
        recordingState: 1,
        selectedPen: 0,
        debug: true,
        options: {
            typography: {
                fontWidth: 0.8,
                fontHeight: 1.6,
                kerning: 81,
                leading: 300
            },
            profiles: {
                sketchmate: {
                    'maxWidth': 8600,
                    'maxHeight': 11600,
                    'charWidth': 81,
                    'lineHeight': 300,
                    'verticalCharacterSpacing': 0,
                    'horizontalCharacterSpacing': 0,
                    'xMin': 514,
                    'yMin': 1000,
                    'returnPoint': 514,
                    'textAngle': 0,
                    'terminator': String.fromCharCode(3),
                    'escape': String.fromCharCode(27),
                    'homePosition': 'topLeft'
                },
                MP4100: {
                    'debug': true,
                    'buffer': [],
                    'fontWidth': 0.8,
                    'fontHeight': 1.6,
                    'pageWidth': 11,
                    'pageHeight': 17,
                    'maxWidth': 16000,
                    'maxHeight': 11600,
                    'charWidth': 171,
                    'lineHeight': 300,
                    'verticalCharacterSpacing': 0,
                    'horizontalCharacterSpacing': 0,
                    'xMin': 514,
                    'yMin': 900,
                    'returnPoint': 514,
                    'textAngle': 0,
                    'terminator': String.fromCharCode(3),
                    'escape': String.fromCharCode(27),
                    'homePosition': 'topLeft'
                }
            }
        }
    });

    serialBuffer = 'Not Yet';
    serialData = [];
    serialObject = {};

    serialPort = new SerialPort.SerialPort('/dev/tty.usb', {
        baudrate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        parser: SerialPort.parsers.readline('\r')
    }, false);

    serialPort.open(function (error) {
        if(error) {
            console.log('wtf: ' + error);
        } else {
            console.log('Ready.');
            serialPort.on('data', function(data) {
                if(data) {
                    serialBuffer = data.split(',');
                }
            });
        }
    });

    Meteor.methods({
        convertEpsToHpgl: (epsFile) => {
            // This method call won't return immediately, it will wait for the
            // asynchronous code to finish, so we call unblock to allow this client
            // to queue other method calls (see Meteor docs)
            this.unblock();
            var future=new Future();
            var command='pstoedit -f hpgl ' + epsFile + epsFile;
            exec(command,function(error,stdout,stderr){
                if(error){
                    console.log(error);
                    throw new Meteor.Error(500, command + ' failed');
                }
                future.return(stdout.toString());
            });
            return future.wait();
        },
        saveMessagesToFile: (data) => {
            fs.writeFile('../../../../../../saved-' + (new Date().toString()).replaceAll(':', '-') + '.hpgl', data, function(err) {
                if (err) throw err;
            });
        },
        read: () => {
            return(serialBuffer);
        },
        write: (string) => {
            writeAndDrain(string, function (err, data) {
                console.log('Wrote ' + string + ' to the serial port.');
                return(data);
            });
        },
        getPlotterSettings: (model) => {
            switch (model){
                case 'sketchmate':
                    return(plotter.sketchmate.options);
                case 'graphtec':
                    return(plotter.graphtec.options);
                case 'dxy':
                    return(plotter.dxy.options);
                default:
                    return(plotter.generic.options);
            }
        }
    });
});
