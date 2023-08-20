#!/bin/bash
cp template1.html $1.html
echo $2 >> $1.html
cat template2.html >> $1.html
echo "<p class=\"display-4 text-center\">$2</p>" >> $1.html
md2html $1.md >> $1.html
cat template3.html >> $1.html
