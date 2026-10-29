const Task = require("../models/Task");
const ServiceInquiry = require("../models/ServiceInquiry");
const User = require("../models/User");

async function recalculateReputation(userId) {
  const [taskRatings, serviceRatings] = await Promise.all([
    Task.find({ claimedBy: userId, status: "completed", rating: { $gte: 1, $lte: 5 } }).select("rating").lean(),
    ServiceInquiry.find({ provider: userId, status: "completed", rating: { $gte: 1, $lte: 5 } }).select("rating").lean(),
  ]);
  const ratings = [...taskRatings, ...serviceRatings];
  const reputationCount = ratings.length;
  const average = reputationCount ? ratings.reduce((total, item) => total + item.rating, 0) / reputationCount : 0;
  const reputation = Math.round(average * 100) / 100;

  await User.findByIdAndUpdate(userId, { $set: { reputation, reputationCount } });
  return { reputation, reputationCount };
}

module.exports = recalculateReputation;