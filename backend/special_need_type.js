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
  console.log('MySQL connected (special_need_type.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO special_need_type.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`special_need_type.service.js server running at http://localhost:${PORT}`);
});
// GET /special_need_type      -> all special_need_type
app.get('/special_need_type', (req, res) => {
    const Child_ID = req.query.id;
  
    let sql = 'SELECT * FROM special_need_type';
    let params = [];
  
    if (Child_ID && Child_ID !== '%') {
      const idNum = Number(Child_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE Child_ID = ?';
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
  // POST /special_need_type to create a new record
app.post('/special_need_type', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const {Child_ID,Special_Need_Types} = req.body || {};
  
    if (!Child_ID || !Special_Need_Types) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "Child_ID,Special_Need_Types" });
    }
  
    const checkChild = "SELECT Child_ID FROM child WHERE Child_ID = ? LIMIT 1";
  
    con.query(checkChild, [Child_ID], function (err, rows, fields) {
      if (err) {
        console.error("Child check failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
  
      if (!rows || rows.length === 0) {
        return res
          .status(400)
          .json({ Status: "Error", Message: "Child_ID does not exist in child table" });
      }
  
      const sql = "INSERT INTO special_need_type  (`Child_ID`,`Special_Need_Types`) VALUES (?,?)";
  
      con.query(sql, [Child_ID,Special_Need_Types], function (err, result, fields) {
        if (err) {
          console.error("Insert failed:", err.message);
          return res.status(500).json({ Status: "Error", Message: err.message });
        }
        res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
        console.log("Record Added " + result.insertId);
      });
    });
  });
  app.delete('/special_need_type',(req,res)=>{
    var Child_ID= req.query.id;
    con.query("DELETE FROM special_need_type where Child_ID = ?", [Child_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/special_need_type', (req, res) => {
    console.log("PUT Request Received");
    var Child_ID = req.query.id;
  
    con.query(
      "UPDATE special_need_type SET `Special_Need_Types` = ? WHERE Child_ID = ?",
      [
        req.body.Special_Need_Types,
        Child_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + Child_ID + "] is Updated Successfully" });
        console.log("Record Id [" + Child_ID + "] is Updated Successfully");
      }
    );
  });