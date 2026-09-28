const mysql = require('mysql');
const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const con = require('../../config/db');

router.get('/', (req, res) => {
  res.status(200).send("<H1>Welcome TO booking Node.js Server</H1>");
});

// GET sessions/children reserved with a specific shadow teacher
router.get('/shadow-teacher-sessions', (req, res) => {
  const ST_ID = req.query.ST_ID;

  if (!ST_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "ST_ID is required"
    });
  }

  const sql = `
    SELECT 
      b.B_ID,
      b.Session_type,
      b.Duration,
      b.Start_time,
      b.End_time,
      b.Date,
      b.Service_type,
      b.Booking_status,
      b.Session_price,
      b.Comission_amount,
      b.Provider_income,
      b.Visa,
      b.Instapay,
      b.ST_ID,
      b.T_ID,
      b.Child_ID,
      b.P_ID,
      b.Notes,
      c.Child_ID  AS c_Child_ID,
      c.Name      AS Child_Name,
      c.DOB,
      c.Gender,
      c.Extra_Details
    FROM booking b
    LEFT JOIN child c ON b.Child_ID = c.Child_ID
    WHERE b.ST_ID = ?
    ORDER BY b.Date, b.Start_time
  `;

  con.query(sql, [ST_ID], function (err, result) {
    if (err) {
      console.error("Shadow teacher sessions query failed:", err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }

    res.json(result);
  });
});

// GET sessions/children reserved with a specific therapist
// Important: do NOT return booking.Notes here.
// Therapist notes will come from therapy_session table, not booking table.
router.get('/therapist-sessions', (req, res) => {
  const T_ID = req.query.T_ID;

  if (!T_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "T_ID is required"
    });
  }

  const sql = `
    SELECT 
      b.B_ID,
      b.Session_type,
      b.Duration,
      b.Start_time,
      b.End_time,
      b.Date,
      b.Service_type,
      b.Booking_status,
      b.Session_price,
      b.Comission_amount,
      b.Provider_income,
      b.Visa,
      b.Instapay,
      b.ST_ID,
      b.T_ID,
      b.Child_ID,
      b.P_ID,
      b.Notes,
      c.*
    FROM booking b
    LEFT JOIN child c ON b.Child_ID = c.Child_ID
    WHERE b.T_ID = ?
    ORDER BY b.Date, b.Start_time
  `;

  con.query(sql, [T_ID], function (err, result) {
    if (err) {
      console.error("Therapist sessions query failed:", err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }

    res.json(result);
  });
});

// GET /booking/by-child — all bookings for a specific child (for parent profile)
router.get('/by-child', (req, res) => {
  const Child_ID = req.query.Child_ID;

  if (!Child_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "Child_ID is required"
    });
  }

  const sql = `
    SELECT 
      b.B_ID,
      b.Session_type,
      b.Duration,
      b.Start_time,
      b.End_time,
      b.Date,
      b.Service_type,
      b.Booking_status,
      b.Session_price,
      b.T_ID,
      b.ST_ID,
      b.P_ID,
      b.Child_ID,
      b.Notes,
      t.Fullname AS therapist_name,
      st.Fullname AS shadow_teacher_name
    FROM booking b
    LEFT JOIN therapist t ON b.T_ID = t.T_ID
    LEFT JOIN shadow_teacher st ON b.ST_ID = st.ST_ID
    WHERE b.Child_ID = ?
    ORDER BY b.Date DESC, b.Start_time DESC
  `;

  con.query(sql, [Child_ID], function (err, result) {
    if (err) {
      console.error("by-child query failed:", err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }
    res.json(result);
  });
});

// GET /booking/all-bookings — admin overview with joined names
router.get('/all-bookings', (req, res) => {
  const sql = `
    SELECT
      b.B_ID,
      b.Session_type,
      b.Duration,
      b.Start_time,
      b.End_time,
      b.Date,
      b.Service_type,
      b.Booking_status,
      b.Session_price,
      b.Comission_amount,
      b.Provider_income,
      b.Visa,
      b.Instapay,
      b.T_ID,
      b.ST_ID,
      b.Child_ID,
      b.P_ID,
      b.Notes,
      t.Fullname      AS therapist_name,
      st.Fullname     AS shadow_teacher_name,
      c.Name          AS child_name,
      p.Full_Name     AS parent_name
    FROM booking b
    LEFT JOIN therapist      t  ON b.T_ID     = t.T_ID
    LEFT JOIN shadow_teacher st ON b.ST_ID    = st.ST_ID
    LEFT JOIN child          c  ON b.Child_ID = c.Child_ID
    LEFT JOIN parent         p  ON b.P_ID     = p.P_ID
    ORDER BY b.Date DESC, b.Start_time DESC
  `;
  con.query(sql, [], function (err, result) {
    if (err) {
      console.error('all-bookings query failed:', err.message);
      return res.status(500).json({ Status: 'Error', Message: err.message });
    }
    res.json(result);
  });
});

// GET /booking
router.get('/booking', (req, res) => {
  const B_ID = req.query.id;

  let sql = 'SELECT * FROM booking';
  let params = [];

  if (B_ID && B_ID !== '%') {
    const idNum = Number(B_ID);
    if (!Number.isInteger(idNum)) {
      return res.status(400).json({
        Status: "Error",
        Message: "Query param 'id' must be an integer or '%'."
      });
    }

    sql += ' WHERE B_ID = ?';
    params = [idNum];
  }

  con.query(sql, params, function (err, result) {
    if (err) {
      console.error('DB query failed:', err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }

    res.json(result);
  });
});

// POST /booking — B_ID is auto-incremented by MySQL, do NOT send it from frontend
router.post('/booking', (req, res) => {
  console.log("Post Request Received", req.body);

  const {
    Session_type,
    Duration,
    Start_time,
    End_time,
    Date,
    Service_type,
    Booking_status,
    Session_price,
    Comission_amount,
    Provider_income,
    Visa,
    Instapay,
    ST_ID,
    T_ID,
    Child_ID,
    P_ID,
    Notes
  } = req.body || {};

  // Use explicit null/undefined checks so 0 (falsy) values pass validation
  if (
    !Session_type ||
    !Duration ||
    !Start_time ||
    !End_time ||
    !Date ||
    !Service_type ||
    !Booking_status ||
    Session_price === null || Session_price === undefined ||
    Comission_amount === null || Comission_amount === undefined ||
    Provider_income === null || Provider_income === undefined ||
    Visa === null || Visa === undefined ||
    Instapay === null || Instapay === undefined ||
    !Child_ID ||
    (!ST_ID && !T_ID)
  ) {
    return res.status(400).json({
      Status: "Error",
      Message: "Session_type, Duration, Start_time, End_time, Date, Service_type, Booking_status, Session_price, Comission_amount, Provider_income, Visa, Instapay, Child_ID, and either ST_ID or T_ID are required"
    });
  }

  // B_ID is omitted — MySQL auto_increment handles it
  const sql = `
    INSERT INTO booking
    (
      Session_type,
      Duration,
      Start_time,
      End_time,
      Date,
      Service_type,
      Booking_status,
      Session_price,
      Comission_amount,
      Provider_income,
      Visa,
      Instapay,
      ST_ID,
      T_ID,
      Child_ID,
      P_ID,
      Notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  con.query(
    sql,
    [
      Session_type,
      Duration,
      Start_time,
      End_time,
      Date,
      Service_type,
      Booking_status,
      Session_price,
      Comission_amount,
      Provider_income,
      Visa,
      Instapay,
      ST_ID || null,
      T_ID || null,
      Child_ID,
      P_ID || null,
      Notes || null
    ],
    function (err, result) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      res.json({
        Status: "OK",
        Message: "Booking saved successfully with ID " + result.insertId,
        B_ID: result.insertId
      });
    }
  );
});

// PUT /booking
router.put('/booking', (req, res) => {
  console.log("PUT Request Received");
  const B_ID = req.query.id;

  con.query(
    `UPDATE booking 
     SET 
      Session_type = ?,
      Duration = ?,
      Start_time = ?,
      End_time = ?,
      Date = ?,
      Service_type = ?,
      Booking_status = ?,
      Session_price = ?,
      Comission_amount = ?,
      Provider_income = ?,
      Visa = ?,
      Instapay = ?,
      ST_ID = ?,
      T_ID = ?,
      Child_ID = ?,
      P_ID = ?,
      Notes = ?
     WHERE B_ID = ?`,
    [
      req.body.Session_type,
      req.body.Duration,
      req.body.Start_time,
      req.body.End_time,
      req.body.Date,
      req.body.Service_type,
      req.body.Booking_status,
      req.body.Session_price,
      req.body.Comission_amount,
      req.body.Provider_income,
      req.body.Visa,
      req.body.Instapay,
      req.body.ST_ID || null,
      req.body.T_ID || null,
      req.body.Child_ID,
      req.body.P_ID || null,
      req.body.Notes || null,
      B_ID
    ],
    function (err, result) {
      if (err) {
        console.error("Update failed:", err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.json({
          Status: "Error",
          Message: "Record not found"
        });
      }

      return res.json({
        Status: "OK",
        Message: "Record Id [" + B_ID + "] is Updated Successfully"
      });
    }
  );
});

// PATCH /booking-status — update ONLY the Booking_status column
router.patch('/booking-status', (req, res) => {
  const B_ID = req.query.id;
  const { Booking_status } = req.body || {};

  if (!B_ID || !Booking_status) {
    return res.status(400).json({ Status: 'Error', Message: 'B_ID and Booking_status are required' });
  }

  con.query(
    'UPDATE booking SET Booking_status = ? WHERE B_ID = ?',
    [Booking_status, B_ID],
    function (err, result) {
      if (err) {
        console.error('Status update failed:', err.message);
        return res.status(500).json({ Status: 'Error', Message: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ Status: 'Error', Message: 'Booking not found' });
      }
      return res.json({ Status: 'OK', Message: 'Booking_status updated for B_ID ' + B_ID });
    }
  );
});

// UPDATE note for any booking (therapist or shadow teacher)
router.put('/booking-note', (req, res) => {
  const B_ID = req.query.id;
  const { Notes } = req.body || {};

  if (!B_ID) {
    return res.status(400).json({
      Status: "Error",
      Message: "B_ID is required"
    });
  }

  // Works for both therapist bookings (T_ID) and shadow teacher bookings (ST_ID)
  const sql = `UPDATE booking SET Notes = ? WHERE B_ID = ?`;

  con.query(sql, [Notes || null, B_ID], function (err, result) {
    if (err) {
      console.error("Update booking note failed:", err.message);
      return res.status(500).json({
        Status: "Error",
        Message: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: "Error",
        Message: "Booking not found with B_ID: " + B_ID
      });
    }

    res.json({
      Status: "OK",
      Message: "Booking note updated successfully for B_ID: " + B_ID
    });
  });
});

// DELETE /booking
router.delete('/booking', (req, res) => {
  const B_ID = req.query.id;

  con.query(
    "DELETE FROM booking WHERE B_ID = ?",
    [B_ID],
    function (err, result) {
      if (err) {
        console.error("Delete failed:", err.message);
        return res.status(500).json({
          Status: "Error",
          Message: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: "Not Found",
          Message: "Record Id [" + B_ID + "] does not exist"
        });
      }

      res.json({
        Status: "OK",
        Message: "Record Id [" + B_ID + "] deleted Successfully"
      });
    }
  );
});

// SEARCH
router.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const keyvalue = req.query.keyvalue;
  const sort = req.query.sort || 'ASC';

  con.query(
    "SELECT * FROM booking WHERE " + keyword + " = ? ORDER BY B_ID " + sort,
    [keyvalue],
    function (err, result) {
      if (err) {
        res.json({
          Status: "Error",
          Message: err.message
        });
      } else {
        res.json(result);
      }
    }
  );
});

module.exports = router;