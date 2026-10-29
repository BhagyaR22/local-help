const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Task = require("../models/Task");
const ServiceOffer = require("../models/ServiceOffer");
const ServiceInquiry = require("../models/ServiceInquiry");
const categories = require("../constants/serviceCategories");

const SEED_PREFIX = "lh_test_";
const parseCount = (flag, fallback) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${flag} must be a non-negative whole number.`);
  }
  return value;
};

async function main() {
  const uri = process.env.TEST_MONGO_URI;
  if (!uri) throw new Error("Set TEST_MONGO_URI in backend/.env before seeding.");

  let databaseName;
  try {
    databaseName = decodeURIComponent(new URL(uri).pathname.replace(/^\//, "").split("/")[0]);
  } catch {
    throw new Error("TEST_MONGO_URI is not a valid MongoDB connection string.");
  }
  if (!databaseName || !databaseName.toLowerCase().includes("test")) {
    throw new Error("Safety check: the TEST_MONGO_URI database name must include 'test' (for example, localhelp_test).");
  }

  const userCount = parseCount("--users", 20);
  const taskCount = parseCount("--tasks", 1000);
  const offerCount = parseCount("--offers", 200);
  const inquiryCount = parseCount("--inquiries", 300);
  if (userCount < 2 && (taskCount || offerCount || inquiryCount)) {
    throw new Error("Use at least 2 users when creating tasks, offers, or inquiries.");
  }
  if (offerCount > userCount * categories.length) {
    throw new Error(`At most ${userCount * categories.length} offers are possible with ${userCount} users (${categories.length} categories each).`);
  }
  if (inquiryCount && !offerCount) throw new Error("Create at least one offer to seed inquiries.");

  await mongoose.connect(uri);
  console.log(`Connected to separate database: ${databaseName}`);

  const oldUsers = await User.find({ username: new RegExp(`^${SEED_PREFIX}`) }).select("_id").lean();
  const oldIds = oldUsers.map((user) => user._id);
  if (oldIds.length) {
    await Promise.all([
      Task.deleteMany({ $or: [{ postedBy: { $in: oldIds } }, { claimedBy: { $in: oldIds } }] }),
      ServiceOffer.deleteMany({ provider: { $in: oldIds } }),
      ServiceInquiry.deleteMany({ $or: [{ requester: { $in: oldIds } }, { provider: { $in: oldIds } }] }),
    ]);
    await User.deleteMany({ _id: { $in: oldIds } });
  }

  const password = await bcrypt.hash("LocalHelpTest123!", 10);
  const users = await User.insertMany(Array.from({ length: userCount }, (_, index) => {
    const serial = String(index + 1).padStart(5, "0");
    return {
      firstName: `Test${serial}`,
      lastName: "User",
      username: `${SEED_PREFIX}${serial}`,
      name: `Test${serial} User`,
      contactNumber: `+947000${serial}`,
      email: `${SEED_PREFIX}${serial}@example.test`,
      password,
    };
  }), { ordered: true });

  const offers = await ServiceOffer.insertMany(Array.from({ length: offerCount }, (_, index) => ({
    provider: users[Math.floor(index / categories.length) % users.length]._id,
    category: categories[index % categories.length],
    price: 1000 + ((index * 375) % 25000),
    description: `Sample ${categories[index % categories.length].toLowerCase()} service for LocalHelp testing.`,
    location: ["Colombo", "Kandy", "Galle", "Kurunegala", "KuliyaPitiya"][index % 5],
  })), { ordered: true });

  const tasks = Array.from({ length: taskCount }, (_, index) => {
    const status = ["open", "open", "claimed", "completed"][index % 4];
    const postedBy = users[index % users.length];
    let claimedBy = status === "open" ? null : users[(index + 1) % users.length];
    if (claimedBy?._id.equals(postedBy._id)) claimedBy = users[(index + 2) % users.length];
    const rated = status === "completed" && index % 3 === 0;
    return {
      title: `Sample ${categories[index % categories.length]} task ${index + 1}`,
      description: `Generated task ${index + 1} for testing LocalHelp with a larger dataset.`,
      category: categories[index % categories.length],
      location: ["Colombo", "Kandy", "Galle", "Kurunegala", "KuliyaPitiya"][index % 5],
      budget: 1500 + ((index * 700) % 30000),
      dueDate: new Date(Date.now() + ((index % 30) + 1) * 86400000),
      status,
      postedBy: postedBy._id,
      claimedBy: claimedBy?._id || null,
      rating: rated ? (index % 5) + 1 : null,
      ratingReview: rated ? "Sample review for testing." : "",
    };
  });
  if (tasks.length) await Task.insertMany(tasks, { ordered: true });

  const inquiries = Array.from({ length: inquiryCount }, (_, index) => {
    const offer = offers[index % offers.length];
    let requester = users[(index + 1) % users.length];
    if (requester._id.equals(offer.provider)) requester = users[(index + 2) % users.length];
    return {
      offer: offer._id,
      requester: requester._id,
      provider: offer.provider,
      message: "Generated inquiry for testing LocalHelp.",
      status: ["pending", "accepted", "declined"][index % 3],
    };
  });
  if (inquiries.length) await ServiceInquiry.insertMany(inquiries, { ordered: true });

  console.log(`Seed complete: ${users.length} users, ${offers.length} service listings, ${tasks.length} tasks, ${inquiries.length} inquiries.`);
  console.log("Test login password for all generated users: LocalHelpTest123!");
}

main()
  .catch((error) => {
    console.error("Test data seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });


