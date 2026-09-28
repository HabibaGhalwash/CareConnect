const mysql = require('mysql');
const express = require('express');
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Connect to Database
const con = require('../../config/db');

router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO community.server.js Server</H1>");
});

// GET /Community      -> all Community
router.get('/community', (req, res) => {
    const C_ID = req.query.id;
  
    let sql = 'SELECT * FROM community ORDER BY C_ID DESC';
    let params = [];
  
    if (C_ID && C_ID !== '%') {
      const idNum = Number(C_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql = 'SELECT * FROM community WHERE C_ID = ?';
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
router.post('/community', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { Content, P_ID } = req.body || {};
  
    // ✅ Don't require C_ID - let database auto-generate it
    if (!Content || !P_ID) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "Content and P_ID are required" });
    }
  
    // ✅ Remove C_ID from INSERT - database will auto-generate
    const sql = "INSERT INTO community (`Content`, `P_ID`) VALUES (?, ?)";
  
    con.query(sql, [Content, P_ID], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      // ✅ Return C_ID in response
      res.json({ 
        Status: "OK", 
        Message: "Record Added Successfully", 
        C_ID: result.insertId,
        insertId: result.insertId
      });
      console.log("Record Added with C_ID: " + result.insertId);
    });
  });

// DELETE /community
router.delete('/community', (req, res) => {
    var C_ID = req.query.id;
    con.query("DELETE FROM community WHERE C_ID = ?", [C_ID], function (err, result, fields) {
      if (err) throw err;
      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + C_ID + "] does not exist"
        });
      }
      res.json({"Status":"OK", "Message" : "Record Id [" + C_ID + "] deleted Successfully"});
      console.log("Delete Request Received for record [" + C_ID + "]");
    });
  });

// PUT /community
router.put('/community', (req, res) => {
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
        return res.json({ "Status": "OK", "Message": "Record Id [" + C_ID + "] is Updated Successfully" });
        console.log("Record Id [" + C_ID + "] is Updated Successfully");
      }
    );
  });

// SEARCH /community
router.get('/search', (req, res) => {
  keyword = req.query.keyword;
  keyvalue = req.query.keyvalue;
  sort = req.query.sort;

  con.query(
      "SELECT * FROM community WHERE " + keyword + " = ? ORDER BY C_ID " + sort,
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