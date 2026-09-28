const express = require('express');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const con = require('../../config/db');

router.get('/', (req, res) => {
  res.status(200).send('<H1>Welcome TO therapy_session.server.js Server</H1>');
});

/* GET therapy sessions / therapist notes */
router.get('/therapy_session', (req, res) => {
  const { T_ID, P_ID, B_ID } = req.query;

  let sql = 'SELECT * FROM therapy_session';
  let params = [];
  let conditions = [];

  if (T_ID && T_ID !== '%') {
    const tIdNum = Number(T_ID);

    if (!Number.isInteger(tIdNum)) {
      return res.status(400).json({
        Status: 'Error',
        Message: "Query param 'T_ID' must be an integer or '%'."
      });
    }

    conditions.push('T_ID = ?');
    params.push(tIdNum);
  }

  if (P_ID && P_ID !== '%') {
    const pIdNum = Number(P_ID);

    if (!Number.isInteger(pIdNum)) {
      return res.status(400).json({
        Status: 'Error',
        Message: "Query param 'P_ID' must be an integer or '%'."
      });
    }

    conditions.push('P_ID = ?');
    params.push(pIdNum);
  }

  if (B_ID && B_ID !== '%') {
    const bIdNum = Number(B_ID);

    if (!Number.isInteger(bIdNum)) {
      return res.status(400).json({
        Status: 'Error',
        Message: "Query param 'B_ID' must be an integer or '%'."
      });
    }

    conditions.push('B_ID = ?');
    params.push(bIdNum);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
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

/* POST create therapist note */
router.post('/therapy_session', (req, res) => {
  console.log('POST Therapy Session Request Received', req.body);

  const { T_ID, P_ID, B_ID, Notes } = req.body || {};

  if (!T_ID || !P_ID || !B_ID || !Notes) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'T_ID, P_ID, B_ID, and Notes are required'
    });
  }

  const sql = `
    INSERT INTO therapy_session
    (
      T_ID,
      P_ID,
      B_ID,
      Notes
    )
    VALUES (?, ?, ?, ?)
  `;

  con.query(sql, [T_ID, P_ID, B_ID, Notes], function (err) {
    if (err) {
      console.error('Insert failed:', err.message);
      return res.status(500).json({
        Status: 'Error',
        Message: err.message
      });
    }

    res.json({
      Status: 'OK',
      Message: 'Therapist note added successfully'
    });
  });
});

/* PUT update therapist note by T_ID + P_ID + B_ID */
router.put('/therapy_session', (req, res) => {
  console.log('PUT Therapy Session Request Received');

  const { T_ID, P_ID, B_ID } = req.query;
  const { Notes } = req.body || {};

  if (!T_ID || !P_ID || !B_ID) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'T_ID, P_ID, and B_ID are required in query params'
    });
  }

  if (Notes === undefined) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Notes is required in request body'
    });
  }

  const sql = `
    UPDATE therapy_session
    SET Notes = ?
    WHERE T_ID = ? AND P_ID = ? AND B_ID = ?
  `;

  con.query(sql, [Notes, T_ID, P_ID, B_ID], function (err, result) {
    if (err) {
      console.error('Update failed:', err.message);
      return res.status(500).json({
        Status: 'Error',
        Message: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: 'Error',
        Message: 'Therapy session note not found'
      });
    }

    res.json({
      Status: 'OK',
      Message: 'Therapist note updated successfully'
    });
  });
});

/* SAVE therapist note: upsert by B_ID (if valid) or by T_ID+P_ID fallback */
router.put('/therapy-session-note', (req, res) => {
  const B_ID = req.query.id;
  const { T_ID, P_ID, Notes } = req.body || {};

  if (!T_ID) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'T_ID is required'
    });
  }

  if (Notes === undefined) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Notes is required'
    });
  }

  const bIdNum = B_ID ? Number(B_ID) : 0;
  const tIdNum = Number(T_ID);
  const pIdNum = P_ID ? Number(P_ID) : null;

  // If we have a valid positive B_ID, upsert by B_ID
  if (bIdNum > 0) {
    const checkSql = 'SELECT TS_ID FROM therapy_session WHERE B_ID = ?';

    con.query(checkSql, [bIdNum], function (checkErr, rows) {
      if (checkErr) {
        console.error('Check therapy session failed:', checkErr.message);
        return res.status(500).json({ Status: 'Error', Message: checkErr.message });
      }

      if (rows.length > 0) {
        con.query(
          'UPDATE therapy_session SET Notes = ?, T_ID = ?, P_ID = COALESCE(?, P_ID) WHERE B_ID = ?',
          [Notes, tIdNum, pIdNum, bIdNum],
          function (err) {
            if (err) {
              console.error('Update therapist note failed:', err.message);
              return res.status(500).json({ Status: 'Error', Message: err.message });
            }
            return res.json({ Status: 'OK', Message: 'Therapist note updated successfully' });
          }
        );
      } else {
        con.query(
          'INSERT INTO therapy_session (T_ID, P_ID, B_ID, Notes) VALUES (?, ?, ?, ?)',
          [tIdNum, pIdNum, bIdNum, Notes],
          function (err) {
            if (err) {
              console.error('Insert therapist note failed:', err.message);
              return res.status(500).json({ Status: 'Error', Message: err.message });
            }
            return res.json({ Status: 'OK', Message: 'Therapist note saved successfully' });
          }
        );
      }
    });

  // Fallback: no valid B_ID — upsert by T_ID + P_ID
  } else if (pIdNum) {
    const checkSql = 'SELECT TS_ID FROM therapy_session WHERE T_ID = ? AND P_ID = ?';

    con.query(checkSql, [tIdNum, pIdNum], function (checkErr, rows) {
      if (checkErr) {
        console.error('Check therapy session failed:', checkErr.message);
        return res.status(500).json({ Status: 'Error', Message: checkErr.message });
      }

      if (rows.length > 0) {
        con.query(
          'UPDATE therapy_session SET Notes = ? WHERE T_ID = ? AND P_ID = ?',
          [Notes, tIdNum, pIdNum],
          function (err) {
            if (err) return res.status(500).json({ Status: 'Error', Message: err.message });
            return res.json({ Status: 'OK', Message: 'Therapist note updated successfully' });
          }
        );
      } else {
        con.query(
          'INSERT INTO therapy_session (T_ID, P_ID, B_ID, Notes) VALUES (?, ?, NULL, ?)',
          [tIdNum, pIdNum, Notes],
          function (err) {
            if (err) return res.status(500).json({ Status: 'Error', Message: err.message });
            return res.json({ Status: 'OK', Message: 'Therapist note saved successfully' });
          }
        );
      }
    });

  // Last resort: just insert with T_ID only
  } else {
    con.query(
      'INSERT INTO therapy_session (T_ID, P_ID, B_ID, Notes) VALUES (?, NULL, NULL, ?)',
      [tIdNum, Notes],
      function (err) {
        if (err) {
          console.error('Insert therapist note (no B_ID/P_ID) failed:', err.message);
          return res.status(500).json({ Status: 'Error', Message: err.message });
        }
        return res.json({ Status: 'OK', Message: 'Therapist note saved successfully' });
      }
    );
  }
});

/* DELETE therapist note */
router.delete('/therapy_session', (req, res) => {
  const { T_ID, P_ID, B_ID } = req.query;

  if (!T_ID || !P_ID || !B_ID) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'T_ID, P_ID, and B_ID are required'
    });
  }

  const sql = `
    DELETE FROM therapy_session
    WHERE T_ID = ? AND P_ID = ? AND B_ID = ?
  `;

  con.query(sql, [T_ID, P_ID, B_ID], function (err, result) {
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
        Message: 'Therapist note not found'
      });
    }

    res.json({
      Status: 'OK',
      Message: 'Therapist note deleted successfully'
    });
  });
});

/* SEARCH */
router.get('/search', (req, res) => {
  const keyword = req.query.keyword;
  const keyvalue = req.query.keyvalue;
  const sort = req.query.sort || 'ASC';

  const allowedColumns = ['T_ID', 'P_ID', 'B_ID', 'Notes'];

  if (!allowedColumns.includes(keyword)) {
    return res.status(400).json({
      Status: 'Error',
      Message: 'Invalid search column'
    });
  }

  const safeSort = sort.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const sql = `
    SELECT *
    FROM therapy_session
    WHERE ${keyword} = ?
    ORDER BY T_ID ${safeSort}, P_ID ${safeSort}
  `;

  con.query(sql, [keyvalue], function (err, result) {
    if (err) {
      return res.status(500).json({
        Status: 'Error',
        Message: err.message
      });
    }

    res.json(result);
  });
});

module.exports = router;