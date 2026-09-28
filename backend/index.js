const express = require('express');
const mysql = require('mysql');
const http = require('http');
const cors = require("cors");
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/images', express.static('images'));

// ✅ SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for local dev
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

app.use(express.json());

// ✅ FILE STORAGE (MULTER)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.m4a';
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// ✅ SERVE AUDIO FILES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ AUDIO UPLOAD ROUTE
app.post('/upload-audio', upload.single('audio'), (req, res) => {
  const host = req.get('host'); // Dynamically get the host:port
  const fileUrl = `http://${host}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ✅ SOCKET.IO LOGIC
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('sendMessage', (msg) => {
    io.emit('receiveMessage', msg); // broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
const adminRouter = require('./modules/admin/admin.service');
app.use('/modules/admin', adminRouter);

const bookingRouter = require('./modules/booking/booking.service');
app.use('/modules/booking', bookingRouter);

const childRouter = require('./modules/child/child.service');
app.use('/modules/child', childRouter);

const communicationtoolRouter = require('./modules/communicationtool/communicationtool.service');
app.use('/modules/communicationtool', communicationtoolRouter);

const communityRouter = require('./modules/community/community.service');
app.use('/modules/community', communityRouter);

const market_placeRouter = require('./modules/market_place/market_place.service');
app.use('/modules/market_place', market_placeRouter);

const parentRouter = require('./modules/parent/parent.service');
app.use('/modules/parent', parentRouter);

const shadow_teacherRouter = require('./modules/shadow_teacher/shadow_teacher.service');
app.use('/modules/shadow_teacher', shadow_teacherRouter);

const schoolRouter = require('./modules/school/school.service');
app.use('/modules/school', schoolRouter);

const special_need_typeRouter = require('./modules/special_need_type/special_need_type.service');
app.use('/modules/special_need_type', special_need_typeRouter);

const child_snRouter = require('./modules/child_sn/child_sn.service');
app.use('/modules/child_sn', child_snRouter);

const staffRouter = require('./modules/staff/staff.service');
app.use('/modules/staff', staffRouter);

const subscriptionRouter = require('./modules/subscription/subscription.service');
app.use('/modules/subscription', subscriptionRouter);

const therapistRouter = require('./modules/therapist/therapist.service');
app.use('/modules/therapist', therapistRouter);

const therapy_sessionRouter = require('./modules/therapy_session/therapy_session.service');
app.use('/modules/therapy_session', therapy_sessionRouter);
// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
    return;
  }
  console.log('MySQL connected');
});

app.get("/createdb", (req, res) => {
  const sql = "CREATE DATABASE IF NOT EXISTS nodemysql";
  db.query(sql, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error: " + err.message);
    }
    res.send("Database 'nodemysql' created.");
  });
});
app.get('/', (req, res) => {
  res.send('Server is running successfully');
});
const PORT = 8080
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});