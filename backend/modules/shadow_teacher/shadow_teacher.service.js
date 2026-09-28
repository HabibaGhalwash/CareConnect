const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

/* FILE UPLOAD SETUP */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = 'teacher-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const con = require('../../config/db');

router.get('/', (req, res) => {
  res.status(200).send('<H1>Welcome TO shadow_teacher.server.js Server</H1>');
});

/* GET all shadow teachers or one shadow teacher */
router.get('/shadow_teacher', (req, res) => {
  const ST_ID = req.query.id;

  let sql = 'SELECT * FROM shadow_teacher';
  let params = [];

  if (ST_ID && ST_ID !== '%') {
    const idNum = Number(ST_ID);

    if (!Number.isInteger(idNum)) {
      return res.status(400).json({
        Status: 'Error',
        Message: "Query param 'id' must be an integer or '%'."
      });
    }

    sql += ' WHERE ST_ID = ?';
    params = [idNum];
  }

  con.query(sql, params, function (err, result) {
    if (err) {
      console.error('DB query failed:', err.message);
      return res.status(500).json({
        Status: 'Error',
        Message: err.message
      });
    }

    res.json(result);
  });
});

/* GET pending shadow teacher applications for admin */
router.get('/pending-applications', (req, res) => {
  const sql = `
    SELECT *
    FROM shadow_teacher
    WHERE Status = 'Pending'
    ORDER BY ST_ID DESC
  `;

  con.query(sql, function (err, result) {
    if (err) {
      console.error('Pending applications query failed:', err.message);
      return res.status(500).json({
        Status: 'Error',
        Message: err.message
      });
    }

    res.json(result);
  });
});

/* POST create shadow teacher application */
router.post('/shadow_teacher', upload.single('CV'), (req, res) => {
  console.log('Post Request Received', req.body);

  // CV file uploaded during signup (certification document)
  const cvPath = req.file ? `/uploads/${req.file.filename}` : req.body.CV || null;

  const {
    ST_ID,
    Experience,
    Hourly_Rate,
    Availability,
    Fullname,
    Qualification,
    Email,
    Password,
    CV,
    P_ID,
    Child_ID
  } = req.body || {};

  const Status = req.body.Status || 'Pending';

  // Hourly_Rate and Availability are now optional during signup
  if (
    !Experience ||
    !Fullname ||
    !Qualification ||
    !Email ||
    !Password
  ) {
    return res.status(400).json({
      Status: 'Error',
      Message:
        'Experience, Fullname, Qualification, Email, and Password are required'
    });
  }

  const finalAvailability =
    Availability === undefined || Availability === '' ? null : Availability;

  const finalHourlyRate =
    Hourly_Rate === undefined || Hourly_Rate === '' ? null : Hourly_Rate;

  con.query(
    'SELECT COALESCE(MAX(ST_ID), 0) + 1 AS nextId FROM shadow_teacher',
    function (idErr, idRows) {
      if (idErr) {
        console.error('ID generation failed:', idErr.message);
        return res.status(500).json({
          Status: 'Error',
          Message: idErr.message
        });
      }

      const newST_ID = ST_ID ? Number(ST_ID) : idRows[0].nextId;

      if (!Number.isInteger(newST_ID)) {
        return res.status(400).json({
          Status: 'Error',
          Message: 'ST_ID must be a valid integer'
        });
      }

      const sql = `
        INSERT INTO shadow_teacher
        (
          ST_ID,
          Experience,
          Hourly_Rate,
          Availability,
          Fullname,
          Qualification,
          Email,
          Password,
          CV,
          P_ID,
          Child_ID,
          Imagepath,
          Status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      con.query(
        sql,
        [
          newST_ID,
          Experience,
          finalHourlyRate,
          finalAvailability,
          Fullname,
          Qualification,
          Email,
          Password,
          cvPath,
          P_ID || null,
          Child_ID || null,
          null,
          Status
        ],
        function (err) {
          if (err) {
            console.error('Insert failed:', err.message);
            return res.status(500).json({
              Status: 'Error',
              Message: err.message
            });
          }

          res.json({
            Status: 'OK',
            Message: 'Shadow teacher application submitted successfully',
            ST_ID: newST_ID,
            ApplicationStatus: Status,
            CV: cvPath,
            Imagepath: null
          });
        }
      );
    }
  );
});

/* DELETE shadow teacher */
router.delete('/shadow_teacher', (req, res) => {
  const ST_ID = req.query.id;

  con.query(
    'DELETE FROM shadow_teacher WHERE ST_ID = ?',
    [ST_ID],
    function (err, result) {
      if (err) {
        console.error('Delete failed:', err.message);
        return res.status(500).json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: 'Not Found',
          Message: `Record Id [${ST_ID}] does not exist`
        });
      }

      res.json({
        Status: 'OK',
        Message: `Record Id [${ST_ID}] deleted successfully`
      });
    }
  );
});

/* PUT update shadow teacher */
router.put('/shadow_teacher', upload.single('image'), (req, res) => {
  console.log('PUT Request Received');

  const ST_ID = Number(req.query.id);
  const bodyST_ID =
    req.body.ST_ID !== undefined ? Number(req.body.ST_ID) : null;

  if (!Number.isInteger(ST_ID)) {
    return res.status(400).json({
      Status: 'Error',
      Message: "Query param 'id' must be a valid integer"
    });
  }

  if (bodyST_ID !== null && bodyST_ID !== ST_ID) {
    return res.status(400).json({
      Status: 'Error',
      Message: `ID mismatch: query id is ${ST_ID} but body ST_ID is ${bodyST_ID}`
    });
  }

  con.query(
    'SELECT * FROM shadow_teacher WHERE ST_ID = ?',
    [ST_ID],
    function (err, rows) {
      if (err) {
        console.error('Select failed:', err.message);
        return res.status(500).json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          Status: 'Error',
          Message: `Record Id [${ST_ID}] not found`
        });
      }

      const current = rows[0];

      const Experience = req.body.Experience ?? current.Experience;
      const Hourly_Rate = req.body.Hourly_Rate ?? current.Hourly_Rate;
      const Availability = req.body.Availability ?? current.Availability;
      const Fullname = req.body.Fullname ?? current.Fullname;
      const Qualification = req.body.Qualification ?? current.Qualification;
      const Email = req.body.Email ?? current.Email;
      const Password = req.body.Password ?? current.Password;
      const CV = req.body.CV ?? current.CV;
      const P_ID = req.body.P_ID ?? current.P_ID;
      const Child_ID = req.body.Child_ID ?? current.Child_ID;
      const Imagepath = req.file
        ? `/uploads/${req.file.filename}`
        : current.Imagepath;
      const Status = req.body.Status ?? current.Status ?? 'Pending';

      con.query(
        `UPDATE shadow_teacher
         SET 
          Experience = ?,
          Hourly_Rate = ?,
          Availability = ?,
          Fullname = ?,
          Qualification = ?,
          Email = ?,
          Password = ?,
          CV = ?,
          P_ID = ?,
          Child_ID = ?,
          Imagepath = ?,
          Status = ?
         WHERE ST_ID = ?`,
        [
          Experience,
          Hourly_Rate,
          Availability,
          Fullname,
          Qualification,
          Email,
          Password,
          CV,
          P_ID,
          Child_ID,
          Imagepath,
          Status,
          ST_ID
        ],
        function (err) {
          if (err) {
            console.error('Update failed:', err.message);
            return res.status(500).json({
              Status: 'Error',
              Message: err.message
            });
          }

          return res.json({
            Status: 'OK',
            Message: `Record Id [${ST_ID}] updated successfully`,
            Imagepath: Imagepath,
            AccountStatus: Status
          });
        }
      );
    }
  );
});

/* Admin approve shadow teacher */
router.put('/approve/:id', (req, res) => {
  const ST_ID = Number(req.params.id);

  if (!Number.isInteger(ST_ID)) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Invalid ST_ID'
    });
  }

  con.query(
    "UPDATE shadow_teacher SET Status = 'Accepted' WHERE ST_ID = ?",
    [ST_ID],
    function (err, result) {
      if (err) {
        console.error('Approval failed:', err.message);
        return res.status(500).json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: 'Error',
          Message: `Shadow teacher ID [${ST_ID}] not found`
        });
      }

      res.json({
        Status: 'OK',
        Message: 'Shadow teacher approved successfully'
      });
    }
  );
});

/* Admin reject shadow teacher */
router.put('/reject/:id', (req, res) => {
  const ST_ID = Number(req.params.id);

  if (!Number.isInteger(ST_ID)) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Invalid ST_ID'
    });
  }

  con.query(
    "UPDATE shadow_teacher SET Status = 'Rejected' WHERE ST_ID = ?",
    [ST_ID],
    function (err, result) {
      if (err) {
        console.error('Reject failed:', err.message);
        return res.status(500).json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: 'Error',
          Message: `Shadow teacher ID [${ST_ID}] not found`
        });
      }

      res.json({
        Status: 'OK',
        Message: 'Shadow teacher rejected successfully'
      });
    }
  );
});

/* SEARCH */
router.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const keyvalue = req.query.keyvalue;
  const sort = req.query.sort || 'ASC';

  const allowedColumns = [
    'ST_ID',
    'Experience',
    'Hourly_Rate',
    'Availability',
    'Fullname',
    'Qualification',
    'Email',
    'Status'
  ];

  if (!allowedColumns.includes(keyword)) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Invalid search column'
    });
  }

  const safeSort = sort.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  con.query(
    `SELECT * FROM shadow_teacher WHERE ${keyword} = ? ORDER BY ST_ID ${safeSort}`,
    [keyvalue],
    function (err, result) {
      if (err) {
        return res.json({
          Status: 'Error',
          Message: err.message
        });
      }

      res.json(result);
    }
  );
});

/* LOGIN */
router.get('/login', (req, res) => {
  con.query(
    'SELECT * FROM shadow_teacher WHERE Email = ? AND Password = ?',
    [req.query.Email, req.query.Password],
    function (err, result) {
      if (err) {
        return res.json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (result.length === 0) {
        return res.json({
          Status: 'Error',
          Message: 'Authentication failed. Check email or password.'
        });
      }

      const teacher = result[0];
      const accountStatus = teacher.Status || 'Pending';

      if (String(accountStatus).toLowerCase() !== 'accepted') {
        return res.json({
          Status: 'Pending',
          Message: `Your account is ${accountStatus}. Please wait for admin approval.`,
          AccountStatus: accountStatus
        });
      }

      return res.json({
        Status: 'OK',
        Message: 'Logged in successfully',
        ST_ID: teacher.ST_ID,
        Fullname: teacher.Fullname,
        Email: teacher.Email,
        AccountStatus: teacher.Status
      });
    }
  );
});

module.exports = router;