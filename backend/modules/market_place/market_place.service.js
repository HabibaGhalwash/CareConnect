const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// Connect to Database
const con = require('../../config/db');

// ✅ MULTER CONFIG FOR DONATION IMAGES (same pattern as school.service.js)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    // Save with timestamp and original extension
    const ext = path.extname(file.originalname);
    cb(null, 'donation_' + Date.now() + ext);
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO market_place.server.js Server</H1>");
});

// GET /MarketPlace      -> all MarketPlace
router.get('/market_place', (req, res) => {
    const M_ID = req.query.id;
  
    let sql = 'SELECT * FROM market_place';
    let params = [];
  
    if (M_ID && M_ID !== '%') {
      const idNum = Number(M_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE M_ID = ?';
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

   // POST /market_place to create a new record with image upload
   router.post('/market_place', imageUpload.single('image'), (req, res) => {
    console.log("POST /market_place - Request Received", req.body);
    console.log("File:", req.file);
  
    const { M_ID, Item_Name, Description, Years, Conditions, Phone, Status, P_ID } = req.body || {};
    const imageFilename = req.file ? req.file.filename : null;
  
    if (!M_ID || !Item_Name || !Description || !Conditions || !Phone || !Status || !P_ID) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "M_ID, Item_Name, Description, Conditions, Phone, Status, and P_ID are required" });
    }

    if (!imageFilename) {
      return res.status(400).json({ 
        Status: "Error", 
        Message: "Item image is required" 
      });
    }
  
    const sql = "INSERT INTO market_place (`M_ID`,`Item_Name`,`Description`,`Years`,`Conditions`,`Phone`,`Image`,`Status`,`P_ID`) VALUES (?,?,?,?,?,?,?,?,?)";
  
    con.query(sql, [M_ID, Item_Name, Description, Years || 'Not specified', Conditions, Phone, imageFilename, Status, P_ID], function (err, result, fields) {
      if (err) {
        console.error("❌ Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      console.log("✅ Donation Item Added with ID:", result.insertId);
      res.status(201).json({ 
        Status: "OK", 
        Message: "Record Added Successfully with Id " + result.insertId,
        Image: imageFilename
      });
    });
  });

  //del
  router.delete('/market_place',(req,res)=>{
    var M_ID= req.query.id;
    con.query("DELETE FROM market_place where M_ID = ?", [M_ID], function (err, result, fields) {
      if (err) throw err;
      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + M_ID + "] does not exist"
        });
      }
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });

  //put - Update market_place with optional image
  router.put('/market_place', imageUpload.single('image'), (req, res) => {
    console.log("PUT /market_place - Update Request Received");
    var M_ID = req.query.id;

    if (!M_ID) {
      return res.status(400).json({
        Status: "Error",
        Message: "M_ID is required"
      });
    }

    // Get existing record to check if image is being updated
    con.query("SELECT Image FROM market_place WHERE M_ID = ?", [M_ID], (selectErr, selectResult) => {
      if (selectErr) {
        return res.status(500).json({ Status: "Error", Message: selectErr.message });
      }

      if (!selectResult || selectResult.length === 0) {
        return res.status(404).json({ Status: "Error", Message: "Record not found" });
      }

      // Use new image if provided, otherwise keep existing
      const imageFilename = req.file ? req.file.filename : selectResult[0].Image;

      con.query(
        "UPDATE market_place SET `Item_Name` = ?, `Description` = ?, `Years` = ?, `Conditions` = ?, `Phone` = ?, `Image` = ?, `Status` = ?, `P_ID` = ? WHERE M_ID = ?",
        [
          req.body.Item_Name,
          req.body.Description,
          req.body.Years,
          req.body.Conditions,
          req.body.Phone,
          imageFilename,
          req.body.Status,
          req.body.P_ID,
          M_ID
        ],
        function (err, result, fields) {
          if (err) {
            console.error("❌ Update failed:", err.message);
            return res.status(500).json({ "Status": "Error", "Message": err.message });
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({
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
          console.log("✅ Record Id [" + M_ID + "] is Updated Successfully");
          return res.json({ 
            "Status": "OK", 
            "Message": "Record Id [" + M_ID + "] is Updated Successfully",
            "Image": imageFilename
          });
        }
      );
    });
  });

  //SEARCH
router.get('/search', (req, res) => {
  keyword = req.query.keyword;
  keyvalue = req.query.keyvalue;
  sort = req.query.sort;

  con.query(
      "SELECT * FROM market_place where " + keyword + " = ? order by M_ID  " + sort,
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