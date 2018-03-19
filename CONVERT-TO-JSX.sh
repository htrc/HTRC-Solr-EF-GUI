#!/bin/bash

# remove comments

cat index-dev-body.html | sed '/<!--.*-->/d' | sed '/<!--/,/-->/d' > /tmp/no-comments.xml

cat /tmp/no-comments.xml | sed 's/class=/className=/g' > /tmp/fixed-class.xml

# cat /tmp/fixed-class.xml | sed 's/style="\([^"]*\)"/style={{\1}}/g' | sed 's/{{\([^-]+\)-\(.\)\([^}]+\)}}/{{\1\U\2\3}}/g'

cat /tmp/fixed-class.xml | ./css-to-jsx.pl | sed 's/(//g' | sed 's/)//g' 


