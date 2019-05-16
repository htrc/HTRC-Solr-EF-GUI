for f in $*/json-output/*.json ; do
    ./check-numFound.sh $f ;
done 
