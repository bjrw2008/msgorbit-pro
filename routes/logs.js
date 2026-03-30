const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware, checkPermission, superAdminOnly } = require('../middleware/auth');

router.use(authMiddleware);

// Get activity logs (requires viewLogs permission)
router.get('/', checkPermission('viewLogs'), async (req, res) => {
  try {
    const query = {};
    
    // Super admins see all logs, admins see only their own
    if (req.user.role !== 'super_admin') {
      query.userId = req.user._id;
    }

    const logs = await ActivityLog.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;