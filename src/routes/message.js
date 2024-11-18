const express = require('express');
const router = express.Router();
const Message = require('../models/messages');
const { userAuth } = require("../middlewares/auth");
const {isConnected} = require("../middlewares/connections")


// Send a message
router.post('/', userAuth, async (req, res) => {
    try {
      const { senderId, receiverId, groupId, messageContent } = req.body;
  
      if (!senderId || (!receiverId && !groupId) || !messageContent) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      if (receiverId && !(await isConnected(senderId, receiverId))) {
        return res
          .status(403)
          .json({ message: 'You can only message connected users.' });
      }

      const message = new Message({
        senderId,
        receiverId,
        groupId,
        messageContent,
      });
  
      await message.save();
  
      // Emit message via WebSocket (real-time)
      if (global.io) {
        global.io.to(receiverId || groupId).emit('new_message', message);
      }
  
      res.status(201).json({ success: true, message });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  });

// Fetch messages
router.get('/', userAuth, async (req, res) => {
    try {
      const { userId1, userId2, groupId } = req.query;
  
      if (!groupId && (!userId1 || !userId2)) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      if (!groupId && !(await isConnected(userId1, userId2))) {
        return res
          .status(403)
          .json({ message: 'You can only fetch messages with connected users.' });
      }
  
      const query = groupId
        ? { groupId }
        : {
            $or: [
              { senderId: userId1, receiverId: userId2 },
              { senderId: userId2, receiverId: userId1 },
            ],
          };
  
      const messages = await Message.find(query).sort({ timestamp: 1 });
  
      res.status(200).json({ success: true, messages });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  });

// Mark messages as read
router.patch('/read',userAuth, async (req, res) => {
    try {
      const { messageIds } = req.body; // Array of message IDs
  
      if (!messageIds || !messageIds.length) {
        return res.status(400).json({ message: 'No message IDs provided' });
      }
  
      await Message.updateMany({ _id: { $in: messageIds } }, { isRead: true });
  
      res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  });

module.exports = router;
