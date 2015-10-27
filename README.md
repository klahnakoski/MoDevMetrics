
Mozilla Developer Metrics
=========================

Objective
---------

This project is designed to optimize the creation of dashboards using ElasticSearch data.   Dashboards are written as static HTML/Javascript; which can make AjAX calls to the public cluster; and provide an interactive experience with little effort.  

Examples
--------

[My page of charts](http://people.mozilla.org/~klahnakoski/charts.html) hosts the master branch of this repo.  Please
feel free to view and run them through your debugger.


Benefits
--------

  * **No Web Server** - Dashboards are simply Javascript (AJAX) and HTML.  There is no server to setup.
  * **No Schema** - ElasticSearch stores JSON documents with little fixed schema.  This is good for rapid prototyping,
  and makes it easy to annotate data without adding the complications of data migration.
  * **Code is versionable** - Data topology and data queries are described in JSON, dashboard layout is HTML and CSS.
  This makes the code (and changes to the code) amenable to version control.
  * **Queries are JSON** - Queries are in JSON structures, which are easily transmitted or serialized, and are easily
  handled by both Javascript and Python.  The Qb query form provides an abstraction layer between the docstore/database
  holding the data and the charting/stats package performing the analysis.


Drawbacks
---------

  * **No GUI tools** - There is no drag-and-drop query builder, You must be proficient in SQL and other high level list
  comprehensions.
  * **No GUI Layout** - Layout of dashboard is done in HTML and CSS.
  * **Limited Charting** (for now) - There are better charting libraries out there.

Requirements
------------

Access to one of the bug clusters is required:

  - HTTPS proxy to public cluster<br> ```https://esfrontline.bugzilla.mozilla.org:443/public_bugs/bug_version```
  - Non-encrypted proxy to public cluster<br>```http://esfrontline.bugzilla.mozilla.org:80/public_bugs/bug_version```
  - Direct to private cluster (need VPN access)<br>```http://elasticsearch-private.bugs.scl3.mozilla.com:9200/private_bugs/bug_version```

Due to restrictions on the public cluster, it is best to test it with the [the
minimum viable example page](html/Tutorial01-Minimum.html).  The clusters
behind VPN can be tested normally with [ElasticSearch Head](https://github.com/mobz/elasticsearch-head).

Install
-------

    git clone https://github.com/klahnakoski/MoDevMetrics.git

    Cloning into 'MoDevMetrics'...
    remote: Counting objects: 6563, done.
    remote: Compressing objects: 100% (3142/3142), done.
    remote: Total 6563 (delta 4485), reused 5226 (delta 3148)
    Receiving objects: 100% (6563/6563), 17.89 MiB | 234 KiB/s, done.
    Resolving deltas: 100% (4485/4485), done.
    Checking out files: 100% (437/437), done.

Branches
--------

Multiple branches are in this repo:

* **dev** - Mostly working version, found at http://people.mozilla.org/~klahnakoski/modevmetrics/
* **ETL** - stable working version responsible for some additional ETL
* **corruption fixer** - code that fixes some inconsistencies due to data extraction anomalies in the original ETL
* **master** - not used
* **merge** - an attempt to upgrade the MoDevLibrary
* **perfy** - working version of the Perfy performance dashboard (no longer in use)
* **review** - for the review queue dashboards
* **selenium_test** - attempt to bring in a testing framework
* **talos** - for Talos performance tracking dashboard (no longer in use)


Examples
--------

Code examples to demonstrate minimum functionality:

  * [Test public connectivity](html/Tutorial01-Minimum.html)
  * [Get comments](html/Tutorial02-Comments.html)
  * [Simple Bug Count](html/Tutorial03-Bug-Count.html)

Running Tests
-------------

Tests use Python and Selenium

  * Install Python [instructions](https://github.com/klahnakoski/pyLibrary#windows-7-install-instructions-for-python)
  * Install libraries required for testing:  ```pip install -r tests\requirements.txt```
  * Run tests: ```py.test tests```

They take a long time to run, and require you have access to one of the bug clusters.

Tutorials
----------

  - [Tutorial on querying ElasticSearch](https://github.com/klahnakoski/Qb/tree/master/docs/BZ_Tutorial.md)
  - [Tutorial on MVEL and advanced querying](https://github.com/klahnakoski/Qb/tree/master/docs/MVEL_Tutorial.md)
  - [Reference document covering the query format](https://github.com/klahnakoski/Qb/tree/master/docs/Qb_Reference.md)
  - [Dimension Definitions](https://github.com/klahnakoski/Qb/tree/master/docs/Dimension Definitions.md)
