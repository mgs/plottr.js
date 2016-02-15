# plottr.js
Library for communicating with vintage pen plotters both for plotting or real-time interaction with the device.  

# Installation
Clone this repository into a folder on your local machine. From your terminal you can enter the command:  

`git clone https://github.com/mgs/plottr.js.git ~/repos/plottr.js`  

This will clone the project into a folder on your machine located at '~/repos/plottr.js'.  

This project's only dependency is the Meteor javascript framework. If you don't have Meteor, it only takes a moment to install it: https://www.meteor.com/install  

Meteor will install all the necessary dependencies the first time that the project is run.  

# Usage

Once meteor is installed, the project can be started by entering the project directory from the terminal:  

`cd ~/repos/plottr.js`  

and then run the project in typical meteor fashion:  

`./plottr.sh`  

# Keyboard Controls  
**`←`**: Moves the cursor one unit left  
**`↑`**: Moves the cursor one unit up  
**`→`**: Moves the cursor one unit right  
**`↓`**: Moves the cursor one unit down  
**`⌘` + `↑`**: Increase the relative scale of the font-height by 5%  
**`⌘` + `↓`**: Decrease the relative scale of the font-height by 5%  
**`⌘` + `←`**: Decrease the relative scale of the font-width by 5%  
**`⌘` + `→`**: Increase the relative scale of the font-width by 5%  
**`Control` + `Spacebar`**: Toggle PEN-STATE  
**`⌘` + `F1`** : Select Pen 1  
**`⌘` + `F2`** : Select Pen 2  
**`⌘` + `F3`** : Select Pen 3  
**`⌘` + `F4`** : Select Pen 4  
**`⌘` + `F5`** : Select Pen 5  
**`⌘` + `F6`** : Select Pen 6  
**`⌘` + `F7`** : Select Pen 7  
**`⌘` + `F8`** : Select Pen 8  
**`⌘` + `F12`**: Toggle Visibility of Data Overlay  
**`Escape`**: Put Away Selected Pen  

Pen Input from a wacom device will be drawn at the point where the cursor is located. (Coming Soon)  
Drag an SVG file onto the browser window to draw the interpolated shape onto the drawing surface. (Coming Soon)  

# API Documentation
## **Error Handling**
**`outputError()`**  
This function will update the error information displayed in the console. Use this command if your plotter's error light comes on and you want to learn what code is being thrown along with a description of the code.  
## **Pen Control**
**`penUp([x,y])`**  
If no parameters are provided the command will send a simple "PU" (PEN-UP) command to the plotter instructing the device to lift the pen. If parameters of X and Y are provided the plotter will move the pen to the X,Y coordinates while keeping the pen raised.  

**`penDown([x,y])`**  
If no parameters are provided the command will send a simple "PD" (PEN-UP) command to the plotter instructing the device to drop the pen onto the drawing surface. If parameters of X and Y are provided the plotter will move the pen to the specified X,Y coordinates while keeping the pen down against the surface.  

## Drawing Functions
**`line(x0,y0,x1,y1)`**  
Draws a line from point (X0,Y0) to point (X1,Y1)  

**`rect(x,y,w,h)`**  
Draws a rectangle at point (X,Y) with width of W and height of H  

**`ellipse(x,y,w,h)`**  
Draws an ellipse with center at point (X,Y) and using width of W and height of H  

**`point(x,y)`**  
draw a point at the specified (X,Y) coordinates  

## Text Functions
**`text(x, y, string)`**  
plots the specified STRING starting at point (X,Y)  

**`incrementFontWidthSize(scale)`**  
increments the font-width size by scale  

**`decrementFontWidthSize(scale)`**  
decrements the font-width size by scale  

**`incrementFontWidthSize(scale)`**  
increments the font-width size by scale  

**`decrementFontWidthSize(scale)`**  
decrements the font-width size by scale  
