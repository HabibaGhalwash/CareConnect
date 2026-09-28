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
  console.log('MySQL connected (parent.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO parent.service.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`parent.service.js server running at http://localhost:${PORT}`);
});
// GET /parent      -> all parent
app.get('/parent', (req, res) => {
    const P_ID = req.query.id;
  
    let sql = 'SELECT * FROM parent';
    let params = [];
  
    if (P_ID && P_ID !== '%') {
      const idNum = Number(P_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE P_ID = ?';
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
  // POST /parent to create a new record
app.post('/parent', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const {P_ID,Full_Name,Email,Location,Password,Phone,SID,B_ID,CT_ID} = req.body || {};
  
    if (!P_ID || !Full_Name || !Email || !Location || !Password || !Phone || !SID ||!B_ID ||!CT_ID ) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "P_ID,Full_Name,Email,Location,Password,Phone,SID,B_ID and CT_ID are required" });
    }
  
    const sql = "INSERT INTO parent (`P_ID`,`Full_Name`,`Email`,`Location`,`Password`,`Phone`,`SID`,`B_ID`,`CT_ID`) VALUES (?,?,?,?,?,?,?,?,?)";
  
    con.query(sql, [P_ID,Full_Name,Email,Location,Password,Phone,SID,B_ID,CT_ID], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/parent',(req,res)=>{
    var P_ID= req.query.id;
    con.query("DELETE FROM parent where P_ID = ?", [P_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/parent', (req, res) => {
    console.log("PUT Request Received");
    var P_ID = req.query.id;
  
    con.query(
      "UPDATE parent SET `Full_Name` = ?, `Email` = ?, `Location` = ?, `Password` = ?, `Phone` = ?, `SID` = ?, `B_ID` = ?, `CT_ID` = ? WHERE P_ID = ?",
      [
        req.body.Phrase,
        req.body.Email,
        req.body.Location,
        req.body.Password,
        req.body.Phone,
        req.body.SID,
        req.body.B_ID,
        req.body.CT_ID,
        P_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + P_ID + "] is Updated Successfully" });
        console.log("Record Id [" + P_ID + "] is Updated Successfully");
      }
    );
  });