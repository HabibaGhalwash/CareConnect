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
  console.log('MySQL connected (therapy_session.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO therapy_session.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`therapy_session.service.js server running at http://localhost:${PORT}`);
});
//GET codes THERAPY SESSION
app.get('/therapy_session', (req, res) => {
  const T_ID = req.query.T_ID;
  const P_ID = req.query.P_ID;

  let sql = 'SELECT * FROM therapy_session';
  let params = [];
  let conditions = [];

  if (T_ID && T_ID !== '%') {
    const tIdNum = Number(T_ID);
    if (!Number.isInteger(tIdNum)) {
      return res.status(400).json({ error: "Query param 'T_ID' must be an integer or '%'." });
    }
    conditions.push('T_ID = ?');
    params.push(tIdNum);
  }

  if (P_ID && P_ID !== '%') {
    const pIdNum = Number(P_ID);
    if (!Number.isInteger(pIdNum)) {
      return res.status(400).json({ error: "Query param 'P_ID' must be an integer or '%'." });
    }
    conditions.push('P_ID = ?');
    params.push(pIdNum);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
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
//POST THERAPY SESSION 
app.post('/therapy_session', (req, res) => {
  console.log("Post Request Received", req.body);

  const { T_ID, P_ID, Notes } = req.body || {};

  if (!T_ID || !P_ID || !Notes) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "T_ID, P_ID and Notes are required" });
  }

  const sql = "INSERT INTO therapy_session (`T_ID`,`P_ID`,`Notes`) VALUES (?,?,?)";

  con.query(sql, [T_ID, P_ID, Notes], function (err, result, fields) {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res.json({ Status: "OK", Message: "Record Added Successfully" });
    console.log("Record Added Successfully");
  });
});
//DELETE CODES 
app.delete('/therapy_session', (req, res) => {
  var T_ID = req.query.T_ID;
  var P_ID = req.query.P_ID;

  con.query(
    "DELETE FROM therapy_session where T_ID = ? AND P_ID = ?",
    [T_ID, P_ID],
    function (err, result, fields) {
      if (err) throw err;
      res.json({ "Status": "OK", "Message": "Record with T_ID [" + T_ID + "] and P_ID [" + P_ID + "] deleted Successfully" });
      console.log("Delete Request Received for record with T_ID [" + T_ID + "] and P_ID [" + P_ID + "] received");
    }
  );
});
//PUT 
app.put('/therapy_session', (req, res) => {
  console.log("PUT Request Received");
  var T_ID = req.query.T_ID;
  var P_ID = req.query.P_ID;

  con.query(
    "UPDATE therapy_session SET `Notes` = ? WHERE T_ID = ? AND P_ID = ?",
    [
      req.body.Notes,
      T_ID,
      P_ID
    ],
    function (err, result, fields) {
      if (err) {
        console.error("Update failed:", err.message);
        return res.status(500).json({ "Status": "Error", "Message": err.message });
      }
      res.json({ "Status": "OK", "Message": "Record with T_ID [" + T_ID + "] and P_ID [" + P_ID + "] is Updated Successfully" });
      console.log("Record with T_ID [" + T_ID + "] and P_ID [" + P_ID + "] is Updated Successfully");
    }
  );
});