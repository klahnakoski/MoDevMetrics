

Review Schema
=============

Code reviews are specifically ETLed to be easier to query.  Due to their short lifespan, we can make many more assputions about them than we can bugs. 

Here are the properties of a review:

  * `requester` - *string* the person requesting the review; setting the `r?` flag
  * `request_type` - *string* 
  * `request_time` - *timestamp* time of the review request
  * `requester_review_num` - *string* the number of reviews requested before this one
  * `reviewer` - *string* person that did the review
  * `review_time` - *timestamp* time that the review was completed
  * ~~`review_type` - *string* "+" or "-"~~
  * `review_end_reason` - *string* one of "done", "obsolete", or "closed" 
  * `review_result` - *string* "+" or "-"
  * `review_duration` - *long* calculated `review_time - request_time`  
  * `is_first` - *string* the first review request for this bug
  * `bug_id` - *string* bug number 
  * `attach_id` - *string* attachment number
  * `bug_status` - *string* status of the bug st time of review request
  * `created_by` - *string* who created the bug
  * `product` - *string* product of the bug at time of request
  * `component` - *string* component of the bug at time of request
