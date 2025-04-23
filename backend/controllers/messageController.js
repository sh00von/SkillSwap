const Message = require('../models/Message');

exports.getPrivateMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const chatId = [user1, user2].sort().join('_');

    const messages = await Message.find({ chatId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not fetch messages' });
  }
};

exports.sendPrivateMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    const chatId = [sender, receiver].sort().join('_');

    const saved = await Message.create({ chatId, sender, receiver, message });
    return res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not send message' });
  }
};
