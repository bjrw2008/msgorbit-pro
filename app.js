require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/logs', require('./routes/logs'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    createSuperAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Create Super Admin on first run
async function createSuperAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'super_admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('incorrect', 10);
      const superAdmin = new User({
        username: 'superadmin',
        email: 'admin@msgorbit.com',
        password: hashedPassword,
        role: 'super_admin',
        permissions: {
          addButtons: true,
          manageBots: true,
          manageAdmins: true,
          viewLogs: true
        },
        isActive: true
      });
      await superAdmin.save();
      console.log('✅ Super Admin created: admin@msgorbit.com / Admin123!');
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}
// Serve dashboard
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
