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

// ✅ MULTER CONFIG — same pattern as school.service.js
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'ct_' + Date.now() + ext);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
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
  res.status(200).send('<H1>Welcome TO communicationtool.server.js Server</H1>');
});

// GET /communication_tool  -> all cards (or one by id)
router.get('/communication_tool', (req, res) => {
  const CT_ID = req.query.id;

  let sql = 'SELECT * FROM communication_tool';
  let params = [];

  if (CT_ID && CT_ID !== '%') {
    const idNum = Number(CT_ID);
    if (!Number.isInteger(idNum)) {
      return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
    }
    sql += ' WHERE CT_ID = ?';
    params = [idNum];
  }

  con.query(sql, params, function (err, result) {
    if (err) {
      console.error('DB query failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
    console.log(result);
  });
});

// POST /communication_tool — create a new card with image upload (same as school)
router.post('/communication_tool', imageUpload.single('image'), (req, res) => {
  console.log('POST /communication_tool - Request Received', req.body);
  console.log('File:', req.file);

  const { CT_ID, Phrase, Button_Label } = req.body || {};
  const imageFilename = req.file ? req.file.filename : null;

  if (!CT_ID || !Phrase || !Button_Label) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'CT_ID, Phrase, and Button_Label are required'
    });
  }

  if (!imageFilename) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'An image file is required'
    });
  }

  const sql = 'INSERT INTO communication_tool (`CT_ID`,`Phrase`,`Button_Label`,`Icon_Image`) VALUES (?,?,?,?)';

  con.query(sql, [CT_ID, Phrase, Button_Label, imageFilename], function (err, result) {
    if (err) {
      console.error('Insert failed:', err.message);
      return res.status(500).json({ Status: 'Error', Message: err.message });
    }
    console.log('✅ Card Added with ID:', result.insertId);
    res.status(201).json({
      Status: 'OK',
      Message: 'Card added successfully',
      CT_ID: result.insertId,
      Icon_Image: imageFilename
    });
  });
});

// DELETE /communication_tool?id=CT_ID
router.delete('/communication_tool', (req, res) => {
  const CT_ID = req.query.id;
  con.query('DELETE FROM communication_tool WHERE CT_ID = ?', [CT_ID], function (err, result) {
    if (err) throw err;
    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: 'Not Found',
        Message: 'Record Id [' + CT_ID + '] does not exist'
      });
    }
    res.json({ Status: 'OK', Message: 'Record Id [' + CT_ID + '] deleted Successfully' });
    console.log('Delete Request for record [' + CT_ID + '] received');
  });
});

// PUT /communication_tool?id=CT_ID — update card, optional new image (same as school)
router.put('/communication_tool', imageUpload.single('image'), (req, res) => {
  console.log('PUT /communication_tool - Update Request Received');
  const CT_ID = req.query.id;

  if (!CT_ID) {
    return res.status(400).json({ Status: 'Error', Message: 'CT_ID is required' });
  }

  // Fetch existing record to keep old image if no new file uploaded
  con.query('SELECT Icon_Image FROM communication_tool WHERE CT_ID = ?', [CT_ID], (selectErr, selectResult) => {
    if (selectErr) {
      return res.status(500).json({ Status: 'Error', Message: selectErr.message });
    }
    if (!selectResult || selectResult.length === 0) {
      return res.status(404).json({ Status: 'Error', Message: 'Card not found' });
    }

    const imageFilename = req.file ? req.file.filename : selectResult[0].Icon_Image;

    con.query(
      'UPDATE communication_tool SET `Phrase` = ?, `Button_Label` = ?, `Icon_Image` = ? WHERE CT_ID = ?',
      [req.body.Phrase, req.body.Button_Label, imageFilename, CT_ID],
      function (err, result) {
        if (err) {
          console.error('Update failed:', err.message);
          return res.status(500).json({ Status: 'Error', Message: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ Status: 'Error', Message: 'Record not found' });
        }
        if (result.changedRows === 0) {
          return res.json({ Status: 'OK', Message: 'No changes made (same data sent)' });
        }
        console.log('✅ Card [' + CT_ID + '] updated successfully');
        return res.json({
          Status: 'OK',
          Message: 'Card [' + CT_ID + '] updated successfully',
          Icon_Image: imageFilename
        });
      }
    );
  });
});

// SEARCH
router.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const keyvalue = req.query.keyvalue;
  const sort = req.query.sort;

  con.query(
    'SELECT * FROM communication_tool WHERE ' + keyword + ' = ? ORDER BY CT_ID ' + sort,
    [keyvalue],
    function (err, result) {
      if (err) {
        res.json({ Status: 'Error', Message: err });
      } else {
        res.json(result);
        console.log(result);
      }
    }
  );
  console.log('Incoming SEARCH Request');
});

module.exports = router;
module.exports = router;