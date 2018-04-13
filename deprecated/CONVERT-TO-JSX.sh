#!/bin/bash

# remove comments

cat index-dev-body.html | sed '/<!--.*-->/d' | sed '/<!--/,/-->/d' > /tmp/no-comments.xml

cat /tmp/no-comments.xml \
  | sed 's/dev\//HTRC-Solr-EF-GUI\/dev\//g' \
  | sed 's/class=/className=/g' \
  | sed 's/&nbsp;/ANDNBSP/g' > /tmp/fixed-class.xml

# cat /tmp/fixed-class.xml | sed 's/style="\([^"]*\)"/style={{\1}}/g' | sed 's/{{\([^-]+\)-\(.\)\([^}]+\)}}/{{\1\U\2\3}}/g'

xmllint --format /tmp/fixed-class.xml | ./css-to-jsx.pl | sed 's/ANDNBSP/&nbsp;/g' > index-dev-body.jsx
#cat /tmp/fixed-class.xml | ./css-to-jsx.pl | sed 's/ANDNBSP/&nbsp;/g' > index-dev-body.jsx


#egrep "script|link" index-dev-header.html \
# | sed 's/assets\//assets\/HTRC-Solr-EF-GUI\/assets\//g' \
# | sed 's/dev\//assets\/HTRC-Solr-EF-GUI\/dev\//g' \
# > link-script.jsx

