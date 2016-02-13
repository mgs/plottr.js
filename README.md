# plottr.js
Library for communicating with vintage pen plotters both for plotting or real-time interaction with the device.

This library was forked from plotter.js (http://github.com/mgs/plotter.js.git)

Plotter.js provided backend plumbing for working with pen plotters over serial. This library stitches a client-side model and user interface onto the backend to enable realtime usage of the pen plotter.

Known Issues:
  +Calibration
    - Calibration phase is still somewhat janky.
    -- Occasionally, the serial communication timing is not adequate and querying results in bad initial values for maxWidth and maxHeight.  When this occurs, a simple reload will (seemingly) always result in correct values. Not a huge problem but it needs to get fixed.
  +Manuals
    - Need to upload manual scans

Todo:
* UI Improvements
** Currently, there is a model representing the plotter surface on the client. This model is kept in sync with the actual coordinate data communicated by the plotter over serial. There is a canvas for representing this model on the screen but currently the canvas is displaying a minimal amount of information to the user.
*** Goal: A word-processor-like UI that provides a real-time visualization of plotter output during the current session. HPGL Markdown Language
* While the experience of using plottr.js is superficially similar to that of a typewriter, the project aims to also expose the full drawing power provided by HPGL, the lower-level language used to communicate commands to the device. To expose this power seamlessly, the software employs a modal scheme containing two primary modes: 
* 1) TEXT-ENTRY (TE) MODE
* 2) COMMAND-ENTRY (CE) MODE.
** TEXT-ENTRY (TE) Mode
*** The plotter behaves mostly like a type-writer, any ascii printable character that is typed is immediately communicated to the plotter and plotted at the current X-Y coordinates. 
** COMMAND-ENTRY (CE) MODE
*** This mode is used intermittently to communicate commands in HPGL or Javascript in-line.
