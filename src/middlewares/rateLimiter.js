const redisClient = require("../utils/redisClient");

const rateLimiter = (keyPrefix, limit, windowInSeconds) => {
  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}:${req.user.id}`; 
      const now = Math.floor(Date.now() / 1000); 

      const multi = redisClient.multi(); 
      multi.zAdd(key, { score: now, value: `${now}` }); 
      multi.zRemRangeByScore(key, 0, now - windowInSeconds); 
      multi.zCard(key); 
      multi.expire(key, windowInSeconds); 
      const [_, __, count, ___] = await multi.exec();

      if (count > limit) {
        return res.status(429).json({
          error: `Rate limit exceeded. Try again after ${windowInSeconds} seconds.`,
        });
      }

      next(); 
    } catch (error) {
      console.error("Rate limiter error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };
};

module.exports = rateLimiter;
