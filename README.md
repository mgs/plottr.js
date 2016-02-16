# plottr.js
Javascript interface and API for working with X-Y pen plotters and/or vinyl cutters that understand HPGL.

# Installation
Clone this repository into a folder on your local machine. From your terminal you can enter the command:  

`git clone https://github.com/mgs/plottr.js.git ~/repos/plottr.js`  

This will clone the project into a folder on your machine located at '~/repos/plottr.js'.  

This project's only dependency is the Meteor javascript framework. If you don't have Meteor, it only takes a moment to install it: https://www.meteor.com/install  

Meteor will install all the necessary dependencies the first time that the project is run.  

# Usage

Once meteor is installed, the project can be started by entering the project directory from the terminal:  

`cd ~/repos/plottr.js`  

and then run the project using the supplied shellscript:

`./plottr.sh`  

# Keyboard Controls  
:arrow_up: : Moves the cursor one unit up  
:arrow_down: :  Moves the cursor one unit down  
:arrow_left: : Moves the cursor one unit left  
:arrow_right: : Moves the cursor one unit right  
**`shift` +** :arrow_up: : Moves the cursor five units up  
**`shift` +** :arrow_down: : Moves the cursor five units down  
**`shift` +** :arrow_left: : Moves the cursor five units left  
**`shift` +** :arrow_right: : Moves the cursor five units right  
**`⌘` +** :arrow_up: : Increase the relative scale of the font-height by 5 PLU  
**`⌘` +** :arrow_down: : Decrease the relative scale of the font-height by 5 PLU  
**`⌘` +** :arrow_left: : Decrease the relative scale of the font-width by 5 PLU  
**`⌘` +** :arrow_right: : Increase the relative scale of the font-width by 5 PLU  
**`option` +** : :arrow_left: : Rotate the `textAngle` by -30 degrees  
**`option` +** : :arrow_right: : Rotate the `textAngle` by 30 degrees  
**`control` + `spacebar`** : Toggle penState  
**`⌘` + `F1`** : Select Pen 1  
**`⌘` + `F2`** : Select Pen 2  
**`⌘` + `F3`** : Select Pen 3  
**`⌘` + `F4`** : Select Pen 4  
**`⌘` + `F5`** : Select Pen 5  
**`⌘` + `F6`** : Select Pen 6  
**`⌘` + `F7`** : Select Pen 7  
**`⌘` + `F8`** : Select Pen 8  
**`⌘` + `F12`** : Toggle Visibility of Data Overlay  
**`escape`** : Put away the [[selectedPen]] if there is no pen selected bring the plotter to the home position ([maxWidth], [maxHeight])

**Pen Input from a wacom device will be drawn at the point where the cursor is located. (Coming Soon)**  
**Drag an SVG file onto the browser window to draw the interpolated shape onto the drawing surface. (Coming Soon)**  

# API Documentation

### **Serial Device Helpers**
#### **`serialRead()`**  
Reads data from the serialPort, stores the data into a serialBuffer, and syncs the read data between the server and client.

#### **`serialWrite(string, callback)`**  
Writes `string` to the serialPort and then call `callback` upon completion.

#### **`bufferedSerialWrite(commandArray, interval)`**  
Writes an array of serial commands to the plotter. The `commandArray` is structured as an array of pairs containing HPGL strings and a callback for that command. 
#### **`setupPlotter()`**  
Initializes the plotter and calibrates the software to be in sync with data queried from the device.

#### **`setPaperSizeAndOrientation(paperSize, [width=8.5], [height=11], [orientation='landscape'])`**  
Sets the paper size and orientation which in turn sets up the virtual plotting surface.  

The first parameter is not optional and expects a string that describes the `paperType`. The following options are provided as built-in size templates:  

`'Letter'`  
`'Legal'`  
`'Arch'`  
`'A2'`  
`'A3'`  
`'A4'`  
`'8.5x11'`  
`'9x12'`  
`'11x17'`  
`'12x19'`  

If the `papeType` parameter cannot be located in the paperType table a new definition will be created under the name of the string supplied. The new paper definition will be derived by the values entered as the `width`, `height`, and `orientation` parameters.  

### **Error Handling**
#### **`outputError()`**  
This function will update the error information displayed in the console. Use this command if your plotter's error light comes on and you want to learn what code is being thrown along with a description of the code.  

### **Pen Control**
#### **`penUp([x,y])`**  
The x and y parameters are optional. If no parameters are provided the command will send a simple "PU" (PEN-UP) command to the plotter instructing the device to lift the pen. If parameters of X and Y are provided the plotter will move the pen to the X,Y coordinates while keeping the pen raised.  

#### **`penDown([x,y])`**  
The x and y parameters are optional. If no parameters are provided the command will send a simple "PD" (PEN-UP) command to the plotter instructing the device to drop the pen onto the drawing surface. If parameters of X and Y are provided the plotter will move the pen to the specified (x,y) coordinates while keeping the pen down against the surface.  

#### **`home(movePenToMax)`**  
This function moves the pen position to the home position (0,0). If the parameter value is `true` the plotter will move to (`plottr.maxHeight`, `plottr.maxWidth`) instead of (0,0). 

### Drawing Functions  
#### **`line(x0,y0,x1,y1)`**  
Draws a line from point (X0,Y0) to point (X1,Y1)  

`line(1000,1000,2000,2000)`  

Draws a line from (1000,1000) to (2000,2000).  

#### **`rect(x,y,w,h)`**  
Draws a rectangle at point (X,Y) with width of W and height of H  

`rect(2000,2000,250,250)`  

Draws a rectangle at (2000,2000) with width of 250 and height of 250.

#### **`ellipse(x,y,w,h)`**  
Draws an ellipse with center at point (X,Y) and using width of W and height of H  

`ellipse(2250,2250,250,250)`  

Draws an ellipse centered at (2000,2000) with width of 250 and height of 250.

#### **`polygon(listOfPoints, [closed=true])`**  
Draws a polygon using `listOfPoints`. `listOfPoints` should be an array containing pairs of (x,y) coordinates.  

`polygon([[x0, y0],
          [x1, y1],
          [x2, y2],
          [x3, y3],
          ...
          ])`  

Draws a polygon by connecting lines between the points specified in `listOfPoints`. By default the polygon is closed, if the second parameter is passed as true the polygon will not be closed.

#### **`point(x,y)`**  
Plots point at (`x`,`y`).

`point(2250,2250)`

Draws a point at (2250,2250).

### Text Functions  
#### **`text(x, y, string)`**  
Plots `string` at (`x`,`y`).

`text(2000,2500,"plottr.js: formerly extinct, eternally distinct.")`

plots the phrase supplied as `string` at the point (2000,2500).

#### **`increaseFontWidth(amount)`**  
Increases the font-width size by scale  

#### **`decreaseFontWidth(amount)`**  
Decreases the font-width size by scale  

#### **`increaseFontWidth(amount)`**  
Increases the font-width size by scale  

#### **`decreaseFontWidth(amount)`**  
Decreases the font-width size by scale  

#### **`rotate(angle)`**  
Adds `angle` to the current `textAngle` variable. `angle` can be positive or negative and will wrap at 360 degrees. 
