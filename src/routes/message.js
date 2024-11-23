const express = require('express');
const router = express.Router();
const Message = require('../models/messages');
const { userAuth } = require("../middlewares/auth");
const {isConnected} = require("../middlewares/connections")
const redisClient = require('../utils/redisClient'); 

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

       // const cacheKey = `chat:${senderId}:${receiverId}`;
        const cacheKey1 = `chat:${senderId}:${receiverId}`;
        const cacheKey2 = `chat:${receiverId}:${senderId}`;
        await redisClient.del(cacheKey1);
        await redisClient.del(cacheKey2);


        const messagesCache = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        }).sort({ timestamp: 1 });

        await redisClient.set(cacheKey1, JSON.stringify(messagesCache), { EX: 60 * 5 }); 
        await redisClient.set(cacheKey2, JSON.stringify(messagesCache), { EX: 60 * 5 }); 
        if (global.io) {
            const targetRoom = receiverId || groupId;
            global.io.to(targetRoom).emit('new_message', {
                ...message.toObject(),
                senderId,
                receiverId,
            });
        }

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.get('/', userAuth, async (req, res) => {
    try {
        const { userId1, userId2, groupId } = req.query;


        if (!groupId && (!userId1 || !userId2)) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Check user connection
        if (!groupId && !(await isConnected(userId1, userId2))) {
            return res.status(403).json({ message: 'You can only fetch messages with connected users.' });
                        }
                        const cacheKey1 = `chat:${userId1}:${userId2}`;
                        const cacheKey2 = `chat:${userId2}:${userId1}`;
                        
                        let cachedMessages = await redisClient.get(cacheKey1);
                        if (!cachedMessages) {
                          cachedMessages = await redisClient.get(cacheKey2);
                        }
                        
                        if (cachedMessages) {
                          return res.status(200).json({ success: true, messages: JSON.parse(cachedMessages) });
                        }
                        
        if (cachedMessages) {
            return res.status(200).json({ success: true, messages: JSON.parse(cachedMessages) });
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

        await redisClient.set(cacheKey1, JSON.stringify(messagesCache), { EX: 60 * 5 }); 
        await redisClient.set(cacheKey2, JSON.stringify(messagesCache), { EX: 60 * 5 }); 
        
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});


router.patch('/read',userAuth, async (req, res) => {
    try {
      const { messageIds } = req.body; 
  
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
