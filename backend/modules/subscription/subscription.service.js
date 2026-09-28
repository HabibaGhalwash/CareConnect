const mysql = require('mysql');
const express = require('express');
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Connect to Database
const con = require('../../config/db');

router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO subscription.server.js Server</H1>");
});

// GET /subscription      -> all subscription
router.get('/subscription', (req, res) => {
    const SID = req.query.id;
  
    let sql = 'SELECT * FROM subscription';
    let params = [];
  
    if (SID && SID !== '%') {
      const idNum = Number(SID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE SID = ?';
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
   // POST /subscription to create a new record
router.post('/subscription', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { SID,Offer_Details, Price } = req.body || {};
  
    if (!SID || !Offer_Details || !Price) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "SID,Offer_Details, and Price are required" });
    }
  
    const sql = "INSERT INTO subscription (`SID`,`Offer_Details`, `Price`) VALUES (?,?,?)";
  
    con.query(sql, [SID,Offer_Details, Price], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  //del
  router.delete('/subscription',(req,res)=>{
    var SID= req.query.id;
    con.query("DELETE FROM subscription where SID = ?", [SID], function (err, result, fields) {
      if (err) throw err;
      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + SID + "] does not exist"
        });
      }
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  //put
  router.put('/subscription', (req, res) => {
    console.log("PUT Request Received");
    var SID = req.query.id;
  
    con.query(
      "UPDATE subscription SET `Offer_Details` = ?, `Price` = ? WHERE SID = ?",
      [
        req.body.Offer_Details,
        req.body.Price,
        SID
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
       return res.json({ "Status": "OK", "Message": "Record Id [" + SID + "] is Updated Successfully" });
        console.log("Record Id [" + SID + "] is Updated Successfully");
      }
    );
  });
  //SEARCH
router.get('/search', (req, res) => {
  keyword = req.query.keyword;
  keyvalue = req.query.keyvalue;
  sort = req.query.sort;

  con.query(
      "SELECT * FROM subscription where " + keyword + " = ? order by SID  " + sort,
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