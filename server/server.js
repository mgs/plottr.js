/* globals SerialPort */

//var serialPort, serialBuffer, serialData, serialObject;

// serialPort = ;
// serialBuffer = new Buffer(16);
// serialData = undefined;
// serialObject = undefined;
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var plotter = {
    x: 0,
    y: 0,
    p: 0,
    p1: 0,
    p2: 11880,
    dataWritten: []
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
        saveMessagesToFile: (data) => {
            fs.writeFile('saved-' + (new Date().toString()).replaceAll(':', '-') + '.hpgl', data, function(err) {
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
        }
    });
});
