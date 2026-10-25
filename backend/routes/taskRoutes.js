const express = require("express");
const {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  claimTask,
  completeTask,
} = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getTasks);
router.get("/mine", authMiddleware, getMyTasks);
router.post("/", authMiddleware, createTask);
router.patch("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.put("/:id/claim", authMiddleware, claimTask);
router.put("/:id/complete", authMiddleware, completeTask);

module.exports = router;
