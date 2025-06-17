Solr EF Web-search Frontend
===========================

Front-end web web interface for searching the Solr-ingested Extracted
Feature (EF) dataset.  The web interface supports searching at the
volume-level (metadata) and page-level (text and metadata) through
AJAX calls to the Solr cloud where the data set has been ingested.

The code has been configured to work with the different versions of
the EF dataset (EF v1.0, EF v1.5, and EF v2.0 at the time of writing).
This is triggered by the URL that the web interface presents as:

  .../solr-ef/index.html

for EF v1.0 and EF v1.5

  .../solr-ef20/index.html

for EF v2.0

The code unpacks, read go from within a web server's document root
directory, or otherwise sliced in through the web server's config
files.  For example:

    cd /var/www/html/
    git clone https://github.com/htrc/HTRC-Solr-EF-GUI.git solr-ef20

(subject to appropriate write-permissions in 'html')

Then in your web browser view:

    https://<my-web-server-domain>/solr-ef20/

(assuming your web server is configured to serve over https)

to display the Extracted Feature web search interface.
