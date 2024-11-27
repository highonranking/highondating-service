const mongoose = require("mongoose");

const matchingScoreSchema = new mongoose.Schema({
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchingScore: {
      type: Number,
      required: true,
    },
  });
  
  module.exports = mongoose.model("UserMatchingScore", matchingScoreSchema);
  