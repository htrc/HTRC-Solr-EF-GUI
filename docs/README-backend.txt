
The HTRC-Solr-EF-GUI web interface is an AJAX-based front-end that
relies on several backend web-based services to operate.

The purpose of this document is to detail these backend services. The
web servers themselves are configured to support Cross-Domain Ajax
Requests (CORS) and so the front-end interface can be located on a
different machine to the backend.

Servers
=======

The backend consists of:

  1. A set of Jetty servers that provide access to a Solr cloud for
       searching the Extracted Features JSON data

  2. An additional Jetty server provides the "HTRC-Access-EF" restful
       interface, supporting features such as the shopping-cart and
       downloading JSON EF files (which in turn reaches out to the
       htrc rsync server)

     The HTRC-Access-EF servlet itself makes use of a MongoDB server,
       used to store user selections for the shopping-cart amongst
       other things

  3. An Apache http 2.x server, acting as a gateway
       through ProxyPass rules to the servers listed above.

Installion #1
=============

The initial HTRC-Solr-EF-GUI + backend that was setup runs off solr1 and solr2.

  The web interface lives on solr1
  The 20 node Solr Cloud spans sorl1 and solr2
  The Mongo DB lives on solr1

You access this version through:

  https://solr1.htrc.illinois.edu/solr-ef/index.html

The default Solr collection that is searched through the
interface is 'faceted-htrc-full-ef20', which is the
20 node collection mentioned above.

It is possible to specify which Solr collection to search through the
'solr-col' CGI argument, so an equivalent to the above is:

  https://solr1.htrc.illinois.edu/solr-ef/index.html?solr-col=faceted-htrc-full-ef20

We will take advantage of this ability below.

Installation #2
===============

Upon purchasing the solr3-6 machines, a second HTRC-Solr-EF-GUI +
backend instance was set up.  This is a setup that focuses on
robustness, so in the event a server goes down, the overall system can
still operate.

In summary:
  The web interface lives on both solr1 and solr2
  A 16 node Solr Cloud spans sorl3-solr6, with replication x 2
  Both solr1 and solr2 run their own MongoDBs, which are separate

You can visit either:

  https://solr1.htrc.illinois.edu/solr-ef/index.html?solr-col=solr3456-faceted-htrc-full-ef16
or
  https://solr2.htrc.illinois.edu/solr-ef/index.html?solr-col=solr3456-faceted-htrc-full-ef16

to search the EF data.

In more detail, across solr3-6 there is a 16 shard collection of the
EF data with replication factor set to 2.  It has been tested that
taking one of these machines down doesn't stop the ability to search.

Concerning the front-end, if one of these machines goes down there is
nothing clever in place to direct you to the other machine.  However,
you can change to the other one (if you know about it), and use that
instead. The two front-end installs are essentially independent.  They
operate their own MongoDBs, so there is no sharing of information such
as what is in your shopping-cart for example.  If the code base has
changed, then both install need a separate 'git pull' to bring them up
to date.

SETUP
=====

Running the backed requires you to have ssh set up so you can
log in to other machines in the cloud without needing to
provide a password.

You also need set up your environment.

On solr1 & solr2, the setup files necessary to run HTRC-Solr-EF-Cloud
are installed in:

  /homea/solr-ef/HTRC-Solr-EF-Setup/HTRC-Solr-EF-Cloud/

On solr3-6:

  /opt/HTRC-Solr-EF-Setup/HTRC-Solr-EF-Cloud/

I have the following in my ~/.bashrc file so the right
setup file is sourced, regardless of which of the
machines solr1-solr6 I am logged in to.


  if [ -f /opt/HTRC-Solr-EF-Setup/SETUP.bash ] ; then
    source /opt/HTRC-Solr-EF-Setup/SETUP.bash
  else
    source /homea/solr-ef/HTRC-Solr-EF-Setup/SETUP.bash
  fi
    
The Solr cloud we operate is configured to work with Apache
Zookeeper.  It is used by Solr to make sure all the
common configuration files needed by Solr are shared
across the various machines.

To start Installation #1, on solr1:

  htrc-ef-zookeeper-start.sh
  htrc-ef-solr-start-all.sh 


To start Installation #2, on solr3:

  htrc-ef-zookeeper-start.sh
  htrc-ef-solr-start-all.sh

As a general rule, all the scripts used to control the installation
start 'htrc-', so typing this in followed by <tab> <tab> will let you
see the other commands available.

For example, you can shut down the above by running the following:

  htrc-ef-solr-stop-all.sh
  htrc-ef-zookeeper-stop.sh
  



