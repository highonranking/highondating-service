const cron = require("node-cron");
const computeMatchingScores = require("./jobs/precomputeMatchingScores");

cron.schedule("0 0 * * *", async () => {
  console.log("Running precomputeMatchingScores...");
  await computeMatchingScores();
  console.log("Matching scores updated.");
});
