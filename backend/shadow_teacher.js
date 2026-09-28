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
  console.log('MySQL connected (shadow_teacher.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO shadow_teacher.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`shadow_teacher.service.js server running at http://localhost:${PORT}`);
});
// GET /shadow_teacher      -> all shadow_teacher
app.get('/shadow_teacher', (req, res) => {
    const ST_ID = req.query.id;
  
    let sql = 'SELECT * FROM shadow_teacher';
    let params = [];
  
    if (ST_ID && ST_ID !== '%') {
      const idNum = Number(C_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE ST_ID = ?';
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
    // POST /shadow_teacher to create a new record
app.post('/shadow_teacher', (req, res) => {
  console.log("Post Request Received", req.body);

  const {ST_ID,Experience,Hourly_Rate,Availability,Fullname,Qualification,Email,Password,B_ID,P_ID,Child_ID} = req.body || {};

  if (!ST_ID|| !Experience || !Hourly_Rate || !Availability || !Fullname || !Qualification || !Email || !Password || !B_ID ||!P_ID ||!Child_ID ) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "ST_ID,Experience,Hourly_Rate,Availability,Fullname,Qualification,Email,Password,B_ID,P_ID,Child_ID" });
  }

  const sql = "INSERT INTO shadow_teacher  (`ST_ID`,`Experience`,`Hourly_Rate`,`Availability`,`Fullname`,`Qualification`,`Email`,`Password`,`B_ID`,`P_ID`,`Child_ID`) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

  con.query(sql, [ST_ID,Experience,Hourly_Rate,Availability,Fullname,Qualification,Email,Password,B_ID,P_ID,Child_ID], function (err, result, fields) {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
    console.log("Record Added " + result.insertId);
  });
});
app.delete('/shadow_teacher',(req,res)=>{
  var ST_ID= req.query.id;
  con.query("DELETE FROM shadow_teacher where ST_ID = ?", [ST_ID], function (err, result, fields) {
    if (err) throw err;
    res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
    console.log("Delete Request Received for record ["+req.query.id+"] received");
  });
});
  app.delete('/shadow_teacher',(req,res)=>{
    var ST_ID= req.query.id;
    con.query("DELETE FROM shadow_teacher where ST_ID = ?", [ST_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/shadow_teacher', (req, res) => {
    console.log("PUT Request Received");
    var ST_ID = req.query.id;
  
    con.query(
      "UPDATE shadow_teacher SET `Experience` = ?, `Hourly_Rate` = ?, `Availability` = ?, `Fullname` = ?, `Qualification` = ?,`Email`= ?,`Password`= ?, `B_ID` = ?, `P_ID` = ?, `Child_ID` = ? WHERE ST_ID = ?",
      [
        req.body.Experience,
        req.body.Hourly_Rate,
        req.body.Availability,
        req.body.Fullname,
        req.body.Qualification,
        req.body.Email,
        req.body.Password,
        req.body.B_ID,
        req.body.P_ID,
        req.body.Child_ID,
        ST_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + ST_ID + "] is Updated Successfully" });
        console.log("Record Id [" + ST_ID + "] is Updated Successfully");
      }
    );
  });