#!/bin/bash


q_arg="q=$*" 

extra_args="indent=on&wt=json&start=0&rows=15&facet=on&facet.field=genre_ss&facet.field=language_s&facet.field=rightsAttributes_s&facet.field=names_ss&facet.field=pubPlace_s&facet.field=bibliographicFormat_s&facet.field=classification_lcc_ss&facet.field=concept_ss"


base_url="https://solr1.htrc.illinois.edu/robust-solr/solr3456-faceted-htrc-full-ef16/select"

full_url="$base_url?$q_arg&$extra_args"

if [ ! -e "json-output" ] ; then
    echo "Creating directory: json-output"
    mkdir json-output
fi

q_file=`echo $1 | sed 's/:/-/g' | sed 's/ /_/g'`
ofile="json-output/result-page--$q_file--$$.json"

echo
echo wget -O "$ofile" "$full_url"
echo

time wget -O "$ofile" "$full_url"


