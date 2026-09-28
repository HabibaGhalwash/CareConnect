const mysql = require('mysql');
const express = require('express');
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Connect to Database
const con = require('../../config/db');
router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO Admin Node.js Server</H1>");
});

// GET /users?id=1  -> single user
// GET /users       -> all users
router.get('/Admin', (req, res) => {
    const Admin_ID = req.query.id;
  
    let sql = 'SELECT * FROM Admin';
    let params = [];
  
    if (Admin_ID && Admin_ID !== '%') {
      const idNum = Number(Admin_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }

      sql += ' WHERE Admin_ID = ?';
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
// POST /Admin to create a new admin record
router.post('/Admin', (req, res) => {
  console.log("Post Request Received", req.body);

  const { Admin_ID, Email, Password} = req.body || {};

  if (!Admin_ID || !Email || !Password) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "Admin_ID, Email, and Password are required" });
  }

  const sql = "INSERT INTO Admin (`Admin_ID`,`Email`,`Password`) VALUES (?,?,?)";

  con.query(sql, [Admin_ID, Email, Password], function (err, result, fields) {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.status(500).json({ Status: "Error", Message: err.message });
    }
    res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
    console.log("Record Added " + result.insertId);
  });
});
//del
router.delete('/Admin',(req,res)=>{
  var Admin_ID= req.query.id;
  con.query("DELETE FROM Admin where Admin_ID = ?", [Admin_ID], function (err, result, fields) {
    if (err) throw err;
    if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + Admin_ID + "] does not exist"
        });
      }
    res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
    console.log("Delete Request Received for record ["+req.query.id+"] received");
  });
});
//put
router.put('/Admin', (req, res) => {
  console.log("PUT Request Received");
  var Admin_ID = req.query.id;

  con.query(
    "UPDATE Admin SET `Email` = ?, `Password` = ? WHERE Admin_ID = ?",
    [
      req.body.Email,
      req.body.Password,
      Admin_ID
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
       return res.json({ "Status": "OK", "Message": "Record Id [" + Admin_ID + "] is Updated Successfully" });
      console.log("Record Id [" + Admin_ID + "] is Updated Successfully");
    }
  );
});
//SEARCH
router.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const keyvalue = req.query.keyvalue;  // ✅ FIXED: Now uses keyvalue parameter
  const sort = req.query.sort || 'ASC';

  con.query(
      "SELECT * FROM Admin where " + keyword + " = ? order by Admin_ID " + sort,
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

  console.log('Incoming SEARCH Request - keyword:', keyword, 'keyvalue:', keyvalue);
});

module.exports = router;