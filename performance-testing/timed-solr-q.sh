#!/bin/bash

#title_t:sherlock
#((volumetitle_txt:sherlock)) AND ((en_htrctokentext:violin))

q_arg="q=$*" 

extra_args="indent=on&wt=json&start=0&rows=15&facet=on&facet.field=genre_ss&facet.field=language_s&facet.field=rightsAttributes_s&facet.field=names_ss&facet.field=pubPlace_s&facet.field=bibliographicFormat_s&facet.field=classification_lcc_ss&facet.field=concept_ss"


base_url="https://solr1.htrc.illinois.edu/robust-solr/solr3456-faceted-htrc-full-ef16/select"

full_url="$base_url?$q_arg&$extra_args"
echo
echo wget -O result-page.json "$full_url"
echo

time wget -O result-page.json "$full_url"


