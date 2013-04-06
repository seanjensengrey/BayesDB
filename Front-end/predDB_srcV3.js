window.debug = true
window.default_hostname = "ec2-50-16-22-81.compute-1.amazonaws.com"
window.jsonrpc_id = 0

function alert_if_debug(alert_str) {
    if(window.debug) {
	alert(alert_str)
    }
}

/* Converter functions*/
function encodeValues(observedValue){
    return observedValue
}

function missingValuesQuerisToJSON(missingValueIndices){
    q = missingValueIndices
    return {"q":q}
}

function findNaNValuesInCSV(csvFile){
    var arrayDataSet = $.csv.toArrays(csvFile);
    var numCols = arrayDataSet[0].length - 1 
    var numRows = arrayDataSet.length - 1
    var missingValsList = []
    for (var i = 1; i < numRows + 1; i++){
	for (var j = 0; j < numCols; j++){
	    if (arrayDataSet[i][j] == "NaN"){
		missingValsList.push([i -1 , j - 1])
	    }
	    
	}
    }
    return missingValsList
}

function JSONRPC_send_method(method_name, parameters, function_to_call) {
    window.jsonrpc_id += 1
    data_in =
	{ id : toString(window.jsonrpc_id),
	  jsonrpc : "2.0",
	  method : method_name,
	  params : parameters }
    $.ajax({
	url: window.JSONRPC_URL, 
	type: 'PUT', 
	data: JSON.stringify(data_in),
	dataType: 'json', 
	async: true,	
	crossDomain: true,
	success:function(data) {
	    function_to_call(data)
	},
	error: function(httpRequest, textStatus, errorThrown) {
	    console.log(httpRequest)
	    console.log(window.JSONRPC_URL)
	    alert("Sorry, some error has happened.")
	},
	complete: function() {
	    //console.log('COMPLETE');
	}		
    });			    
}

/* Parser functions*/
function parseCreateTableCommand(commandString){
    var returnDict = new Object() //the main dict for the tablename and the columns
    var columnsDict = new Object()
    createCommandParsed = commandString.split(' ');
    columnNamesIndex =  $.inArray("WITH", createCommandParsed) + 1
    alert(columnNamesIndex)
    var tempColProperties = new Object()
    var i = columnNamesIndex
    while (i < createCommandParsed.length && i != 0){
    	/*tempColProperties["name"] = createCommandParsed[i]
    	tempColProperties["type"] = createCommandParsed[i+2]*/
    	columnsDict[createCommandParsed[i]] = createCommandParsed[i+2]
    	i += 3
    	
    }
    
    var tableName;
    tableName = createCommandParsed[$.inArray("TABLE", createCommandParsed) + 1]
    fileName = createCommandParsed[$.inArray("FROM", createCommandParsed) + 1]
    if (tableName != "FROM"){
    	returnDict["tableName"] = tableName
    }
    else
    	returnDict["tableName"] = fileName
    returnDict["fileName"] = fileName
    returnDict["columns"] = columnsDict
    
    return returnDict
}



function parseCreateModelCommand(commandString){
	createCommandParsed = commandString.split(' ');
	var returnDict = new Object()
	tableName = createCommandParsed[$.inArray("FOR", createCommandParsed) + 1]
	numberOfChains = 10 //default value
	withIndex = $.inArray("WITH", createCommandParsed)
	if (withIndex != 0) {
		numberOfChains = createCommandParsed[withIndex + 1]
	}
	returnDict["tableName"] = tableName
	returnDict["numberOfChains"] = numberOfChains
	return returnDict
}



function parseAnalyzeCommand(commandString){
	createCommandParsed = commandString.split(' ');
	var returnDict = new Object()
	tableName = createCommandParsed[$.inArray("ANALYZE", createCommandParsed) + 1]
	iterations = 2 //default value
	forIndex = $.inArray("FOR", createCommandParsed)
	if (forIndex != 0){
		iterations = createCommandParsed[forIndex + 1]
	}
	onIndex = $.inArray("ON", createCommandParsed)
	chain_idx = 'ALL' //default value
	if (onIndex != 0){
		chain_idx = createCommandParsed[onIndex + 1]
	}
	returnDict["tableName"] = tableName
	returnDict["iterations"] = iterations
	returnDict["chainIndex"] = chain_idx
	return returnDict
}


function parseDropCommand(commandString){
	createCommandParsed = commandString.split(' ');
	var returnDict = new Object()
	tableName = createCommandParsed[$.inArray("TABLENAME", createCommandParsed) + 1]
	returnDict["tableName"] = tableName
	return returnDict
}


function parseDeleteChainCommand(commandString){
	createCommandParsed = commandString.split(' ');
	var returnDict = new Object()
	tableName = createCommandParsed[$.inArray("FOR", createCommandParsed) + 1]
	chain_idx = createCommandParsed[$.inArray("CHAIN", createCommandParsed) + 1]
	returnDict["tableName"] = tableName
	returnDict["chainIndex"] = chain_idx
	return returnDict
}



function findColumnsType(csvDataFile){
    //TODO this is going to be done in the middleware, the user will either specify the types or trust the middleware's guess
    var aDataSet = $.csv.toArrays(csvDataFile); 
    var colTypeDict = new Object();
    var counter = 0;
    for (var c = 0 ; c < aDataSet[0].length ; c++){
	colTypeDict[aDataSet[0][c]] = "continuous"
	counter += 1
    }
    colTypeDict["NAME"] = "ignore"
    return colTypeDict
}

function typeDictToTable(typeDict){
    var aDataSetKeys = Object.keys(typeDict)
    var columns = new Array();
    var counter = 0;
    for (var c in aDataSetKeys){
	columns[counter] = { "sTitle": aDataSetKeys[counter] , "sClass": "center"}
	counter += 1
    }
    
    var out = "";
    for (var r = 0; r < aDataSetKeys.length - 1; r++) {
	out += typeDict[aDataSetKeys[r]] + ", ";
    }
    out += typeDict[aDataSetKeys[aDataSetKeys.length]]
    
    $('#dynamic').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
    $('#example').dataTable( {
	"aaSorting": [],
	"aaData": out,
	"aoColumns": columns 
    } );
}

function parseInferCommand(commandString){
    var returnDict = new Object() 
    inferCommandParsed = commandString.split(' ');
    
    var tableName;
    tableName = inferCommandParsed[$.inArray("FROM", inferCommandParsed) + 1]
    returnDict["tableName"] = tableName
    
    var confidence 
    confidence = inferCommandParsed[$.inArray("CONFIDENCE", inferCommandParsed) + 1]
    returnDict["confidence"] = confidence
    
    columnsToSelectFrom = inferCommandParsed.slice(inferCommandParsed.indexOf("INFER") + 1, inferCommandParsed.indexOf("INTO"))
    var columnsString = columnsToSelectFrom.join().replace( /,/g, " " )
    returnDict["columns"] = columnsString
    
    whereClause = inferCommandParsed.slice(inferCommandParsed.indexOf("WHERE") + 1, inferCommandParsed.indexOf("WITH"))
    var whereString = whereClause.join().replace( /,/g, " " )
    returnDict["whereClause"] =  whereString
    
    var newTableName = inferCommandParsed[$.inArray("INTO", inferCommandParsed) + 1]
    returnDict["newTableName"] = newTableName
    
    var limit = inferCommandParsed[$.inArray("LIMIT", inferCommandParsed) + 1]
    returnDict["LIMIT"] = limit
    
    console.log(returnDict)
    return returnDict
}

function parsePredictCommand(commandString){
    var returnDict = new Object() 
    predictCommandParsed = commandString.split(' ');
    
    var tableName;
    tableName = predictCommandParsed[$.inArray("FROM", predictCommandParsed) + 1]
    returnDict["tableName"] = tableName
    
    var times
    times = predictCommandParsed[$.inArray("TIMES", predictCommandParsed) + 1]
    returnDict["times"] = times
    
    columnsToSelectFrom = predictCommandParsed.slice(predictCommandParsed.indexOf("PREDICT") + 1, predictCommandParsed.indexOf("FROM"))
    var columnsString = columnsToSelectFrom.join().replace( /,/g, " " )
    returnDict["columns"] = columnsString
    
    whereClause = predictCommandParsed.slice(predictCommandParsed.indexOf("WHERE") + 1, predictCommandParsed.indexOf("TIMES"))
    var whereString = whereClause.join().replace( /,/g, " " )
    returnDict["whereClause"] =  whereString
    
    console.log(returnDict)
    return returnDict
}

/* Loading and jqueries functions*/
function LoadToDatabaseTheCSVData(fileName, missingValsArray) {
    data = preloadedDataFiles[fileName]
    window.masterData = data
    window.currentTable = fileName;
    
    var aDataSet = $.csv.toArrays(data); 
    var columns = new Array();
    var counter = 0;
    for (var c in aDataSet[0]){
	columns[counter] = { "sTitle": aDataSet[0][c] , "sClass": "center"}
	counter += 1
    }
    aDataSet.shift()  
    $('#dynamic').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
    $('#example').dataTable( {
	"aaSorting": [],
	"aaData": aDataSet,
	"aoColumns": columns 
    } );
    if (missingValsArray.length != 0){
	missingCells = missingValsArray;
	for (var i = 0; i < missingCells.length ; i ++){
	    jQuery(document.getElementById("example").rows[missingCells[i][0] + 1].cells[missingCells[i][1]+1]).addClass("redText")
	}
    }
}

$(document).ready(function() {	 
    window.commandHistory = [];
    window.scrollChange = false
    window.currentTable = "";
    $('body').layout({ north:{size:0.4}, west:{initHidden:	true }, east:{size:0.5}})
    window.sliders.style.display = 'none';
} );  



jQuery(function($, undefined) {
    $('#term_demo').terminal(function(command, term) {
	command_split = command.split(' ')
	first_command_uc = command_split[0].toUpperCase()
	/*alert_if_debug("Past CSVtoSQLFormat")*/
	if (command !== ''){
	    commandHistory.push(command)
	}
	if (command !== '' || commandHistory.length != 0) {
	    try {
	    switch (first_command_uc)
	    {
	    case "SETHOSTNAME":
	    {
		    hostname = command.split(' ')[1]
		    set_url_with_hostname(hostname)
		    alert_if_debug("JSONRPC_URL = " + window.JSONRPC_URL)
		    break
		}
	    case "GETHOSTNAME":
	    {
		    alert("JSONRPC_URL = " + window.JSONRPC_URL)
		    break
		}
	    case "CREATE": 
		{
	    	if (command_split[1].toUpperCase() == "TABLE")
	    		{ 
	    		alert_if_debug("CREATE TABLE")
			    tempString = parseCreateTableCommand(command)
			    console.log(tempString)
			    JSONRPC_send_method("upload_data_table",
						{ "csv": preloadedDataFiles[tempString["fileName"]], "crosscat_column_types":
							tempString["columns"], "tablename": tempString["tableName"]},
						function(returnedData) {
						    console.log(returnedData)
						    alert("Welcome!")
						}) 
				//in case the table name is different than the file name
			    if (tempString["fileName"] != tempString["tableName"]){
			    	var temp = preloadedDataFiles[tempString["fileName"]]
			    	preloadedDataFiles[tempString["tableName"]] = temp
			    	delete preloadedDataFiles[tempString["fileName"]]
			    	var select=document.getElementById('menu');
			    	for (i=0;i<select.length;  i++) {
			    		   if (select.options[i].value==tempString["fileName"]) {
			    		     select.remove(i);
			    		   }
			    		}
			    	jQuery(document.getElementById('menu')).append("<option value='" + tempString["tableName"] + "'>" + 
			    			tempString["tableName"] + "</option>")
			    	}
				}
	    	
	    	else if (command_split[1].toUpperCase() == "MODEL")
	    		{ 
	    		alert_if_debug("CREATE MODEL")
			    tempString = parseCreateTableCommand(command)
			    //TODO change the dropdown menu to the table for which we have created the model
			    JSONRPC_send_method("create_model",
						{ "tablename": tempString["tableName"], "n_chains": tempString["numberOfChains"]},
						function(returnedData) {
						    term.echo(returnedData);
						    console.log(returnedData)
						    alert("Welcome!")
						}) 
						}
	    	else
	    		 term.echo('Wrong command format. Please check the HELP command');
	    	
	    	break
		    
		}
		
	    case "ANALYZE":
	    {
	    	alert_if_debug("ANALYZE")
	    	tempString = parseAnalyzeCommand(command)
	    	console.log(tempString)
		    JSONRPC_send_method("analyze",
					{ "tablename": tempString["tableName"], "chain_index": tempString["chainIndex"]
		    , "iterations": tempString["iterations"]},
					function(returnedData) {
					    term.echo(returnedData);
					    console.log(returnedData)
					    alert("Welcome!")
					}) 
			break
	    }
	    
	    case "DROP":
	    {
	    	if (command_split[1].toUpperCase() == "TABLENAME")
    		{ 
	    		tempString = parseDropCommand(command)
		    	console.log(tempString)
			    JSONRPC_send_method("drop_tablename",
						{ "tablename": tempString["tableName"]},
						function(returnedData) {
						    term.echo(returnedData);
						    console.log(returnedData)
						    alert("Welcome!")
						}) 
						
				delete preloadedDataFiles[tempString["tableName"]]
		    	var select=document.getElementById('menu');
		    	for (i=0;i<select.length;  i++) {
		    		   if (select.options[i].value==tempString["tableName"]) {
		    		     select.remove(i);
		    		   }
		    		}
			}
    	
    	else
    		 term.echo('Wrong command format. Please check the HELP command');
    	
    	break
	    }
	    
	    case "DELETE":
	    {
	    	tempString = parseDeleteChainCommand(command)
	    	tempString = parseDropCommand(command)
	    	console.log(tempString)
		    JSONRPC_send_method("delete_chain",
					{ "tablename": tempString["tableName"], "chain_index": tempString["chainIndex"]},
					function(returnedData) {
					    term.echo(returnedData);
					    console.log(returnedData)
					    alert("Welcome!")
					}) 
					
	    }
	    
	    case "INFER": 
		{
		    alert_if_debug("INFER")
		    tempString = parseInferCommand(command)
		    JSONRPC_send_method("infer",
					{ "tablename": tempString["tableName"],  
				          "newtablename": tempString["newTableName"],
				          "confidence": tempString["confidence"],
				          "whereclause": tempString["whereclause"],
				          "columnstring": tempString["columns"],
				          "limit": tempString["limit"]},
					function(returnedData) {
				            preloadedDataFiles[tempString["newTableName"]] = returnedData
				            jQuery(document.getElementById('menu')).append("<option value='" + tempString["newTableName"] + "'>" + 
				            						   tempString["newTableName"] + "</option>")
				            LoadToDatabaseTheCSVData(tempString["newTableName"], [])		
					    console.log(returnedData)
					    alert("Welcome!")
					}) 
			break
		    
		}
		
	    case "PREDICT":
		{
		    alert_if_debug("PREDICT")
		    tempString = parsePredictCommand(command)
		    JSONRPC_send_method("predict",
					{ "tablename": tempString["tableName"],  
				          "times": tempString["times"],
				          "whereclause": tempString["whereclause"],
				          "columnstring": tempString["columns"]},
					function(returnedData) {
				            LoadToDatabaseTheCSVData(returnedData, [])		
					    console.log(returnedData)
					    alert("Welcome!")
					}) 
			break
		    
		}
		
	    case "GUESS": 
		{
		    alert_if_debug("GUESS")
		    guessCommandParsed = commandString.split(' ');
		    var tableName;
		    tableName = guessCommandParsed[$.inArray("FOR", inferCommandParsed) + 1]
		    JSONRPC_send_method("guessschema",
					{ "tablename":tableName},
					function(returnedData) {
				            typeDictToTable(returnedData)		
					    console.log(returnedData)
					    alert("Welcome!")
					}) 
			break
		    
		}
		
		default:   //Command is not a supported SQL command; need to parse and send back
		{ 
			term.echo('Wrong command format. Please check the HELP command');
		    alert_if_debug("FALL THROUGH")
		    
		}
		
	    }
	    } catch(e) { //catch the error in the terminal
		term.error(new String(e));
	    }
	} 
	else {
	    term.echo(''); 
	}
    }, {
	greetings: '',
	overflow : 'auto',
	name: 'SQL_demo',
	height: 100,
	width: 1000,
	prompt: 'SQL Command>'});
});

preloadedDataFiles = new Object();

function menu_select(event) {
    if (event.target.selectedIndex == 0) {
	$('#dynamic').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
	$('#example').dataTable( {
	    "aaData": [],
	    "aoColumns": []
	} );
    } else {
	LoadToDatabaseTheCSVData(event.target.value, []);
    }
}

function ProcessFiles(files_input) {
    for (var file_index = 0; file_index < files_input.length; file_index++) {
	var reader = new FileReader();
	reader.file_name = files_input[file_index].name.replace(".csv","");
	reader.onload = function(e) {
	    preloadedDataFiles[e.target.file_name] = e.target.result;
	    jQuery(document.getElementById('menu')).append("<option value='" + e.target.file_name + "'>" + e.target.file_name + "</option>")
	    // LoadToDatabaseTheCSVData(e.target.result)
	}
	reader.readAsBinaryString(files_input[file_index])	
    }
}

function set_url_with_hostname(hostname) {
    if(typeof(hostname)==='undefined') {
	hostname = window.default_hostname
    }
    window.JSONRPC_URL = "http://" + hostname + ":8008"
}

function promptHost()
{    
    hostname = prompt("Please enter the host", window.default_hostname)
    set_url_with_hostname(hostname)
}








/*function CSVtoJSON(csvFile){
var arrayDataSet = $.csv.toArrays(csvFile);
numCols = arrayDataSet[0].length - 1 // removing the first column for the row names 
numRows = arrayDataSet.length - 1
var indxToColDict = {}
var colToIndxDict = {}
var columnMetadata = {}
var columnMetadataArray = []
var indxToRowDict = {}
var rowToIndxDict = {}
dataJSON = arrayDataSet.slice(1)
newDataJSON = []
YDict = {}
for (var i = 0; i < numCols; i++){
indxToColDict[i] = arrayDataSet[0][i + 1]
colToIndxDict[arrayDataSet[0][i + 1]] = i
columnMetadata["modeltype"] = "normal_inverse_gamma"
columnMetadata["value_to_code"] = {}
columnMetadata["code_to_value"] = {}
columnMetadataArray.push(columnMetadata)
} 

for (var j = 0; j < numRows; j++){
indxToRowDict[j] = arrayDataSet[j + 1][0]
rowToIndxDict[arrayDataSet[j + 1][0]] = j
newDataJSON.push(dataJSON[j].slice(1))
}

for (var i = 0; i < numCols; i++){
for (var j = 0; j < numRows; j++){
    YDict[[j, i]] = arrayDataSet[j + 1][i + 1]
}
} 
var M_c = {"name_to_idx": colToIndxDict, "idx_to_name": indxToColDict,
       "column_metadata": columnMetadataArray};
var M_r = {"name_to_idx": rowToIndxDict, "idx_to_name": indxToRowDict}
var T = {"dimensions":[numRows, numCols], "orientation": "row_major",
     "data":newDataJSON}
var Y = YDict
var q = findNaNValuesInCSV(csvFile)
console.log(q)
return {"M_c":M_c, "M_r":M_r, "T":T, "Y":Y,  "X_L":"", "X_D":"", "kernel_list":"", "n_steps":"",
    "c":"", "r":"","max_iterations":"", "max_time":"", "q":q}
}

function CSVtoSQLFormat(csvFile, tableName){
var dataSetDict = $.csv.toObjects(csvFile);
arrayDataSet = $.csv.toArrays(csvFile);
numCols = arrayDataSet[0].length - 1
numRows = dataSetDict.length - 1
newDataCol1Removed = []
var columnDefs = {}
var columnDefsDict = {}
var tableDict = {}
for (var i = 0; i < numCols + 1; i++){
columnDefs[arrayDataSet[0][i]] = { type: "Number" }
} 

for (var j = 0; j < numRows; j++){
 delete dataSetDict[j]["NAME"] 
newDataCol1Removed.push(dataSetDict[j])
} 
columnDefsDict[tableName] = columnDefs
tableDict[tableName] = newDataCol1Removed

return {"dataTable":tableDict, "columnDefs":columnDefsDict}
}

function JSONToSQL(JSONString, tableName){
obj = JSONString
dataTable = obj.T.data //Transform later
 numMissingVals = obj.e.length
   listofMissingVals = obj.e
   for (var i in listofMissingVals){
   dataTable[i.split(',')[0], i.split(',')[1]] = listofMissingVals[i]  
   }  
var columnDefs = {}
var columnDefsDict = {}
var tableDict = {}
var dataArrayofDicts = []
rowNamesDict = obj.M_r.idx_to_name
colNamesDict = obj.M_c.idx_to_name
numRows = obj.T.dimensions[0]
numCols = obj.T.dimensions[1]
dataTableEncoded = obj.T.data //Need to transform 
columnDefsDict = {}
tableDict = {}

columnDefs["NAME"] = { type: "Number" }
for (var i = 1; i < numCols; i++){
columnDefs[colNamesDict[i]] = { type: "Number" }
} 

for (var j = 0; j < numRows; j++){
tempRowDict = {}
for (var k = 0; k < numCols; k++){
    tempRowDict[colNamesDict[k]] = dataTableEncoded[j][k]
}
dataArrayofDicts.push(tempRowDict)
}
columnDefsDict[tableName] = columnDefs
tableDict[tableName] = dataArrayofDicts
return {"dataTable":tableDict, "columnDefs":columnDefsDict}
}*/



/*if (first_command_uc=="SELECT") // command is a supported SQL command
{
    alert_if_debug("SELECT")
    var statement = queryLang.parseSQL(command);
    var result = statement.filter(tableData);
    window.sliders.style.display = 'none';
    window.scrollChange = false
    commandHistory.length = 0
    var out = "";
    for (var r = 0; r < result.length; r++) {
	for (var c in result[r])
	     out += c + ": " + result[r][c] + ", "; 
	    out += result[r][c] + ", ";
	out += "\n";
    }
    var aDataSet = $.csv.toArrays(out); 
    var columns = new Array();
    var counter = 0;
    for (var c in result[0]){
	columns[counter] = { "sTitle": c , "sClass": "center"}
	counter += 1
    }
}*/