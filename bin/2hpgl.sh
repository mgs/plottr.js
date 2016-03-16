#/bin/bash
FILE=${1}
EXT=${FILE/*./}
pstoedit -f plot-hpgl:penplotter $FILE ${FILE/.*/}.hpgl
