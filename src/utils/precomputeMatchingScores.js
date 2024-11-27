const User = require("../models/user");
const SkillIndex = require("../models/skillIndex");
const UserMatchingScore = require("../models/userMatchingScore");

async function computeMatchingScores() {
  const users = await User.find().select("_id skills");

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const user1 = users[i];
      const user2 = users[j];

      const matchingSkills = user1.skills.filter((skill) =>
        user2.skills.includes(skill)
      ).length;

      if (matchingSkills > 0) {
        await UserMatchingScore.findOneAndUpdate(
          { user1: user1._id, user2: user2._id },
          { matchingScore: matchingSkills },
          { upsert: true }
        );
        await UserMatchingScore.findOneAndUpdate(
          { user1: user2._id, user2: user1._id },
          { matchingScore: matchingSkills },
          { upsert: true }
        );
      }
    }
  }
}

module.exports = computeMatchingScores;
