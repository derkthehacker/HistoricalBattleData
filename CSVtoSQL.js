const fs = require("fs");
const mysql = require('mysql2');

const dataPackage = require("./datapackage.json");

//establishes the connection to the sql server. Very obviously NOT secure.
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "BattleData"
});

//likely to make this take in multiple params. ...Specifically an unkknown number of params. 
//takes in param(s) and uses the .json file to determine what to name all of the colums in the tables and how to connect each table.
//Then uses the associated .csv files to upload the rows into the said tables. Very cool.
var determine_database_table_names = (tableName) => 
{
    //Reads file contents of the table to be added, and splits each file. 
    const allFileContents = fs.readFileSync('./CSVs/' + tableName + '.csv', 'utf-8');
    const splitFileContents = allFileContents.split(/\r?\n/);

    //CSVResource returns the Resource object in the JSON file. 
    let dataResources = dataPackage.resources;
    let CSVResource = findResourceName(dataResources, tableName);  
    let csvArr = "";

    //if the csv file doesnt exist.
    if(CSVResource == null)
    {
        console.log("Failed to find Resource name");
        return -1;
    }

    csvArr += `CREATE TABLE ${tableName}(`;
    for(let obj of CSVResource.schema.fields)
    {
        if(obj.type == "string"){obj.type = "VARCHAR(500)";}
        if(obj.id == "isqno"){obj.type = "INT NOT NULL";}
        if(obj.type == "integer" || obj.type == "number"){obj.type = "INT";}
        if(obj.type == "boolean"){obj.type = "BIT(1)";}
        csvArr += `${obj.id} ${obj.type}, `;
    }
    csvArr = csvArr.slice(0, -2);
    csvArr += ");";

    con.connect(function (err){
        if(err) throw err;
        con.query(csvArr, function (err){
            if(err) throw err;
        })
    })

    let query = addToTable(tableName, splitFileContents);

    con.connect(function (err){
        if(err) throw err;
        con.query(query, function (err){
            if(err) throw err;
        })
    })
}

//grabs the object resource to include in the table. 
var findResourceName = (data, nameCSV) =>
{
    for(let resource of data)
    {
        if(resource.name == nameCSV)
            return resource;
    }
    return null;
}

//Take the csv tablename, and using the splitFileContents variable created at the start of the program, iterate through and grab the column names along with the 
var addToTable = (tableName, splitFileContents) =>
{
    let query = "INSERT INTO " + tableName + " (";
    let colEntry = splitFileContents[0].split(',');
    splitFileContents.shift();
    let dataEntry = splitFileContents;
    //Configures the column names for our query
    colEntry.forEach(col => {
        query += col.replace(/['"]+/g, '') + ", ";
    })
    query = query.slice(0,-2) + ")\nValues";


    //Configures the row values for our query.
    dataEntry.forEach(line => {
        let row = line.split(',');
        query += "\n(";
        row.forEach(data => {
            if(data == "")
                query += "NULL, ";
            else
                query += data + ", ";
        });
        query = query.slice(0, -2) +  "),";
    });

    query = query.slice(0, -2) + ");";

    fs.writeFile('./debug.txt', query, err => {
        if(err){
            console.error(err);
        }
    })
    return query;
}

//wtf this actually works?
//vulnerable as all hell to sql injection, but F that for now. 
determine_database_table_names("battles");
determine_database_table_names("active_periods");
determine_database_table_names("battle_actors");
determine_database_table_names("battle_durations");
determine_database_table_names("battle_dyads");
determine_database_table_names("belligerents");
determine_database_table_names("commanders");
determine_database_table_names("front_widths");
determine_database_table_names("terrain");
determine_database_table_names("weather");