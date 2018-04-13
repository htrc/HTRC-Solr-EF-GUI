#!/bin/bash

/bin/rm -f new-index-dev-header-link-script.html

# <link href="assets/HTRC-Solr-EF-GUI/assets/paging.css" rel="stylesheet">

while read f; do
  if [ "x$f" != "x" ] ; then
    echo '<link href="'$f'" rel="stylesheet">' >> new-index-dev-header-link-script.html
  else
    echo "" >> new-index-dev-header-link-script.html
  fi
done < link-header.txt

while read f; do
  if [ "x$f" != "x" ] ; then
    echo '<script src="'$f'" type="text/javascript"></script>' >> new-index-dev-header-link-script.html
  else
    echo "" >> new-index-dev-header-link-script.html
  fi
done < script-header.txt


/bin/rm -f new-index-dev-body-link-script.html

# <script type="text/javascript" src="assets/HTRC-Solr-EF-GUI/assets/htrcwarnings.js"></script>

while read f; do
  if [ "x$f" != "x" ] ; then
    echo '<link href="'$f'" rel="stylesheet">' >> new-index-dev-body-link-script.html
  else
    echo "" >> new-index-dev-body-link-script.html
  fi
done < link-body.txt

while read f; do
  if [ "x$f" != "x" ] ; then
    echo '<script src="'$f'" type="text/javascript"></script>' >> new-index-dev-body-link-script.html
  else
    echo "" >> new-index-dev-body-link-script.html
  fi
done < script-body.txt

cat new-index-dev-body-link-script.html new-index-dev-body-after.html > new-index-dev-body.html


chmod u+w new-index-dev.html
cat new-index-dev-header-before.html new-index-dev-header-link-script.html new-index-dev-header-after.html \
    new-index-dev-body.html \
    new-index-dev-footer.html > new-index-dev.html
chmod u-w new-index-dev.html


/bin/rm -f new-new-index-dev-body.html

#cat new-index-dev-body.html \
# | sed 's/assets\//assets\/HTRC-Solr-EF-GUI\/assets\//g' \
# | sed 's/dev\//assets\/HTRC-Solr-EF-GUI\/dev\//g' \
# > new-new-index-dev-body.html


cat new-index-dev-body-link-script.html \
 | sed 's/assets\//assets\/HTRC-Solr-EF-GUI\/assets\//g' \
 | sed 's/dev\//assets\/HTRC-Solr-EF-GUI\/dev\//g' \
 >> new-new-index-dev-body.html

cat new-new-index-dev-body-extra-style.html >> new-new-index-dev-body.html
cat new-index-dev-body-after.html \
 | sed 's/assets\//assets\/HTRC-Solr-EF-GUI\/assets\//g' \
 | sed 's/dev\//assets\/HTRC-Solr-EF-GUI\/dev\//g' \
 >> new-new-index-dev-body.html


echo '[' > script-body.jsx

while read f; do
  if [ "x$f" != "x" ] ; then
    echo '"'$f'",' \
     | sed 's/assets\//assets\/HTRC-Solr-EF-GUI\/assets\//g' \
     | sed 's/dev\//assets\/HTRC-Solr-EF-GUI\/dev\//g' \
     >> script-body.jsx
  fi
done < script-body.txt

echo ']' >> script-body.jsx

