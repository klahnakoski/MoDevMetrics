




Running Examples (Query Tool)
-----------------------------

ElasticSearch Head is a simple tool for sending general queries.
Query Tool can be used to prototype Qb queries, and see their equivalent ES query.


Schema
------

The history of each bug is stored as a set of documents.  Each document is a
snapshot of the bug between ```modified_ts``` and ```expires_on```.  All times
are in milliseconds since epoch (GMT).

TODO: add reference to bz schema



Query Current State of All Bugs
-------------------------------

It is common to query the current bug state.  To do this you take advantage of
the fact that current documents have ```expires_on``` set to the deep future.
It is a simple matter to ensure all you queries include

    {"range":{"expires_on":{"gte":NOW}}}

where ```NOW``` is in milliseconds since epoch (GMT).  For example,
1389453465000 == 11-Jan-2014 15:17:45 (GMT) (notice the extra three zeros
indicating milliseconds)

Current Bugs
------------

Lets look at all the bugs in a project called **KOI**.  This project is tracked
using the Blocking B2G flag in Bugzilla.  Both Bugzilla and the ElasticSearch
use a ```cf_``` prefix on tracking flags; Our filter looks like
```{"term":{"cf_blocking_b2g":"koi+"}}```.

<table>
<tr>
<td>
<b>ElasticSearch</b><br>
<pre>{
  "query":{"filtered":{
    "query":{"match_all":{}},
    "filter":{"and":[
    {"match_all":{}},
    {"and":[
        {"range":{"expires_on":{"gte":1389389493271}}},
        {"term":{"cf_blocking_b2g":"koi+"}}
      ]}
    ]}
  }},
  "from":0,
  <strong>"size":200000,  # Number of documents to return</strong>
  "sort":[]
}</pre>
</td>
<td>
<b>Qb Query</b>
<pre>{
  "from":"public_bugs",
  <strong>"select":"_source",  # magic word '_source'</strong> 
  "esfilter":{"and":[
    {"range":{"expires_on":{"gte":1389389493271}}},
    {"term":{"cf_blocking_b2g":"koi+"}}
  ]}
}</pre><br>
<i>Qb queries are intended to be more like SQL, with familiar clauses, and
simpler syntax.  Benefits will be more apparent as we push the limits of ES's
query language: Qb queries will isolate us from necessary scripting,
multifaceting, and nested queries</i>
</td>
</tr>
</table>

Just Some Fields
----------------

The bug version documents returned by ElasticSearch can be big.  If you are
interested in larger sets of bugs, and not interested in every detail, you can
restrict your query to just the fields you desire.

<table>
<tr>
<td>
<b>ElasticSearch</b><br>
<pre>{
  "query":{"filtered":{
    "query":{"match_all":{}},
    "filter":{"and":[
      {"match_all":{}},
      {"and":[
        {"range":{"expires_on":{"gte":1389389493271}}},
        {"term":{"cf_blocking_b2g":"koi+"}}
      ]}
    ]}
  }},
  "from":0,
  "size":200000,
  "sort":[],
  <strong>"fields":[  # field list
        "bug_id",
        "bug_state",
        "modified_ts"
  ]</strong>
}</pre>
</td>
<td>
<b>Qb Query</b>
<pre>{
  "from":"public_bugs",
  <strong>"select":[   # field list
    "bug_id",
    "bug_status",
    "modified_ts"
  ],</strong>
  "esfilter":{"and":[
    {"range":{"expires_on":{"gte":NOW}}},
    {"term":{"cf_blocking_b2g":"koi+"}}
  ]}
}</pre><br>
<i>An array in the <code>select</code> clause will have the query return an
array of JSON objects with given attributes.  No select array means the query
returns raw values only.

</i>
</td>
</tr>
</table>

Aggregation
-----------

ElasticSearch has limited options when it comes to aggregates, but the ones it
does do are very fast.  Here is a count of all KOI bugs by product:

<table>
<tr>
<td>
<b>ElasticSearch</b><br>
<pre>{
  "query":{"filtered":{
    "query":{"match_all":{}},
    "filter":{"and":[
      {"match_all":{}},
      {"and":[
        {"range":{"expires_on":{"gte":1389389493271}}},
        {"term":{"cf_blocking_b2g":"koi+"}}
      ]}
    ]}
  }},
  "from":0,
  "size":0,
  "sort":[],
  <b>"facets":{"default":{"terms":{
    "field":"product",
    "size":200000
  }}}</b>
}
</pre>
</td>
<td>
<b>Qb Query</b>
<pre>{
  "from":"public_bugs",
  <b>"select":{
    "name":"num_bugs",
    "value":"bug_id",
    "aggregate":"count"
  },</b>
  "esfilter":{"and":[
    {"range":{"expires_on":{"gte":1389389493271}}},
    {"term":{"cf_blocking_b2g":"koi+"}}
  ]},
  <b>"edges":["product"]</b>
}
</pre><br>
<i>In this case, the <code>edges</code> clause is simply a list of columns to group by.</i>
</td>
</tr>
</table>


Open Bugs
---------

The Bugzilla database is dominated by closed bugs.  It is often useful to limit
our requests to open bugs only.  Personally, my strategy is to find bugs *not*
marked closed.  This way new bug states (open or closed) will reveal themselves.
Here is a count of all open bugs by product.


<table>
<tr>
<td>
<b>ElasticSearch</b><br>
<pre>{
  "query":{"filtered":{
    "query":{"match_all":{}},
    "filter":{"and":[
      {"match_all":{}},
      {"and":[
        {"range":{"expires_on":{"gte":1389389493271}}},
        <b>{"not":{"terms":{"bug_status":[
          "resolved",
          "verified",
          "closed"
        ]}}}</b>
      ]}
    ]}
  }},
  "from":0,
  "size":0,
  "sort":[],
  "facets":{"default":{"terms":{
    "field":"product",
    "size":200000
  }}}
}
</pre>
</td>
<td>
<b>Qb Query</b>
<pre>{
  "from":"public_bugs",
  "select":{
    "name":"num_bugs",
    "value":"bug_id",
    "aggregate":"count"
  },
  "esfilter":{"and":[
    {"range":{"expires_on":{"gte":1389389493271}}},
    <b>{"not":{"terms":{
      "bug_status":["resolved","verified","closed"]
    }}}</b>
  ]},
  "edges":["product"]
}</pre>
</td>
</tr>
</table>


Historical Query
----------------

To query a point in time, we look for records that straddle the point in time
we are interested in (```modified_ts <= sometime < expires_on```).  Here is
look at the number of open bugs back in Jan 1st, 2010:

<table>
<tr>
<td>
<b>ElasticSearch</b><br>
<pre>{
    "query":{"filtered":{
    "query":{"match_all":{}},
    "filter":{"and":[
      {"match_all":{}},
      {"and":[
        <b>{"range":{
          "expires_on":{"gt":1262304000000}  # Jan 1st, 2010
        }},
        {"range":{
          "modified_ts":{"lte":1262304000000}
        }},</b>
        {"not":{"terms":{"bug_status":[
          "resolved",
          "verified",
          "closed"
        ]}}}
      ]}
    ]}
  }},
  "from":0,
  "size":0,
  "sort":[],
  "facets":{"default":{"terms":{
    "field":"product",
    "size":200000
  }}}
}</pre>
</td>
<td>
<b>Qb Query</b>
<pre>{
    "from":"public_bugs",
  "select":{
        "name":"num_bugs",
        "value":"bug_id",
        "aggregate":"count"
    },
  "esfilter":{"and":[
    <b>{"range":{
      "expires_on":{"gt":1262304000000}   # Jan 1st, 2010
    }},
    {"range":{"modified_ts":{"lte":1262304000000}}},</b>
    {"not":{"terms":{"bug_status":[
      "resolved",
      "verified",
      "closed"
    ]}}}
  ]},
  "edges":["product"]
}</pre>
</td>
</tr>
</table>


Open Bugs, Over Time
--------------------

ElasticSearch has the [Date Histogram](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-facets-date-histogram-facet.html) which can be used to group documents by thier timestamps.  This does not work for the Bugzilla data in ES; Bug version records are valid for a time range, there can be multiple records for any given time interval, and there can multiple time intervals covered by a single version document.



ElasticSearch Features
-----------------------

  * [Date Histogram](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-facets-date-histogram-facet.html) - Group a timestamp by year, quarter, month, week, day, hour, minute.
  * [Relations and Joins](http://blog.squirro.com/post/45191175546/elasticsearch-and-joining) - Setup parent/child relations and query both in single request.
  * [General Joins](https://github.com/elasticsearch/elasticsearch/issues/2674) - Cache a query result and then use it in subsequent queries.


Closing Bugs
------------


Number of bugs at a certain time


Opening Bugs

Closing Bugs


