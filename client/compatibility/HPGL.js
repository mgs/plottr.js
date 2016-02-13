var vectorGroup = {
  AA: "arcAbsolute",
  AR: "arcRelative",
  CI: "circle",
  CT: "chordTolerance",
  PA: "plotAbsolute",
  PU: "penUp",
  PD: "penDown",
  PR: "plotRelative",
  EP: "edgePolygon",
  FP: "fillPolygon",
  FT: "fillType",
  PT: "penThickness",
  PM: "polygonMode",
  RA: "shadeRectangleAbsolute",
  RR: "shadeRectangleRelative",
  ER: "edgeRectangleRelative",
  WG: "shadeWedge",
  EW: "edgeWedge",
  UF: "userDefinedFillType"
}

var characterGroup = {
  BL: "bufferedLabelString",
  CA: "designateAlternateCharacterSet",
  CC: "characterChordAngle",
  CM: "characterSelectionMode",
  CP: "characterPlot",
  CS: "designateStandardCharacterSet",
  DI: "absoluteDirection",
  DL: "defineDownloadableCharacter",
  DR: "relativeDirectionCharacterSet",
  DS: "designateCharacterSetIntoSlot",
  DT: "defineTerminator",
  DV: "verticalLabelDirection",
  ES: "extraSpace",
  IV: "invokeCharacterSlot",
  LB: "label",
  LO: "labelOrigin",
  OL: "outputLabelLength",
  PB: "printBufferedLabel",
  SA: "selectAlternateSet",
  SI: "absoluteCharacterSize",
  SL: "characterSlant",
  SR: "relativeCharacterSize",
  SS: "selectStandardSet",
  UC: "userDefinedCharacter",
  KB: "kanji"
}

var lineTypeGroup = {
  LT: "lineType",
  SM: "symbolMode",
  SP: "selectPen",
  AS: "accelerationSelect",
  VS: "velocitySelect",
  FS: "forceSelect",
  FC: "cutterOffset",
  FD: "bladeRotationControl"
}

var digitizeGroup = {
  DC: "digitizeClear",
  DP: "digitizePoint",
  OD: "outputDigitizedPointAndPenStatus"
}

var axisGroup = {
  TL: "tickLength",
  XT: "xTick",
  YT: "yTick"
}

var setupGroup = {
  IP: "inputP1AndP2",
  OP: "outputP1AndP2",
  SC: "scale",
  OW: "outputWindow"
}

var configurationAndStatusGroup = {
  DF: "defaults",
  IM: "inputMask",
  IN: "initialize",
  OA: "outputActualPositionAndPenStatus",
  OC: "outputCommandedPositionAndPenStatus",
  OE: "outputError",
  OF: "outputFactor",
  OH: "outputHardClipLimits",
  OI: "outputIdentification",
  OO: "outputOption",
  OS: "outputStatus",
  OT: "outputTurretType",
  GM: "graphicsMemory"
}

var paperAdvanceGroup = {
  PG: "pageSet",
  AP: "automaticPenOperation",
  NR: "notReady",
  RO: "rotateCoordinateSystem",
  AF: "advanceFullPage",
  AH: "advanceHalfPage",
  PG: "pageFeed"
}

var HPGL = jQuery.extend(vectorGroup,
                         characterGroup,
                         lineTypeGroup,
                         digitizeGroup,
                         axisGroup,
                         setupGroup,
                         configurationAndStatusGroup,
                         paperAdvanceGroup);
