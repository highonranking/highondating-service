const ConnectionRequest = require("../models/connectionRequest");

const isConnected = async (userId1, userId2) => {
    const connection = await ConnectionRequest.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2, status: 'accepted' },
        { fromUserId: userId2, toUserId: userId1, status: 'accepted' },
      ],
    });
    return !!connection;
  };
  
  module.exports = {isConnected}