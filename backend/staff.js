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
  console.log('MySQL connected (staff.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO Staff Node.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`staff.service.js server running at http://localhost:${PORT}`);
});
// GET /users?id=1  -> single user
// GET /users       -> all users
app.get('/staff', (req, res) => {
    const Staff_ID = req.query.id;
  
    let sql = 'SELECT * FROM staff';
    let params = [];
  
    if (Staff_ID && Staff_ID !== '%') {
      const idNum = Number(Staff_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }

      sql += ' WHERE Staff_ID = ?';
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
// POST /staff to create a new staff record
app.post('/staff', (req, res) => {
  console.log("Post Request Received", req.body);

  const { Staff_ID, Staff_type, T_ID, ST_ID } = req.body || {};

  if (!Staff_ID || !Staff_type || !T_ID || !ST_ID) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "Staff_ID, Staff_type, T_ID and ST_ID are required" });
  }

  const sql = "INSERT INTO staff (`Staff_ID`,`Staff_type`,`T_ID`,`ST_ID`) VALUES (?,?,?,?)";

  con.query(sql, [Staff_ID, Staff_type, T_ID, ST_ID], function (err, result, fields) {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
    console.log("Record Added " + result.insertId);
  });
});
app.delete('/staff',(req,res)=>{
  var Staff_ID= req.query.id;
  con.query("DELETE FROM staff where Staff_ID = ?", [Staff_ID], function (err, result, fields) {
    if (err) throw err;
    res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
    console.log("Delete Request Received for record ["+req.query.id+"] received");
  });
});
app.put('/staff', (req, res) => {
  console.log("PUT Request Received");
  var Staff_ID = req.query.id;

  con.query(
    "UPDATE staff SET `Staff_type` = ?, `T_ID` = ?, `ST_ID` = ? WHERE Staff_ID = ?",
    [
      req.body.Staff_type,
      req.body.T_ID,
      req.body.ST_ID,
      Staff_ID
    ],
    function (err, result, fields) {
      if (err) {
        console.error("Update failed:", err.message);
        return res.status(500).json({ "Status": "Error", "Message": err.message });
      }
      res.json({ "Status": "OK", "Message": "Record Id [" + Staff_ID + "] is Updated Successfully" });
      console.log("Record Id [" + Staff_ID + "] is Updated Successfully");
    }
  );
});