/* globals SerialPort */

var serialPort, serialBuffer, serialData, serialObject;

function writeAndDrain(data, callback){
  serialPort.write(data, function () {
    serialPort.drain(callback);
  });
}

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
      write: (string) => {
          writeAndDrain(string, function (err, data) {
              console.log('Wrote ' + string + ' to the serial port.');
              return data;
          });
      },
      read: function () { return serialBuffer; }
  });
});
