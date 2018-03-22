#!/bin/bash

chmod u+w index-dev.html
cat index-dev-header.html index-dev-body.html  index-dev-footer.html > index-dev.html
chmod u-w index-dev.html

