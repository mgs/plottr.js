function rect(x, y, w, h){
    penUp(x,y);
    penDown(x+w,y);
    penDown(x+w,y-h);
    penDown(x,y-h);
    penDown(x,y);
    penUp();
}

function line(x0,y0,x1,y1){
  serialWrite('PA,PU,' + x0 + ',' + y0 + ',PD,' + x1 + ',' + y1 + ',PU');
}

// Text Functions
function text(string, x, y, moveArmWhenDone){
    if(x && y){
        penUp(x, y);
    }
    serialWrite('BL' + string + charCode(3));
    outputCommandedPosition();
    if(moveArmWhenDone){
        penUp(plotter.get('maxWidth'), plotter.get('maxHeight'));
    }
}
