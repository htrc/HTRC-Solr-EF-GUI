#!/bin/bash

cat de-word-freq-top-5000-subtitles-raw.txt | sed 's/\([^ ]\+\)\s\+\([^ ]\+\)/\1 \2\n/g' > de-word-freq-top-5000.txt

