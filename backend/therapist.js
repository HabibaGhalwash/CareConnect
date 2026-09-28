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
  console.log('MySQL connected (therapist.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO therapist.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`therapist.service.js server running at http://localhost:${PORT}`);
});
// GET /therapist      -> all therapist
app.get('/therapist', (req, res) => {
  const id = req.query.id;

  let sql = 'SELECT * FROM therapist';
  let params = [];

  if (id && id !== '%') {
    const idNum = Number(id);
    if (!Number.isInteger(idNum)) {
      return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
    }

    sql += ' WHERE T_ID = ?';
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
// POST /therapist to create a new record
app.post('/therapist', (req, res) => {
  console.log("Post Request Received", req.body);

  const {T_ID,Fullname,Availability,Experience,Specialization,Hourly_Rate,Email,Password,B_ID} = req.body || {};

  if (!T_ID|| !Fullname || !Availability || !Experience || ! Specialization|| ! Hourly_Rate || !Email|| !Password|| !B_ID) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "T_ID,Fullname,Availability,Experience,Specialization,Hourly_Rate,Email,Password,B_ID" });
  }

  const sql = "INSERT INTO therapist  (`T_ID`,`Fullname`,`Availability`,`Experience`,`Specialization`,`Hourly_Rate`,`Email`,`Password`,`B_ID`) VALUES (?,?,?,?,?,?,?,?,?)";

  con.query(sql, [T_ID,Fullname,Availability,Experience,Specialization,Hourly_Rate,Email,Password,B_ID], function (err, result, fields) {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
    console.log("Record Added " + result.insertId);
  });
});
app.delete('/therapist',(req,res)=>{
  var T_ID= req.query.id;
  con.query("DELETE FROM therapist where T_ID = ?", [T_ID], function (err, result, fields) {
    if (err) throw err;
    res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
    console.log("Delete Request Received for record ["+req.query.id+"] received");
  });
});
app.put('/therapist', (req, res) => {
  console.log("PUT Request Received");
  var T_ID = req.query.id;

  con.query(
    "UPDATE therapist SET `Fullname` = ?, `Availability` = ?, `Experience` = ?, `Specialization` = ?, `Hourly_Rate` = ?,`Email`=?,`Password`=?, `B_ID` = ? WHERE T_ID = ?",
    [
      req.body.Fullname,
      req.body.Availability,
      req.body.Experience,
      req.body.Specialization,
      req.body.Hourly_Rate,
      req.body.Email,
      req.body.Password,
      req.body.B_ID,
      T_ID
    ],
    function (err, result, fields) {
      if (err) {
        console.error("Update failed:", err.message);
        return res.status(500).json({ "Status": "Error", "Message": err.message });
      }
      res.json({ "Status": "OK", "Message": "Record Id [" + T_ID + "] is Updated Successfully" });
      console.log("Record Id [" + T_ID + "] is Updated Successfully");
    }
  );
});