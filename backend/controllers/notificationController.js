// controllers/notificationController.js
const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Fetch all notifications for the current user, newest first.
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification
      .find({ recipient: userId })
      .sort('-createdAt');

    return res.status(200).json(notifications);
  } catch (err) {
    console.error('❌ getNotifications error:', err);
    return res.status(500).json({ message: err.message });
  }
};


/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId       = req.user.userId;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json(notification);
  } catch (err) {
    console.error('❌ markAsRead error:', err);
    return res.status(500).json({ message: err.message });
  }
};


/**
 * PUT /api/notifications/read-all
 * Mark all of the user’s notifications as read.
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.nModified ?? result.modifiedCount
    });
  } catch (err) {
    console.error('❌ markAllAsRead error:', err);
    return res.status(500).json({ message: err.message });
  }
};
