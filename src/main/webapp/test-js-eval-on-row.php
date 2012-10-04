<HTML>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<HEAD>
	</HEAD>
	<BODY>
		<script type="text/javascript" src="src/test/js/CountPendingReviews.js"></script>
		<script type="text/javascript" src="js/rest/RestConfig.js"></script>
		<script type="text/javascript" src="../../../lib/js/jquery-1.7.js"></script>

		<script type="text/javascript" src="js/charts/HelperFunctions.js"></script>

		<script type="text/javascript" src="js/util.js"></script>
		<script type="text/javascript" src="js/CNV.js"></script>
		<script type="text/javascript" src="js/aDate.js"></script>
		<script type="text/javascript" src="js/sql.js"></script>

		<script type="text/javascript">
			var row={"test1":1, "test2":5};

			var value="test1+test2";

			var select={};

			var f="select.calc=function(__row){"
			var names=Object.keys(row);
			for(n in names)	f+="var "+names[n]+"=__row."+names[n]+";\n";
			f+="return ("+value+");}";

			eval(f);
			console.info(CNV.Object2JSON(select.calc(row)));


	    </script>
	    


	</BODY>
</HTML>