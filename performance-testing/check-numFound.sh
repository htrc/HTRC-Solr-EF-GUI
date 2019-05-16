#!/bin/bash

cat $* \
 | python -c 'import json,sys; print json.load(sys.stdin)["response"][u"numFound"]'
