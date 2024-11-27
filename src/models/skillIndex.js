const mongoose = require("mongoose");

const skillIndexSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true,
    unique: true,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("SkillIndex", skillIndexSchema);
