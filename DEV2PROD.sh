
echo "******"
echo "To update the dev(elopment) version to be the prod(uction) version, do the following:"
echo ""

echo "  /bin/cp dev/*.* prod/."
echo "  /bin/cp index-dev.html index.html"
echo "  /bin/cp json-page-viewer-dev.html json-page-viewer.html"
echo ""

echo "Open index.html, and:"
#echo "   replace all dev/ links to prod/"
echo "   change the link at the bottom to give access to the bleeding edge version (<!-- -->)"
#echo "Open prod/SolrEF-result-set.json, and:"
#echo "   change 'page-viewer-dev.html' to 'page-viewer.html'"
echo ""

echo "Now run:"
echo ""
echo "  git status"
echo ""
echo "to see if what needs to be committed.  Note, there may be some new files to add"

echo "******"
