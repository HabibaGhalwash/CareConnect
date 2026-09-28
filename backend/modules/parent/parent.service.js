const mysql = require('mysql');
const express = require('express');
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Connect to Database
const con = require('../../config/db');

// Ensure parent foreign-key columns can stay empty on initial insert.
con.query(
  "ALTER TABLE parent MODIFY SID INT NULL, MODIFY B_ID INT NULL, MODIFY CT_ID INT NULL",
  (err) => {
    if (err) {
      console.warn('Unable to alter parent table columns to NULL:', err.message);
    } else {
      console.log('Parent table foreign keys allowed to be NULL.');
    }
  }
);

router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO parent.service.js Server</H1>");
});

// GET /parent -> all parents or specific parent by id
router.get('/parent', (req, res) => {
  const P_ID = req.query.id;
  let sql = 'SELECT * FROM parent';
  let params = [];

  if (P_ID && P_ID !== '%') {
    const idNum = Number(P_ID);
    if (!Number.isInteger(idNum)) {
      return res.status(400).json({ 
        Status: "Error",
        Message: "Query param 'id' must be an integer or '%'." 
      });
    }
    sql += ' WHERE P_ID = ?';
    params = [idNum];
  }

  con.query(sql, params, function (err, result, fields) {
    if (err) {
      console.error('DB query failed:', err.message);
      return res.status(500).json({ 
        Status: "Error",
        Message: err.message 
      });
    }
    // Always return array
    res.json(Array.isArray(result) ? result : []);
    console.log('Fetched parents:', result);
  });
});

// POST /parent to create a new record (SIGNUP)
router.post('/parent', (req, res) => {
  console.log("POST /parent - Signup Request Received", req.body);
  
  const { Full_Name, Email, Location, Password, Phone, SID, B_ID, CT_ID } = req.body || {};

  // Validation
  if (!Full_Name || !Email || !Location || !Password || !Phone) {
    console.error('Missing required fields:', { Full_Name, Email, Location, Password, Phone });
    return res.status(400).json({ 
      Status: "Error", 
      Message: "Full_Name, Email, Location, Password and Phone are required" 
    });
  }

  // Check if email already exists
  con.query("SELECT P_ID FROM parent WHERE Email = ?", [Email], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Email check failed:', checkErr.message);
      return res.status(500).json({ 
        Status: "Error", 
        Message: checkErr.message 
      });
    }

    if (checkResult && checkResult.length > 0) {
      console.warn('Email already exists:', Email);
      return res.status(400).json({ 
        Status: "Error", 
        Message: "Email already registered" 
      });
    }

    // Insert new parent
    const sql = "INSERT INTO parent (Full_Name, Email, Location, Password, Phone, SID, B_ID, CT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      Full_Name,
      Email,
      Location,
      Password,
      Phone,
      SID == null ? null : SID,
      B_ID == null ? null : B_ID,
      CT_ID == null ? null : CT_ID
    ];

    con.query(sql, values, function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ 
          Status: "Error", 
          Message: err.message 
        });
      }

      console.log("✅ Record Added - P_ID:", result.insertId);
      
      // Return full parent data including P_ID
      res.status(201).json({
        Status: "OK",
        Message: "Parent account created successfully",
        P_ID: result.insertId,
        Full_Name: Full_Name,
        Email: Email,
        Location: Location,
        Phone: Phone,
        Password: Password
      });
    });
  });
});

// GET /parent/login - Login endpoint
router.get('/login', (req, res) => {
  console.log("GET /login - Login Request for:", req.query.Email);
  
  const { Email, Password } = req.query;

  if (!Email || !Password) {
    return res.status(400).json({
      Status: "Error",
      Message: "Email and Password are required"
    });
  }

  con.query(
    "SELECT * FROM parent WHERE Email = ? AND Password = ?",
    [Email, Password],
    function (err, result, fields) {
      if (err) {
        console.error('Login query failed:', err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      if (!result || result.length === 0) {
        console.warn("Login failed for email:", Email);
        return res.status(401).json({
          Status: "Error",
          Message: "Authentication Failed, Check Email or Password...!!!"
        });
      }

      // ✅ Return actual parent data
      const parent = result[0];
      console.log("✅ Login successful for:", parent.Full_Name);
      
      res.json({
        Status: "OK",
        Message: "Logged In Successfully",
        P_ID: parent.P_ID,
        Full_Name: parent.Full_Name,
        Email: parent.Email,
        Location: parent.Location,
        Phone: parent.Phone,
        Password: parent.Password
      });
    }
  );
});

// DELETE /parent?id=X
router.delete('/parent', (req, res) => {
  const P_ID = req.query.id;

  if (!P_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "P_ID is required"
    });
  }

  con.query("DELETE FROM parent WHERE P_ID = ?", [P_ID], function (err, result, fields) {
    if (err) {
      console.error('Delete failed:', err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: "Not Found",
        Message: "Record Id [" + P_ID + "] does not exist"
      });
    }

    console.log("✅ Delete Request Received for record [" + P_ID + "]");
    res.json({
      Status: "OK",
      Message: "Record Id [" + P_ID + "] deleted Successfully"
    });
  });
});

// PUT /parent?id=X - Update parent
router.put('/parent', (req, res) => {
  console.log("PUT /parent - Update Request Received");
  
  const P_ID = req.query.id;

  if (!P_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "P_ID is required"
    });
  }

  con.query(
    "UPDATE parent SET Full_Name = ?, Email = ?, Location = ?, Password = ?, Phone = ?, SID = ?, B_ID = ?, CT_ID = ? WHERE P_ID = ?",
    [
      req.body.Full_Name,
      req.body.Email,
      req.body.Location,
      req.body.Password,
      req.body.Phone,
      req.body.SID,
      req.body.B_ID,
      req.body.CT_ID,
      P_ID
    ],
    function (err, result, fields) {
      if (err) {
        console.error("Update failed:", err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Error",
          Message: "Record not found"
        });
      }

      if (result.changedRows === 0) {
        return res.json({
          Status: "OK",
          Message: "No changes made (same data sent)"
        });
      }

      console.log("✅ Record Id [" + P_ID + "] is Updated Successfully");
      return res.json({
        Status: "OK",
        Message: "Record Id [" + P_ID + "] is Updated Successfully"
      });
    }
  );
});

// GET /parent/search - Search parents
router.get('/search', (req, res) => {
  const { keyword, keyvalue, sort } = req.query;

  if (!keyword || !keyvalue) {
    return res.status(400).json({
      Status: "Error",
      Message: "keyword and keyvalue are required"
    });
  }

  con.query(
    "SELECT * FROM parent WHERE " + keyword + " = ? ORDER BY P_ID " + (sort || "ASC"),
    [keyvalue],
    function (err, result, fields) {
      if (err) {
        console.error('Search failed:', err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      res.json(Array.isArray(result) ? result : []);
      console.log('Search result:', result);
    }
  );
});

module.exports = router;
