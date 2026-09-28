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
  console.log('MySQL connected (child.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO child.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`child.service.js server running at http://localhost:${PORT}`);
});
// GET /users?id=1  -> single user
// GET /users       -> all users
app.get('/child', (req, res) => {
  const Child_ID = req.query.id;

  let sql = 'SELECT * FROM child';
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
// POST /child to create a new child record
app.post('/child', (req, res) => {
  console.log("Post Request Received", req.body);

  const { Child_ID, DOB, Name, Gender, Extra_Details,B_ID } = req.body || {};

  if (!Child_ID || !DOB || !Name || !Gender || !Extra_Details || !B_ID) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "Child_ID, DOB, Name, Gender, Extra_Details and B_ID are required" });
  }

  const sql = "INSERT INTO child (`Child_ID`,`DOB`,`Name`,`Gender`,`Extra_Details`,`B_ID`) VALUES (?,?,?,?,?,?)";

  con.query(sql, [Child_ID, DOB, Name, Gender, Extra_Details, B_ID], function (err, result, fields) {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
    console.log("Record Added " + result.insertId);
  });
});
app.delete('/child',(req,res)=>{
  var Child_ID= req.query.id;
  con.query("DELETE FROM child where Child_ID = ?", [Child_ID], function (err, result, fields) {
    if (err) throw err;
    res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
    console.log("Delete Request Received for record ["+req.query.id+"] received");
  });
});
app.put('/child', (req, res) => {
  console.log("PUT Request Received");
  var Child_ID = req.query.id;

  con.query(
    "UPDATE child SET `DOB` = ?, `Name` = ?, `Gender` = ?, `Extra_Details` = ? WHERE Child_ID = ?",
    [
      req.body.DOB,
      req.body.Name,
      req.body.Gender,
      req.body.Extra_Details,
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