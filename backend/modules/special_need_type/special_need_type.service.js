const express = require('express');
const router = express.Router();
const con = require('../../config/db');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// TEST
router.get('/', (req, res) => {
  res.send("<h1>special_need_type service running</h1>");
});

// ✅ GET ALL SPECIAL NEED TYPES
router.get('/special_need_type', (req, res) => {
  con.query("SELECT * FROM special_need_type", (err, result) => {
    if (err) {
      console.error('Error fetching special need types:', err);
      return res.status(500).json({ 
        Status: "Error", 
        Message: err.message,
        data: []
      });
    }
    
    // Ensure we always return an array
    if (!Array.isArray(result)) {
      console.warn('special_need_type query did not return array, converting...');
      return res.json([]);
    }
    
    res.json(result);
  });
});

// ✅ ADD NEW TYPE
router.post('/special_need_type', (req, res) => {
  const { Special_Need_Types } = req.body;
  
  if (!Special_Need_Types) {
    return res.status(400).json({ 
      Status: "Error", 
      Message: "Special_Need_Types is required" 
    });
  }
  
  const sql = "INSERT INTO special_need_type (Special_Need_Types) VALUES (?)";
  con.query(sql, [Special_Need_Types], (err, result) => {
    if (err) {
      console.error('Error inserting special need type:', err);
      return res.status(500).json({ 
        Status: "Error", 
        Message: err.message 
      });
    }
    res.json({ 
      Status: "OK", 
      Message: "Added successfully", 
      SNT_ID: result.insertId 
    });
  });
});

// ✅ DELETE
router.delete('/special_need_type', (req, res) => {
  const SNT_ID = req.query.id;
  
  if (!SNT_ID) {
    return res.status(400).json({ 
      Status: "Error", 
      Message: "SNT_ID is required" 
    });
  }
  
  con.query(
    "DELETE FROM special_need_type WHERE SNT_ID = ?",
    [SNT_ID],
    (err, result) => {
      if (err) {
        console.error('Error deleting special need type:', err);
        return res.status(500).json({ 
          Status: "Error", 
          Message: err.message 
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          Status: "Error", 
          Message: "Type not found" 
        });
      }
      res.json({ 
        Status: "OK", 
        Message: "Deleted successfully" 
      });
    }
  );
});

// ✅ UPDATE
router.put('/special_need_type', (req, res) => {
  const SNT_ID = req.query.id;
  const { Special_Need_Types } = req.body;
  
  if (!SNT_ID || !Special_Need_Types) {
    return res.status(400).json({ 
      Status: "Error", 
      Message: "SNT_ID and Special_Need_Types are required" 
    });
  }
  
  con.query(
    "UPDATE special_need_type SET Special_Need_Types = ? WHERE SNT_ID = ?",
    [Special_Need_Types, SNT_ID],
    (err, result) => {
      if (err) {
        console.error('Error updating special need type:', err);
        return res.status(500).json({ 
          Status: "Error", 
          Message: err.message 
        });
      }
      res.json({ 
        Status: "OK", 
        Message: "Updated successfully" 
      });
    }
  );
});

// ✅ SEARCH TYPE
router.get('/special_need_type/search', (req, res) => {
  const { value } = req.query;
  
  if (!value) {
    return res.status(400).json({ 
      Status: "Error", 
      Message: "Search value is required" 
    });
  }
  
  con.query(
    "SELECT * FROM special_need_type WHERE Special_Need_Types LIKE ?",
    [`%${value}%`],
    (err, result) => {
      if (err) {
        console.error('Error searching special need types:', err);
        return res.status(500).json({ 
          Status: "Error", 
          Message: err.message,
          data: []
        });
      }
      res.json(Array.isArray(result) ? result : []);
    }
  );
});

module.exports = router;
