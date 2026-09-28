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
  console.log('MySQL connected (community.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO community.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`community.service.js server running at http://localhost:${PORT}`);
});
// GET /Community      -> all Community
app.get('/community', (req, res) => {
    const C_ID = req.query.id;
  
    let sql = 'SELECT * FROM community';
    let params = [];
  
    if (C_ID && C_ID !== '%') {
      const idNum = Number(C_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE C_ID = ?';
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
  // POST /community to create a new record
app.post('/community', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { C_ID,Content, P_ID } = req.body || {};
  
    if (!C_ID || !Content || !P_ID) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "C_ID, Content and P_ID are required" });
    }
  
    const sql = "INSERT INTO community (`C_ID`,`Content`,`P_ID`) VALUES (?,?,?)";
  
    con.query(sql, [C_ID, Content, P_ID], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/community',(req,res)=>{
    var C_ID= req.query.id;
    con.query("DELETE FROM community where C_ID = ?", [C_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/community', (req, res) => {
    console.log("PUT Request Received");
    var C_ID = req.query.id;
  
    con.query(
      "UPDATE community SET `Content` = ?, `P_ID` = ? WHERE C_ID = ?",
      [
        req.body.Content,
        req.body.P_ID,
        C_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + C_ID + "] is Updated Successfully" });
        console.log("Record Id [" + C_ID + "] is Updated Successfully");
      }
    );
  });