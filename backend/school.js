const mysql = require('mysql'); //Database functionality
const express = require('express'); //express is a web framework for Node.js
const PORT = 8080; //Server Listening Port
const app = express(); // create app from express object

// Middleware to parse JSON and URL-encoded bodies from Postman
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
global.con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: "",
  database: 'nodemysql'
});

con.connect(function (err) {
  if (err) throw err;
  console.log('MySQL connected (school.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO school.service.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`school.service.js server running at http://localhost:${PORT}`);
});
// GET /school      -> all school
app.get('/school', (req, res) => {
    const School_ID = req.query.id;
  
    let sql = 'SELECT * FROM school';
    let params = [];
  
    if (School_ID && School_ID !== '%') {
      const idNum = Number(School_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE School_ID = ?';
      params = [idNum];
    }
  
    con.query(sql, params, function (err, result, fields) {
      if (err) {
        console.error('DB query failed:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
      console.log(result);
    });
  });
   // POST /school to create a new record
app.post('/school', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const {School_ID,Name,Address,Rating,Special_Need_Prog,Website_Link,P_ID} = req.body || {};
  
    if (!School_ID || !Name || !Address || !Rating || !Special_Need_Prog || !Website_Link || !P_ID) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "School_ID,Name,Address,Rating,Special_Need_Prog,Website_Link and P_ID are required" });
    }
  
    const sql = "INSERT INTO school (`School_ID`,`Name`,`Address`,`Rating`,`Special_Need_Prog`,`Website_Link`,`P_ID`) VALUES (?,?,?,?,?,?,?)";
  
    con.query(sql, [School_ID,Name,Address,Rating,Special_Need_Prog,Website_Link,P_ID], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/school',(req,res)=>{
    var School_ID= req.query.id;
    con.query("DELETE FROM school where School_ID = ?", [School_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/school', (req, res) => {
    console.log("PUT Request Received");
    var School_ID = req.query.id;
  
    con.query(
      "UPDATE school SET `Name` = ?, `Address` = ?, `Rating` = ?, `Special_Need_Prog` = ?, `Website_Link` = ?, `P_ID` = ? WHERE School_ID = ?",
      [
        req.body.Name,
        req.body.Address,
        req.body.Rating,
        req.body.Special_Need_Prog,
        req.body.Website_Link,
        req.body.P_ID,
        School_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + School_ID + "] is Updated Successfully" });
        console.log("Record Id [" + School_ID + "] is Updated Successfully");
      }
    );
  });