

run_cmd=0;

if [ "x$1" = "-f" ] ; then
    run_cmd=1
elif [ "x$1" = "-force" ] ; then
    run_cmd=1
elif [ "x$1" = "--force" ] ; then
    run_cmd=1
fi


cmd1='/bin/cp dev/*.* prod/.'
cmd2='/bin/cp index-body-dl-dev.html index-body-dl.html'
cmd3='/bin/cp index-dev.html index.html'
cmd4='/bin/cp json-page-viewer-dev.html json-page-viewer.html'

if [ $run_cmd = 1 ] ; then
    echo "Updating production version to be the same as the development version"
    $cmd1 && $cmd2 && $cmd3 && $cmd4
    if [ $? != 0 ] ; then
	echo -e "Error encountered running:\n   $cmd1 && $cmd2 && $cmd3 && $cmd4" 1>&2
	exit 1
    fi
else

    echo "******"
    echo "To update the dev(elopment) version to be the prod(uction) version, do the following:"
    echo ""

    echo "  $cmd1"
    echo "  $cmd2"
    echo "  $cmd3"
    echo "  $cmd4"
    echo ""
    
    echo "Alternatively, run: "
    echo "  ./DEV2PROD.sh --force"
    echo ""
fi

echo "Not every file will have necessarily been changed. Run:"
echo ""
echo "  git status"
echo ""
echo "to see if what needs to be committed.  Note, there may be some new files to add."

echo "******"
