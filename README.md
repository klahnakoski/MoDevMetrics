
Mozilla Developer Metrics
=========================



Requirements
------------

Access to one of the bugs clusters is required

  - Proxy to public cluster (need VPN to **TOR**)<br>'``http://klahnakoski-es.corp.tor1.mozilla.com:9201/public_bugs/bug_version```
  - Proxy to public cluster<br>```http://esfrontline1.bugs.scl3.mozilla.com:9292/public_bugs/bug_version```
  - Direct to the public cluster<br>```http://elasticsearch1.bugs.scl3.mozilla.com:9200/public_bugs/bug_version```
  - Proxy to private cluster (need VPN to **TOR**)<br>```http://klahnakoski-es.corp.tor1.mozilla.com:9204/private_bugs/bug_version```
  - Metrics' private cluster (need VPN to **MPT**)<br>```http://elasticsearch7.metrics.scl3.mozilla.com:9200/bugs/bug_version```
  - Direct to private cluster (need **LDAP**)<br>```http://elasticsearch4.bugs.scl3.mozilla.com:9200/private_bugs/bug_version```

Setup
-----

    git clone https://github.com/klahnakoski/MoDevMetrics.git
    
    Cloning into 'MoDevMetrics'...
	remote: Counting objects: 6563, done.
	remote: Compressing objects: 100% (3142/3142), done.
	remote: Total 6563 (delta 4485), reused 5226 (delta 3148)
	Receiving objects: 100% (6563/6563), 17.89 MiB | 234 KiB/s, done.
	Resolving deltas: 100% (4485/4485), done.
	Checking out files: 100% (437/437), done.

Other Notes
-----------
The interesting code starts in [./html/es](./html/es)

  - [Tutorial on querying ElasticSearch](docs/BZ_Tutorial.md)
  - [Tutorial on MVEL and advanced querying](docs/MVEL_Tutorial.md)
  - [Reference document covering the query format](docs/Qb_Reference.md)
  - [Dimension Definitions](docs/Dimension Definitions.md)