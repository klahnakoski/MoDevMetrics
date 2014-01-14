MVEL Tutorial
=============

About MVEL
----------

All of the queries in this section require writing scripts in a [scripting
language called MVEL](http://mvel.codehaus.org/). MVEL is powerful because it
is ES's default scripting language, it is run server-side, and can be used to
further analyse documents before the query results are returned.

MVEL is fine for short scripts, but becomes tricky as the code logic becomes
more complex, mainly because of poor documentation.  I chose MVEL over other
pluggable scripting languages, because I wanted ES installation to remain easy
for others.

**MVEL has been disabled on the public cluster** because it is has access to
all the references inside the Java virtual machine.  If you want to perform
the queries in this tutorial you must [setup your own cluster](Replication.md)
and replicate the public ES cluster.



Open Bugs, Over Time
--------------------

ElasticSearch has the [Date Histogram](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-facets-date-histogram-facet.html)
which can be used to group documents by their timestamps.  This does not work
for the Bugzilla data in ES; Bug version records are valid for a time range,
there can be multiple records for any given time interval, and there can
multiple time intervals covered by a single version document.  Because of this
many-many relation, we use one facet for each interval we are interested in.
In this case, we are interested in 26 weeks of date from end fo June to end of
December.


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
				{"term":{"cf_blocking_b2g":"koi+"}},
				{"not":{"terms":{"bug_status":["resolved","verified","closed"]}}}
			]}
		]}
	}},
	"from":0,
	"size":0,
	"sort":[],
	"facets":{
		"0":{
			"terms":{"script_field":"1","size":200000},
			"facet_filter":{"and":[{"and":[
				{"range":{"modified_ts":{"lte":1372550400000}}},
				{"or":[
					{"missing":{"field":"expires_on"}},
					{"range":{"expires_on":{"gte":1372550400000}}}
				]}
			]}]}
		},
		<b>... snip 24 entries ...</b>
		"25":{
			"terms":{"script_field":"1","size":200000},
			"facet_filter":{"and":[{"and":[
				{"range":{"modified_ts":{"lte":1387670400000}}},
				{"or":[
					{"missing":{"field":"expires_on"}},
					{"range":{"expires_on":{"gte":1387670400000}}}
				]}
			]}]}
		}
	}
}</pre>
</td>
<td>
<b>Qb Query</b>
<pre>{
	"from":"public_bugs",
	"select":{"name":"num_bugs","value":"bug_id","aggregate":"count"},
	"esfilter":{"and":[
		{"term":{"cf_blocking_b2g":"koi+"}},
		{"not":{"terms":{"bug_status":["resolved","verified","closed"]}}}
	]},
	"edges":[{
		"name":"date",
		"range":{"min":"modified_ts","max":"expires_on"},
		"allowNulls":false,
		"domain":{
			"type":"time",
			"min":1372550400000,
			"max":1388275200000,
			"interval":"week"
		}
	}]
}</pre><br>
<i>The edges clause defines how the data is grouped (aka partitioned)
before the aggregate is calculated.  The Qb result will contain data for evey
partition in the domain, even if it is empty.</i>
</td>
</tr>
</table>
