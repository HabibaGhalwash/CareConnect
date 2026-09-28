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
    const uniqueName = 'therapist-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const con = require('../../config/db');

router.get('/', (req, res) => {
  res.status(200).send('<H1>Welcome TO therapist.server.js Server</H1>');
});

/* GET all therapists or one therapist */
router.get('/therapist', (req, res) => {
  const T_ID = req.query.id;

  let sql = 'SELECT * FROM therapist';
  let params = [];

  if (T_ID && T_ID !== '%') {
    const idNum = Number(T_ID);

    if (!Number.isInteger(idNum)) {
      return res.status(400).json({
        Status: 'Error',
        Message: "Query param 'id' must be an integer or '%'."
      });
    }

    sql += ' WHERE T_ID = ?';
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

/* GET pending therapist applications for admin */
router.get('/pending-applications', (req, res) => {
  const sql = `
    SELECT *
    FROM therapist
    WHERE Status = 'Pending'
    ORDER BY T_ID DESC
  `;

  con.query(sql, function (err, result) {
    if (err) {
      console.error('Pending therapist applications query failed:', err.message);
      return res.status(500).json({
        Status: 'Error',
        Message: err.message
      });
    }

    res.json(result);
  });
});

/* POST create therapist application */
router.post('/therapist', upload.single('CV'), (req, res) => {
  console.log('POST Therapist Request Received', req.body);

  // CV file uploaded during signup (certification document)
  const cvPath = req.file ? `/uploads/${req.file.filename}` : req.body.CV || null;

  const {
    T_ID,
    Fullname,
    Availability,
    Experience,
    Specialization,
    Hourly_Rate,
    Email,
    Password,
    CV
  } = req.body || {};

  const Status = req.body.Status || 'Pending';

  // Hourly_Rate and Availability are now optional during signup
  if (
    !Fullname ||
    !Experience ||
    !Specialization ||
    !Email ||
    !Password
  ) {
    return res.status(400).json({
      Status: 'Error',
      Message:
        'Fullname, Experience, Specialization, Email, and Password are required'
    });
  }

  const finalAvailability =
    Availability === undefined || Availability === '' ? null : Availability;

  const finalHourlyRate =
    Hourly_Rate === undefined || Hourly_Rate === '' ? null : Hourly_Rate;

  con.query(
    'SELECT COALESCE(MAX(T_ID), 0) + 1 AS nextId FROM therapist',
    function (idErr, idRows) {
      if (idErr) {
        console.error('ID generation failed:', idErr.message);
        return res.status(500).json({
          Status: 'Error',
          Message: idErr.message
        });
      }

      const newT_ID = T_ID ? Number(T_ID) : idRows[0].nextId;

      if (!Number.isInteger(newT_ID)) {
        return res.status(400).json({
          Status: 'Error',
          Message: 'T_ID must be a valid integer'
        });
      }

      const sql = `
        INSERT INTO therapist
        (
          T_ID,
          Fullname,
          Availability,
          Experience,
          Specialization,
          Hourly_Rate,
          Email,
          Password,
          CV,
          Imagepath,
          Status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      con.query(
        sql,
        [
          newT_ID,
          Fullname,
          finalAvailability,
          Experience,
          Specialization,
          finalHourlyRate,
          Email,
          Password,
          cvPath,
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
            Message: 'Therapist application submitted successfully',
            T_ID: newT_ID,
            ApplicationStatus: Status,
            CV: cvPath,
            Imagepath: null
          });
        }
      );
    }
  );
});

/* DELETE therapist */
router.delete('/therapist', (req, res) => {
  const T_ID = req.query.id;

  con.query(
    'DELETE FROM therapist WHERE T_ID = ?',
    [T_ID],
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
          Message: `Record Id [${T_ID}] does not exist`
        });
      }

      res.json({
        Status: 'OK',
        Message: `Record Id [${T_ID}] deleted successfully`
      });
    }
  );
});

/* PUT update therapist */
router.put('/therapist', upload.single('image'), (req, res) => {
  console.log('PUT Therapist Request Received');

  const T_ID = Number(req.query.id);
  const bodyT_ID = req.body.T_ID !== undefined ? Number(req.body.T_ID) : null;

  if (!Number.isInteger(T_ID)) {
    return res.status(400).json({
      Status: 'Error',
      Message: "Query param 'id' must be a valid integer"
    });
  }

  if (bodyT_ID !== null && bodyT_ID !== T_ID) {
    return res.status(400).json({
      Status: 'Error',
      Message: `ID mismatch: query id is ${T_ID} but body T_ID is ${bodyT_ID}`
    });
  }

  con.query(
    'SELECT * FROM therapist WHERE T_ID = ?',
    [T_ID],
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
          Message: `Record Id [${T_ID}] not found`
        });
      }

      const current = rows[0];

      const Fullname = req.body.Fullname ?? current.Fullname;
      const Availability = req.body.Availability ?? current.Availability;
      const Experience = req.body.Experience ?? current.Experience;
      const Specialization = req.body.Specialization ?? current.Specialization;
      const Hourly_Rate = req.body.Hourly_Rate ?? current.Hourly_Rate;
      const Email = req.body.Email ?? current.Email;
      const Password = req.body.Password ?? current.Password;
      const CV = req.body.CV ?? current.CV;
      const Imagepath = req.file
        ? `/uploads/${req.file.filename}`
        : req.body.Imagepath ?? current.Imagepath;
      const Status = req.body.Status ?? current.Status ?? 'Pending';

      con.query(
        `UPDATE therapist
         SET
          Fullname = ?,
          Availability = ?,
          Experience = ?,
          Specialization = ?,
          Hourly_Rate = ?,
          Email = ?,
          Password = ?,
          CV = ?,
          Imagepath = ?,
          Status = ?
         WHERE T_ID = ?`,
        [
          Fullname,
          Availability,
          Experience,
          Specialization,
          Hourly_Rate,
          Email,
          Password,
          CV,
          Imagepath,
          Status,
          T_ID
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
            Message: `Record Id [${T_ID}] updated successfully`,
            Imagepath: Imagepath,
            AccountStatus: Status
          });
        }
      );
    }
  );
});

/* Admin approve therapist */
router.put('/approve/:id', (req, res) => {
  const T_ID = Number(req.params.id);

  if (!Number.isInteger(T_ID)) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Invalid T_ID'
    });
  }

  con.query(
    "UPDATE therapist SET Status = 'Accepted' WHERE T_ID = ?",
    [T_ID],
    function (err, result) {
      if (err) {
        console.error('Therapist approval failed:', err.message);
        return res.status(500).json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: 'Error',
          Message: `Therapist ID [${T_ID}] not found`
        });
      }

      res.json({
        Status: 'OK',
        Message: 'Therapist approved successfully'
      });
    }
  );
});

/* Admin reject therapist */
router.put('/reject/:id', (req, res) => {
  const T_ID = Number(req.params.id);

  if (!Number.isInteger(T_ID)) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Invalid T_ID'
    });
  }

  con.query(
    "UPDATE therapist SET Status = 'Rejected' WHERE T_ID = ?",
    [T_ID],
    function (err, result) {
      if (err) {
        console.error('Therapist reject failed:', err.message);
        return res.status(500).json({
          Status: 'Error',
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: 'Error',
          Message: `Therapist ID [${T_ID}] not found`
        });
      }

      res.json({
        Status: 'OK',
        Message: 'Therapist rejected successfully'
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
    'T_ID',
    'Fullname',
    'Availability',
    'Experience',
    'Specialization',
    'Hourly_Rate',
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
    `SELECT * FROM therapist WHERE ${keyword} = ? ORDER BY T_ID ${safeSort}`,
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
    'SELECT * FROM therapist WHERE Email = ? AND Password = ?',
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

      const therapist = result[0];
      const accountStatus = therapist.Status || 'Pending';

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
        T_ID: therapist.T_ID,
        Fullname: therapist.Fullname,
        Email: therapist.Email,
        AccountStatus: therapist.Status
      });
    }
  );
});

module.exports = router;