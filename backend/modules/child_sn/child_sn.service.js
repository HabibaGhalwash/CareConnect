const express = require('express');
const router = express.Router();
const con = require('../../config/db');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ✅ ADD SPECIAL NEEDS TO CHILD
router.post('/child_sn', (req, res) => {
  console.log("POST /child_sn - Request Received", req.body);
  
  const { Child_ID, specialNeeds } = req.body;

  if (!Child_ID) {
    console.error('Missing Child_ID');
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  if (!Array.isArray(specialNeeds) || specialNeeds.length === 0) {
    console.warn('No special needs provided, skipping...');
    return res.status(200).json({
      Status: "OK",
      Message: "No special needs to add"
    });
  }

  // Verify child exists
  console.log(`🔍 Verifying child Child_ID=${Child_ID} exists...`);
  con.query(
    "SELECT Child_ID FROM child WHERE Child_ID = ?",
    [Child_ID],
    (childErr, childResult) => {
      if (childErr) {
        console.error("Child verification failed:", childErr.message);
        return res.status(500).json({
          Status: "Error",
          Message: `Child verification error: ${childErr.message}`
        });
      }

      if (!childResult || childResult.length === 0) {
        console.error(`❌ Child Child_ID=${Child_ID} does not exist`);
        return res.status(400).json({
          Status: "Error",
          Message: `Child ID (${Child_ID}) does not exist.`
        });
      }

      console.log(`✅ Child verified. Proceeding to link special needs...`);

      // First, delete existing special needs for this child
      con.query("DELETE FROM child_sn WHERE Child_ID = ?", [Child_ID], (delErr, delResult) => {
        if (delErr) {
          console.error('Error deleting existing special needs:', delErr.message);
          return res.status(500).json({
            Status: "Error",
            Message: delErr.message
          });
        }

        console.log(`✅ Cleared existing special needs for child ${Child_ID}`);

        // Insert all new special needs
        let completed = 0;
        let hasError = false;

        specialNeeds.forEach((sntId, index) => {
          console.log(`  📌 Linking special need SNT_ID=${sntId}...`);
          con.query(
            "INSERT INTO child_sn (Child_ID, SNT_ID) VALUES (?, ?)",
            [Child_ID, sntId],
            (err, result) => {
              if (err && !hasError) {
                console.error('Error inserting special need:', err.message);
                hasError = true;
                return res.status(500).json({
                  Status: "Error",
                  Message: err.message
                });
              }

              completed++;
              if (completed === specialNeeds.length && !hasError) {
                console.log(`✅ All ${completed} special needs linked to child ${Child_ID}`);
                res.json({
                  Status: "OK",
                  Message: "Special needs linked to child successfully"
                });
              }
            }
          );
        });
      });
    }
  );
});

// ✅ GET CHILD NEEDS
router.get('/child_sn', (req, res) => {
  const Child_ID = req.query.id;

  if (!Child_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  const sql = `
    SELECT snt.SNT_ID, snt.Special_Need_Types 
    FROM child_sn cs 
    JOIN special_need_type snt ON cs.SNT_ID = snt.SNT_ID 
    WHERE cs.Child_ID = ?
  `;

  con.query(sql, [Child_ID], (err, result) => {
    if (err) {
      console.error('Error fetching child special needs:', err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }

    res.json(Array.isArray(result) ? result : []);
    console.log('Fetched special needs for child:', Child_ID);
  });
});

// ✅ UPDATE (REPLACE ALL NEEDS)
router.put('/child_sn', (req, res) => {
  console.log("PUT /child_sn - Update Request Received", req.body);
  
  const { Child_ID, specialNeeds } = req.body;

  if (!Child_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  if (!Array.isArray(specialNeeds)) {
    return res.status(400).json({
      Status: "Error",
      Message: "specialNeeds must be an array"
    });
  }

  // Delete all existing special needs
  con.query("DELETE FROM child_sn WHERE Child_ID = ?", [Child_ID], (delErr, delResult) => {
    if (delErr) {
      console.error('Error deleting special needs:', delErr.message);
      return res.status(500).json({
        Status: "Error",
        Message: delErr.message
      });
    }

    // If no new needs, just respond with success
    if (specialNeeds.length === 0) {
      console.log("✅ All special needs removed for child:", Child_ID);
      return res.json({
        Status: "OK",
        Message: "Special needs updated successfully"
      });
    }

    // Insert all new special needs
    let completed = 0;
    let hasError = false;

    specialNeeds.forEach((sntId) => {
      con.query(
        "INSERT INTO child_sn (Child_ID, SNT_ID) VALUES (?, ?)",
        [Child_ID, sntId],
        (err, result) => {
          if (err && !hasError) {
            console.error('Error inserting special need:', err.message);
            hasError = true;
            return res.status(500).json({
              Status: "Error",
              Message: err.message
            });
          }

          completed++;
          if (completed === specialNeeds.length && !hasError) {
            console.log("✅ Special needs updated for child:", Child_ID);
            res.json({
              Status: "OK",
              Message: "Special needs updated successfully"
            });
          }
        }
      );
    });
  });
});

// ✅ DELETE CHILD NEEDS
router.delete('/child_sn', (req, res) => {
  const Child_ID = req.query.id;

  if (!Child_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  con.query(
    "DELETE FROM child_sn WHERE Child_ID = ?",
    [Child_ID],
    (err, result) => {
      if (err) {
        console.error('Error deleting special needs:', err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      console.log("✅ Special needs deleted for child:", Child_ID);
      res.json({
        Status: "OK",
        Message: "Deleted successfully"
      });
    }
  );
});

module.exports = router;
