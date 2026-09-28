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
  console.log('MySQL connected (subscription.service.js)');
});

app.get('/', (req, res) => {
  console.log(`Incoming Request http://localhost:${PORT}`);
  res.status(200).send("<H1>Welcome TO subscription.server.js Server</H1>");
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`subscription.service.js server running at http://localhost:${PORT}`);
});
// GET /subscription      -> all subscription
app.get('/subscription', (req, res) => {
    const SID = req.query.id;
  
    let sql = 'SELECT * FROM subscription';
    let params = [];
  
    if (SID && SID !== '%') {
      const idNum = Number(SID);
      if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "Query param 'id' must be an integer or '%'." });
      }
  
      sql += ' WHERE SID = ?';
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
   // POST /subscription to create a new record
app.post('/subscription', (req, res) => {
    console.log("Post Request Received", req.body);
  
    const { SID,Offer_Details, Visa,Instapay } = req.body || {};
  
    if (!SID || !Offer_Details || !Visa || !Instapay) {
      return res
        .status(400)
        .json({ Status: "Error", Message: "SID,Offer_Details, Visa and Instapay are required" });
    }
  
    const sql = "INSERT INTO subscription (`SID`,`Offer_Details`, `Visa`,`Instapay`) VALUES (?,?,?,?)";
  
    con.query(sql, [SID,Offer_Details, Visa,Instapay], function (err, result, fields) {
      if (err) {
        console.error("Insert failed:", err.message);
        return res.status(500).json({ Status: "Error", Message: err.message });
      }
      res.json({ Status: "OK", Message: "Record Added Successfully with Id " + result.insertId });
      console.log("Record Added " + result.insertId);
    });
  });
  app.delete('/subscription',(req,res)=>{
    var SID= req.query.id;
    con.query("DELETE FROM subscription where SID = ?", [SID], function (err, result, fields) {
      if (err) throw err;
      res.json({"Status":"OK", "Message" : "Record Id ["+req.query.id+"] deleted Successfully"});
      console.log("Delete Request Received for record ["+req.query.id+"] received");
    });
  });
  app.put('/subscription', (req, res) => {
    console.log("PUT Request Received");
    var SID = req.query.id;
  
    con.query(
      "UPDATE subscription SET `Offer_Details` = ?, `Visa` = ?, `Instapay` = ? WHERE SID = ?",
      [
        req.body.Offer_Details,
        req.body.Visa,
        req.body.Instapay,
        SID
      ],
      function (err, result, fields) {
        if (err) {
          console.error("Update failed:", err.message);
          return res.status(500).json({ "Status": "Error", "Message": err.message });
        }
        res.json({ "Status": "OK", "Message": "Record Id [" + SID + "] is Updated Successfully" });
        console.log("Record Id [" + SID + "] is Updated Successfully");
      }
    );
  });