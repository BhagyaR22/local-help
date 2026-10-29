const express = require("express");
const {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  claimTask,
  cancelTask,
  completeTask,
  rateTaskHelper,
} = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, getTasks);
router.get("/mine", authMiddleware, getMyTasks);
router.post("/", authMiddleware, createTask);
router.patch("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.put("/:id/claim", authMiddleware, claimTask);
router.put("/:id/cancel", authMiddleware, cancelTask);
router.put("/:id/complete", authMiddleware, completeTask);
router.patch("/:id/rating", authMiddleware, rateTaskHelper);

module.exports = router;
