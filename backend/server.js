// server.js
const express    = require('express');
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const cors       = require('cors');

dotenv.config();

const authRoutes    = require('./routes/authRoutes');
const skillRoutes   = require('./routes/skillRoutes');
const reviewRoutes  = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const forumRoutes   = require('./routes/forumRoutes');
const messageRoutes = require('./routes/messageRoutes');  // now has GET /private/:user1/:user2 and POST /private
const notificationRoutes = require('./routes/notificationRoutes'); // new route for notifications

const app = express();

// enable CORS for all origins (tweak in production)
app.use(cors());

// parse JSON bodies
app.use(express.json());

// connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// mount your existing REST routes
app.use('/api/auth',    authRoutes);
app.use('/api/skills',  skillRoutes);
app.use('/api/skills/:skillId/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/forum',   forumRoutes);
app.use('/api/notifications', notificationRoutes); // mount notification routes
// mount message routes for polling
// GET  /api/messages/private/:user1/:user2  → fetch conversation history
// POST /api/messages/private                → send a new message
app.use('/api/messages', messageRoutes);
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
// start the HTTP server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
