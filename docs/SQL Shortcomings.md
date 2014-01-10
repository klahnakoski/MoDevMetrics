

SQL Shortcomings
================

Here is a core dump of the anti-patterns I see when dealing with SQL.  One day I will detail the problems, an show the Qb query solutions




Splitting credit and debit

    CASE WHEN sum(t.amount)>0 THEN round(sum(t.amount)/100,2) ELSE NULL END credit,
    CASE WHEN sum(t.amount)<0 THEN round(sum(t.amount)/100,2) ELSE NULL END debit,

Money

    SELECT 
        case when w.txn_type='SEN' then round((w.principal_amount / 100),2) ELSE 0 end SendAmount,
        case when w.txn_type='SEN' then round((w.charges / 100),2) else 0 end SendFees,
        case when w.txn_type='REC' then round((w.principal_amount / 100),2) ELSE 0 end RefundAmount,
        case when w.txn_type='REC' then round((w.charges / 100),2) else 0 end RefundFees

Reporting multiple dimesions as columns

    sum(case when code='thisDay' then num_opened else 0 end) thisDay_opened,
    sum(case when code='thisDay' then num_closed else 0 end) thisDay_closed,
    sum(case when code='this7Day' then num_opened else 0 end) this7Day_opened,
    sum(case when code='this7Day' then num_closed else 0 end) this7Day_closed,
    sum(case when code='thisMonth' then num_opened else 0 end) thisMonth_opened,
    sum(case when code='thisMonth' then num_closed else 0 end) thisMonth_closed,
    sum(case when code='lastMonth' then num_opened else 0 end) lastMonth_opened,
    sum(case when code='lastMonth' then num_closed else 0 end) lastMonth_closed,
    
Normalizing to 1000's or millions

    sum(case when code='thisDay' then 1000000*(num_opened)/population else 0 end) thisDay_opened_pct,
    sum(case when code='thisDay' then 1000000*(num_closed)/population else 0 end) thisDay_closed_pct,
    sum(case when code='this7Day' then 1000000*(num_opened)/population else 0 end) this7Day_opened_pct,
    sum(case when code='this7Day' then 1000000*(num_closed)/population else 0 end) this7Day_closed_pct,
    sum(case when code='thisMonth' then 1000000*(num_opened)/population else 0 end) thisMonth_opened_pct,
    sum(case when code='thisMonth' then 1000000*(num_closed)/population else 0 end) thisMonth_closed_pct,
    sum(case when code='lastMonth' then 1000000*(num_opened)/population else 0 end) lastMonth_opened_pct,
    sum(case when code='lastMonth' then 1000000*(num_closed)/population else 0 end) lastMonth_closed_pct,

Left join of dimenstion and ALL partitions

    FROM
        (
        SELECT
            p.zone,
            max(ordering) ordering,
            sum(population) population
        FROM
            provinces p
        GROUP BY
            p.zone
        ) p
    LEFT JOIN
        BLAH BLAH


Again, the partions

    LEFT JOIN
        temp_time_ranges r
    ON
        time_convert(r.mindate, 'EDT', 'GMT') <= s.date AND
        s.date < time_convert(r.maxdate, 'EDT', 'GMT')


Showing both volume and count

    sum(CASE WHEN r.code='this90Day' THEN s.quantity ELSE 0 END)/90*30 quantity_90,
    sum(CASE WHEN r.code='this90Day' THEN s.volume ELSE 0 END)/90*30 volume_90,

Show by hour of day, spit by column

    hour(time_convert(t.transaction_date, 'GMT', 'EDT')) hour_of_day,
    sum(CASE WHEN t.type NOT IN('Fees', 'Load-Bill Payment', 'Corporate Load', 'Load-Bank Transfer') THEN 1 ELSE 0 END)/91*30 numOther,
    sum(CASE WHEN t.type='Fees' THEN 1 ELSE 0 END)/91*30 numFees,
    sum(CASE WHEN t.type='Load-Bill Payment' THEN 1 ELSE 0 END)/91*30 numBillPayment,
    sum(CASE WHEN t.type='Load-Bank Transfer' THEN 1 ELSE 0 END)/91*30 numBankTransfer,
    sum(CASE WHEN t.type='Corporate Load' THEN 1 ELSE 0 END)/91*30 numCorporate


Report by timezone, using num open, num closed, and net

    hour(time_convert(t.transaction_date, 'GMT', 'EDT')) hour_of_day,
    sum(CASE WHEN t.type NOT IN('Fees', 'Load-Bill Payment', 'Corporate Load', 'Load-Bank Transfer') THEN 1 ELSE 0 END)/91*30 numOther,
    sum(CASE WHEN t.type='Fees' THEN 1 ELSE 0 END)/91*30 numFees,
    sum(CASE WHEN t.type='Load-Bill Payment' THEN 1 ELSE 0 END)/91*30 numBillPayment,
    sum(CASE WHEN t.type='Load-Bank Transfer' THEN 1 ELSE 0 END)/91*30 numBankTransfer,
    sum(CASE WHEN t.type='Corporate Load' THEN 1 ELSE 0 END)/91*30 numCorporate

Rule based partitions

    CASE
    WHEN c.account__number IS NOT NULL AND b.account__number IS NOT NULL AND b.autoload=1 THEN 'has Both w Auto'
    WHEN c.account__number IS NOT NULL AND b.account__number IS NOT NULL AND b.autoload=0 THEN 'has Both wo Auto'
    WHEN c.account__number IS NOT NULL AND b.account__number IS NOT NULL THEN 'has Both'
    WHEN c.account__number IS NOT NULL THEN 'has Card'
    WHEN b.autoload=1 THEN 'has Bank w Auto'
    WHEN b.autoload=0 THEN 'has Bank wo Auto'
    WHEN b.account_number IS NOT NULL THEN 'has Bank'
    ELSE 'No bank or card'
    END category,

Ordering for presentation

    ORDER BY
        CASE
        WHEN w.is_Active=1 THEN 2
        WHEN w.is_New=1 THEN 1
        WHEN w.is_used=1 THEN 3
        WHEN (w.is_open=1 or o.accountstatus='OPEN') AND o.dateopened<=r.mindate THEN 5
        WHEN w.is_open=1 or o.accountstatus='OPEN' THEN 4
        ELSE 6
        END ordering,

And then same logic to show name

    SELECT 
        CASE
        WHEN w.is_Active=1 THEN 'is active'
        WHEN w.is_New=1 THEN 'is new'
        WHEN w.is_used=1 THEN 'is used'
        WHEN (w.is_open=1 or o.accountstatus='OPEN') AND o.dateopened<=r.mindate THEN 'is_neglected'
        WHEN w.is_open=1 or o.accountstatus='OPEN' THEN 'is_open'
        ELSE 'is Closed'
        END status,

Left join, just in case foreign key is missing

    FROM
        temp_transactions t
    LEFT JOIN
        accounts w ON w.account_number=t.account_number

Table of "standard", but not logical, partitions

    LEFT JOIN
        standard_load_sizes s ON s.minamount<=ABS(t.amount) AND abs(t.amount)<s.maxamount

Converting a 13week sample into a monthly values

    category,
    count(account_number)/91*30 num_loads,
    avg(amount) average_load,
    sum(amount)/91*30 total_volume,
    count(distinct account_number) num_accounts,
    sum(amount)/91*30/count(distinct account_number) volume_per_account,
    count(account_number)/91*30/count(distinct account_number) loads_per_account


Showing partitions as columns

        sum(CASE WHEN r.code='lastWeek13' THEN t.amount ELSE null END) lastWeek13,
        sum(CASE WHEN r.code='lastWeek12' THEN t.amount ELSE null END) lastWeek12,
        sum(CASE WHEN r.code='lastWeek11' THEN t.amount ELSE null END) lastWeek11,
        sum(CASE WHEN r.code='lastWeek10' THEN t.amount ELSE null END) lastWeek10,
        sum(CASE WHEN r.code='lastWeek9' THEN t.amount ELSE null END) lastWeek9,
        sum(CASE WHEN r.code='lastWeek8' THEN t.amount ELSE null END) lastWeek8,
        sum(CASE WHEN r.code='lastWeek7' THEN t.amount ELSE null END) lastWeek7,
        sum(CASE WHEN r.code='lastWeek6' THEN t.amount ELSE null END) lastWeek6,
        sum(CASE WHEN r.code='lastWeek5' THEN t.amount ELSE null END) lastWeek5,
        sum(CASE WHEN r.code='lastWeek4' THEN t.amount ELSE null END) lastWeek4,
        sum(CASE WHEN r.code='lastWeek3' THEN t.amount ELSE null END) lastWeek3,
        sum(CASE WHEN r.code='lastWeek2' THEN t.amount ELSE null END) lastWeek2,
        sum(CASE WHEN r.code='lastWeek' THEN t.amount ELSE null END) lastWeek,
        sum(CASE WHEN r.code='thisWeek' THEN t.amount ELSE null END) thisWeek

Default values when no data is present

    UNION ALL
        SELECT
            '`empty',
            '`empty',
            '`empty',
            null,null,null,null,null,null,null,null,null,null,null,null,null,null
        FROM
            util_digits d
    ) b

using distinct to determine what the partitions are

    FROM
        (
        SELECT DISTINCT
            resource_index,
            resource
        FROM
            analysis.log_performance
        WHERE
            resource like '/backoffice/%'
        ) a
    LEFT JOIN
        analysis.log_performance_backoffice b on b.resource=a.resource


Building quazi-log tables, that round to humane base10 values

    CREATE PROCEDURE temp_fill_log_performance_ranges ()
    BEGIN
        DECLARE v INTEGER;
        DECLARE min_ INTEGER;
        DECLARE max_ INTEGER;
    
        ## LOG SCALE
        SET v=0;
        WHILE v<30 DO
            SET min_=round(pow(10, v/6), 0);
            if (v=0) THEN set min_=0; END IF;
            SET max_=round(pow(10, (v+1)/6), 0);
            INSERT INTO log_performance_ranges VALUES (
                'log',
                concat(min_, 'ms - ', (max_-1), 'ms'),
                min_,
                max_
            );
            SET v=v+1;
        END WHILE;
    
        ## MILLISECOND SCALE
        SET v=0;
        WHILE v<30 DO
            SET min_=v*100;
            SET max_=(v+1)*100;
            INSERT INTO log_performance_ranges VALUES (
                'ms',
                concat(min_, 'ms - ', (max_-1), 'ms'),
                min_,
                max_
            );
            SET v=v+1;
        END WHILE;
    
        ## SECOND SCALE
        SET v=0;
        WHILE v<30 DO
            SET min_=v*1000;
            SET max_=(v+1)*1000;
            INSERT INTO log_performance_ranges VALUES (
                'sec',
                concat(v, 'sec - ', (v+1), 'sec'),
                min_,
                max_
            );
            SET v=v+1;
        END WHILE;
    
    END;;

Reporting the top N (based on larger sample), even though daily samples do not have same order

    LEFT JOIN
        (# TOP 5 COUNTRIES
        SELECT
            coalesce(t.country, 'tst') country,
            sum(t.amount) amount
        FROM
            temp_Executive_WU_txns t
        WHERE
            t.dateRange='this30Day'
            AND    t.type='Send'
        GROUP BY
            coalesce(t.country, 'tst')
        ORDER BY
            sum(t.amount) DESC
        LIMIT
            5

Dimension rollup

    INSERT INTO transaction_types (code, description, type) VALUES ('AC','Account Closure','Account Closure');
    INSERT INTO transaction_types (code, description, type) VALUES ('ACTF','Account Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ACTFF','Account Fee Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ACTFR','Account Fee Refund','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATF','Activation Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATFF','Activation Fee Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATFR','Activation Fee Refund','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATITI','Issuer to Issuer Account Transfer','Cash');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATITIF','Issuer to Issuer Account Transfer Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATSTS','Satellite to Satellite Account Transfer','Cash');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATSTSF','Satellite to Satellite Account Transfer Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATSTW','Satellite to account Account Transfer','Cash');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATSTWF','Satellite to account Account Transfer Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATWTS','account to Satellite Account Transfer','Cash');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATWTSF','account to Satellite Account Transfer Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATWTW','account to account Account Transfer','Cash');
    INSERT INTO transaction_types (code, description, type) VALUES ('ATWTWF','account to account Account Transfer Fee','Fees');
    INSERT INTO transaction_types (code, description, type) VALUES ('BF','Bulk Beam Fee','Fees');

Ordering, rollup and style

    INSERT INTO categories VALUES (1, 'Load-Credit Card','blue', 'Load');
    INSERT INTO categories VALUES (2, 'Retail Sales','blue', 'Spend');
    INSERT INTO categories VALUES (3, 'Savings','red', 'Spend');
    INSERT INTO categories VALUES (4, 'Previous Savings','red', 'Load');
    INSERT INTO categories VALUES (5, 'P2P Send','p2p', 'Spend');
    INSERT INTO categories VALUES (7, 'P2P Receive','p2p', 'Load');
    INSERT INTO categories VALUES (9, 'Load-Bank Transfer','green', 'Load');
    INSERT INTO categories VALUES (10, 'Load-Bill Payment','light green', 'Load');
    INSERT INTO categories VALUES (11, 'Interac','very light green', 'Load');
    INSERT INTO categories VALUES (12, 'ATM','green', 'Spend');
    INSERT INTO categories VALUES (13, 'Cashout','light green', 'Spend');
    INSERT INTO categories VALUES (14, 'WU Send','yellow', 'Spend');
    INSERT INTO categories VALUES (15, 'WU Pickup','yellow', 'Load');
    INSERT INTO categories VALUES (16, 'Corporate Load','purple', 'Load');
    INSERT INTO categories VALUES (17, 'Adjustment Load','cyan', 'Load');
    INSERT INTO categories VALUES (18, 'Adjustment Unload','cyan', 'Spend');
    INSERT INTO categories VALUES (19, 'Fees','light cyan', 'Spend');


Parsing data into columns

    SELECT
        data_source, #JUST THE FILENAME WITHOUT THE PATH
        now(), #datadate
        util_newid(), #id
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 0), #logtype
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 1), #userid
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 2), #action
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 3), #useragent
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 4), #devicetype
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 5), #firstname
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 6), #lastname
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 7), #mobile
        string_get_word(log_import_app_gateway_parse_signup(data), '|', 8), #email
        str_to_date(substring(data, 1, 23), '%Y-%m-%d %H:%i:%s,%f') #timestamp
    FROM
        temp_import_log_application l

Rule-based partitions

        CASE
        WHEN t.amount<0 THEN NULL #'neg receive'
        WHEN bigrecipient.account_number IS NULL AND t.transactiontype='WU_PICKUP' THEN 'WU Pickup'
        WHEN bigsender.account_number IS NOT NULL THEN 'Corporate Load'
        WHEN t.transactiontype='XF' THEN 'P2P Receive'
        WHEN bigrecipient.account_number IS NOT NULL THEN NULL #'to promo'
        ELSE 'Unknown'
        END category

One record results in two or more output records

    CASE
        WHEN d.digit=0 AND c.amount IS NULL THEN t.amount
        WHEN d.digit=0 THEN -c.amount
        WHEN d.digit=1 AND c.amount<>-t.amount THEN t.amount+c.amount
        ELSE t.amount
        END)/100, 2) volume,
        CASE
        WHEN d.digit=0 AND c.amount IS NULL and t.amount<0 THEN 'Adjustment Unload'
        WHEN d.digit=0 AND c.amount IS NULL THEN 'Adjustment Load'
        WHEN d.digit=0 THEN 'Cashout'
        WHEN d.digit=1 AND c.amount<>-t.amount THEN 'Fees'
        ELSE NULL
        END category
    FROM
        transactions t
    LEFT JOIN
        cashoutrequests c ON c.referencenumber=t.journalnumber AND t.account_number=c.account_number
    LEFT JOIN
        temp_exeutive_account_is_ignored bigsender on bigsender.account_number=t.account_number
    LEFT JOIN
        util_digits d on d.digit<2



Easy importing

Get all in directory

Clustered indexes for speed

Filling in missing parts of domain
    
    DECLARE @datadate DATETIME
    SET @datadate=dbo.to_date('20070225', 'YYYYMMDD')
    WHILE @datadate<getdate() BEGIN
        INSERT INTO ctx_missing VALUES ('flat_'+CONVERT(VARCHAR, @datadate, 12)+'.txt', @datadate)
        SET @datadate=dateAdd(month, 1, @datadate)
    END

Filling in missing parts of domain


    exec _drop 'ctx_existing'
    SELECT 
        datasource 
    INTO 
        ctx_existing
    FROM 
        bill
    WHERE 
        datasource NOT LIKE '%autogen%' 
    GROUP BY 
        datasource
    
    DELETE FROM ctx_missing WHERE datasource IN (
        SELECT datasource FROM ctx_existing
    )
    go


Setting default values, replacing invalid values:

    update bill set
        quantity=1
    where
        quantity is null or
        quantity=0
    

Standard date format

    to_Date('01-JAN-2012', 'DD-MON-YYYY')
    str_to_date("2012-01-01", "%Y-%m-%d")
    Date.newInstance("2012-01-01", "yyyy-MM-dd");


Copying whole lists of columns

























