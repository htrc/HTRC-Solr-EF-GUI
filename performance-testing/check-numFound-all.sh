for f in $*/json-output/*.json ; do
    echo "File: $f"
    ./check-numFound.sh $f
done 
