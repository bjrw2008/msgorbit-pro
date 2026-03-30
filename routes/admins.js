const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware, superAdminOnly, checkPermission } = require('../middleware/auth');

router.use(authMiddleware);

// Get all admins (super admin only)
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Create new admin (super admin only)
router.post('/', superAdminOnly, async (req, res) => {
  try {
    const { username, email, password, permissions } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const admin = new User({
      username,
      email,
      password,
      role: 'admin',
      permissions: {
        addButtons: permissions?.addButtons || false,
        manageBots: permissions?.manageBots || false,
        manageAdmins: false,
        viewLogs: true
      },
      createdBy: req.user._id
    });

    await admin.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'create_admin',
      details: { createdAdmin: admin.email }
    });

    res.status(201).json({ message: 'Admin created', admin: { id: admin._id, username: admin.username, email: admin.email } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Remove admin (super admin only)
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const admin = await User.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'remove_admin',
      details: { removedAdmin: admin.email }
    });

    res.json({ message: 'Admin removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

// Update admin permissions (super admin only)
router.put('/:id', superAdminOnly, async (req, res) => {
  try {
    const { permissions } = req.body;
    const admin = await User.findById(req.params.id);
    
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
    }

    admin.permissions = {
      addButtons: permissions.addButtons || false,
      manageBots: permissions.manageBots || false,
      manageAdmins: false,
      viewLogs: true
    };

    await admin.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'update_admin_permissions',
      details: { admin: admin.email, permissions }
    });

    res.json({ message: 'Permissions updated', admin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

module.exports = router;