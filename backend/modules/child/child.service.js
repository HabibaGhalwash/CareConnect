const mysql = require('mysql');
const express = require('express');
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies from Postman
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const con = require('../../config/db');

// Ensure child foreign-key columns can stay empty on initial insert.
con.query(
  "ALTER TABLE child MODIFY B_ID INT NULL",
  (err) => {
    if (err) {
      console.warn('Unable to alter child table B_ID column to NULL:', err.message);
    } else {
      console.log('Child table B_ID allowed to be NULL.');
    }
  }
);

router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO child.service.js Server</H1>");
});

// GET /child -> single child or all children
router.get('/child', (req, res) => {
  const Child_ID = req.query.id;
  let sql = 'SELECT * FROM child';
  let params = [];

  if (Child_ID && Child_ID !== '%') {
    const idNum = Number(Child_ID);
    if (!Number.isInteger(idNum)) {
      return res.status(400).json({ 
        Status: "Error",
        Message: "Query param 'id' must be an integer or '%'." 
      });
    }
    sql += ' WHERE Child_ID = ?';
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
    res.json(Array.isArray(result) ? result : []);
    console.log('Fetched children:', result);
  });
});

// GET /child/by-parent?P_ID=X -> get all children for a parent
router.get('/child/by-parent', (req, res) => {
  const P_ID = req.query.P_ID;

  if (!P_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "P_ID is required"
    });
  }

  const idNum = Number(P_ID);
  if (!Number.isInteger(idNum)) {
    return res.status(400).json({
      Status: "Error",
      Message: "P_ID must be an integer"
    });
  }

  con.query(
    "SELECT * FROM child WHERE P_ID = ?",
    [P_ID],
    (err, result) => {
      if (err) {
        console.error('Error fetching children for parent:', err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }
      res.json(Array.isArray(result) ? result : []);
      console.log('Fetched children for parent:', P_ID);
    }
  );
});

// POST /child -> create a new child record
router.post('/child', (req, res) => {
  console.log("POST /child - Request Received", req.body);
  
  const { Full_Name, DOB, Gender, Extra_Details, P_ID, B_ID } = req.body;

  // Validation
  if (!Full_Name || !DOB || !Gender || !P_ID) {
    console.error('Missing required fields:', { Full_Name, DOB, Gender, P_ID });
    return res.status(400).json({
      Status: "Error",
      Message: "Full_Name, DOB, Gender, and P_ID are required"
    });
  }

  // Verify parent exists
  console.log(`🔍 Verifying parent P_ID=${P_ID} exists...`);
  con.query(
    "SELECT P_ID FROM parent WHERE P_ID = ?",
    [P_ID],
    (parentErr, parentResult) => {
      if (parentErr) {
        console.error("Parent verification failed:", parentErr.message);
        return res.status(500).json({
          Status: "Error",
          Message: `Parent verification error: ${parentErr.message}`
        });
      }

      if (!parentResult || parentResult.length === 0) {
        console.error(`❌ Parent P_ID=${P_ID} does not exist in database`);
        return res.status(400).json({
          Status: "Error",
          Message: `Parent ID (${P_ID}) does not exist. Please ensure parent account is created first.`
        });
      }

      console.log(`✅ Parent verified. Proceeding to create child...`);

      // Parent exists, proceed with child insertion
      // Build SQL dynamically based on provided fields
      let sql = "INSERT INTO child (Name, DOB, Gender, Extra_Details, P_ID";
      let values = [Full_Name, DOB, Gender, Extra_Details || null, P_ID];
      
      if (B_ID) {
        sql += ", B_ID";
        values.push(B_ID);
      }
      
      sql += ") VALUES (?, ?, ?, ?, ?";
      if (B_ID) sql += ", ?";
      sql += ")";
      
      con.query(sql, values,
        function (err, result, fields) {
          if (err) {
            console.error("Insert failed:", err.message);
            return res.status(500).json({
              Status: "Error",
              Message: `Database error: ${err.message}`
            });
          }

          console.log("✅ Record Added - Child_ID:", result.insertId);
          res.status(201).json({
            Status: "OK",
            Message: "Child created successfully",
            Child_ID: result.insertId
          });
        }
      );
    }
  );
});

// DELETE /child?id=X
router.delete('/child', (req, res) => {
  const Child_ID = req.query.id;

  if (!Child_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  console.log(`🗑️ Delete Request Received for child [${Child_ID}]`);

  // STEP 1: First delete all child_sn records (special needs associations)
  const deleteChildSnQry = "DELETE FROM child_sn WHERE Child_ID = ?";
  con.query(deleteChildSnQry, [Child_ID], (err, snResult) => {
    if (err) {
      console.error('❌ Error deleting child special needs:', err.message);
      return res.status(500).json({
        Status: "Error",
        Message: `Error removing special needs: ${err.message}`
      });
    }

    console.log(`✅ Deleted ${snResult.affectedRows} special needs associations for child ${Child_ID}`);

    // STEP 2: Then delete the child record
    const deleteChildQry = "DELETE FROM child WHERE Child_ID = ?";
    con.query(deleteChildQry, [Child_ID], (err, result) => {
      if (err) {
        console.error('❌ Error deleting child:', err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + Child_ID + "] does not exist"
        });
      }

      console.log(`✅ Child ID ${Child_ID} deleted successfully`);
      res.json({
        Status: "OK",
        Message: "Record Id [" + Child_ID + "] deleted Successfully"
      });
    });
  });
});

// PUT /child?id=X -> update child
router.put('/child', (req, res) => {
  console.log("PUT /child - Update Request Received", req.body);
  
  const Child_ID = req.query.id;

  if (!Child_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  let { Full_Name, DOB, Gender, Extra_Details } = req.body;

  if (!Full_Name || !DOB || !Gender) {
    return res.status(400).json({
      Status: "Error",
      Message: "Full_Name, DOB, and Gender are required"
    });
  }

  // Convert ISO date format to YYYY-MM-DD if needed
  if (DOB && DOB.includes('T')) {
    DOB = DOB.split('T')[0];
  }

  con.query(
    "UPDATE child SET Name = ?, DOB = ?, Gender = ?, Extra_Details = ? WHERE Child_ID = ?",
    [Full_Name, DOB, Gender, Extra_Details || null, Child_ID],
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

      console.log("✅ Record Id [" + Child_ID + "] is Updated Successfully");
      return res.json({
        Status: "OK",
        Message: "Record Id [" + Child_ID + "] is Updated Successfully"
      });
    }
  );
});

// GET /child/search -> search children
router.get('/search', (req, res) => {
  const { keyword, keyvalue, sort } = req.query;

  if (!keyword || !keyvalue) {
    return res.status(400).json({
      Status: "Error",
      Message: "keyword and keyvalue are required"
    });
  }

  con.query(
    "SELECT * FROM child WHERE " + keyword + " = ? ORDER BY Child_ID " + (sort || "ASC"),
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
