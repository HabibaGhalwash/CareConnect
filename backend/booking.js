const mysql = require('mysql'); //Database functionality
const express = require('express'); //express is a web framework for Node.js
const PORT = 8080; //Server Listening Port
const app = express(); // create app from express object

// Middleware to parse JSON and URL-encoded bodies from Postman
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
global.con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: "",
  database: 'nodemysql'
});

con.connect(function (err) {
  if (err) throw err;
  console.log('MySQL connected (booking.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO booking Node.js Server</H1>");
});
// GET /users       -> all users
app.get('/booking', (req, res) => {
    const B_ID = req.query.id;
  
    let sql = 'SELECT * FROM booking';
    let params = [];
  
    if (B_ID && B_ID !== '%') {
      const idNum = Number(B_ID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }

      sql += ' WHERE B_ID = ?';
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

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`booking.service.js server running at http://localhost:${PORT}`);
});
// POST /staff to create a new staff record
app.post('/booking', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { B_ID, Session_type, Duration, Start_time, End_time, Date, Service_type, Booking_status, Session_price, Comission_amount, Provider_income, Visa, Instapay } = req.body || {};
  
    if (!B_ID || !Session_type || !Duration || !Start_time || !End_time || !Date || !Service_type || !Booking_status || !Session_price || !Comission_amount || !Provider_income || !Visa || !Instapay) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "B_ID, Session_type, Duration, Start_time, End_time, Date, Service_type, Booking_status, Session_price, Comission_amount, Provider_income, Visa and Instapay are required" });
    }
  
    const sql = "INSERT INTO booking (`B_ID`,`Session_type`,`Duration`,`Start_time`,`End_time`,`Date`,`Service_type`,`Booking_status`,`Session_price`,`Comission_amount`,`Provider_income`,`Visa`,`Instapay`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
  
    con.query(sql, [B_ID, Session_type, Duration, Start_time, End_time, Date, Service_type, Booking_status, Session_price, Comission_amount, Provider_income, Visa, Instapay], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/booking',(req,res)=>{
    var B_ID= req.query.id;
    con.query("DELETE FROM booking where B_ID = ?", [B_ID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/booking', (req, res) => {
    console.log("PUT Request Received");
    var B_ID = req.query.id;
  
    con.query(
      "UPDATE booking SET `Session_type` = ?, `Duration` = ?, `Start_time` = ?, `End_time` = ?, `Date` = ?, `Service_type` = ?, `Booking_status` = ?, `Session_price` = ?, `Comission_amount` = ?, `Provider_income` = ?, `Visa` = ?, `Instapay` = ? WHERE B_ID = ?",
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
        B_ID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + B_ID + "] is Updated Successfully" });
        console.log("Record Id [" + B_ID + "] is Updated Successfully");
      }
    );
  });