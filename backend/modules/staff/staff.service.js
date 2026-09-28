const mysql = require('mysql');
const express = require('express');
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Connect to Database
const con = require('../../config/db');
router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO Staff Node.js Server</H1>");
});

// GET /users?id=1  -> single user
// GET /users       -> all users
router.get('/staff', (req, res) => {
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
router.post('/staff', (req, res) => {
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
//del
router.delete('/staff',(req,res)=>{
  var Staff_ID= req.query.id;
  con.query("DELETE FROM staff where Staff_ID = ?", [Staff_ID], function (err, result, fields) {
    if (err) throw err;
    if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + Staff_ID + "] does not exist"
        });
      }
    res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
    console.log("Delete Request Received for record ["+req.query.id+"] received");
  });
});
//put
router.put('/staff', (req, res) => {
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
       if (result.affectedRows === 0) {
        return res.json({
          "Status": "Error",
          "Message": "Record not found"
        });
      }

      if (result.changedRows === 0) {
        return res.json({
          "Status": "OK",
          "Message": "No changes made (same data sent)"
        });
      }
       return res.json({ "Status": "OK", "Message": "Record Id [" + Staff_ID + "] is Updated Successfully" });
      console.log("Record Id [" + Staff_ID + "] is Updated Successfully");
    }
  );
});
//SEARCH
router.get('/search', (req, res) => {
  keyword = req.query.keyword;
  keyvalue = req.query.keyvalue;
  sort = req.query.sort;

  con.query(
      "SELECT * FROM staff where " + keyword + " = ? order by Staff_ID  " + sort,
      [keyvalue],
      function (err, result, fields) {
          if (err) {
              res.json({ "Status": "Error", "Message": err });
          } else {
              res.json(result);
              console.log(result);
          }
      }
  );

  console.log('Incoming SEARCH Request');
});

module.exports = router;