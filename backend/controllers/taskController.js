const Task = require("../models/Task");
const allowedCategories = require("../constants/serviceCategories");

const createTask = async (req, res) => {
  try {
    const { title, description, category, location, dueDate } = req.body;

    if (![title, description, category, location].every(
      (value) => typeof value === "string" && value.trim()
    )) {
      return res.status(400).json({
        message: "Title, description, category, and location are required",
      });
    }
    if (!allowedCategories.includes(category.trim())) {
      return res.status(400).json({ message: "Choose a valid service category" });
    }

    if (dueDate && !Number.isFinite(new Date(dueDate).getTime())) {
      return res.status(400).json({ message: "Due date is invalid" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      dueDate: dueDate || null,
      postedBy: req.user.userId,
    });

    await task.populate("postedBy", "name email");

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("postedBy", "name email")
      .populate("claimedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get tasks",
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const allowedFields = ["title", "description", "category", "location", "dueDate"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "dueDate" && (req.body[field] === "" || req.body[field] === null)) {
          updates[field] = null;
          continue;
        }
        if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
          return res.status(400).json({ message: `${field} must be a non-empty string` });
        }
        if (field === "dueDate") {
          const parsedDate = new Date(req.body[field]);
          if (!Number.isFinite(parsedDate.getTime())) {
            return res.status(400).json({ message: "Due date is invalid" });
          }
          updates[field] = parsedDate;
        } else {
          if (field === "category" && !allowedCategories.includes(req.body[field].trim())) {
            return res.status(400).json({ message: "Choose a valid service category" });
          }
          updates[field] = req.body[field].trim();
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide at least one task field to update" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user.userId, status: "open" },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("postedBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Open task not found or you are not its owner" });
    }

    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      postedBy: req.user.userId,
      status: "open",
    });

    if (!task) {
      return res.status(404).json({ message: "Open task not found or you are not its owner" });
    }

    res.json({ message: "Task deleted successfully", taskId: task._id });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { postedBy: req.user.userId },
        { claimedBy: req.user.userId },
      ],
    })
      .populate("postedBy", "name email firstName lastName username contactNumber")
      .populate("claimedBy", "name email firstName lastName username")
      .sort({ createdAt: -1 });

    const visibleTasks = tasks.map((task) => {
      const item = task.toObject();
      const claimedById = item.claimedBy?._id || item.claimedBy;
      const isThisUserTheClaimer = String(claimedById) === String(req.user.userId);
      if (!isThisUserTheClaimer && item.postedBy) delete item.postedBy.contactNumber;
      return item;
    });

    res.json({ tasks: visibleTasks });
  } catch (error) {
    res.status(500).json({ message: "Failed to get your tasks", error: error.message });
  }
};
const claimTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "open",
        postedBy: { $ne: req.user.userId },
      },
      {
        $set: {
          claimedBy: req.user.userId,
          status: "claimed",
        },
      },
      { new: true, runValidators: true }
    )
      .populate("postedBy", "name email firstName lastName username contactNumber")
      .populate("claimedBy", "name email");

    if (!task) {
      return res.status(400).json({
        message: "Task is unavailable or you cannot claim your own task",
      });
    }

    res.json({
      message: "Task claimed successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to claim task",
      error: error.message,
    });
  }
};

const completeTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "claimed",
        claimedBy: req.user.userId,
      },
      { $set: { status: "completed" } },
      { new: true, runValidators: true }
    )
      .populate("postedBy", "name email")
      .populate("claimedBy", "name email");

    if (!task) {
      return res.status(400).json({
        message: "Task is not claimed by you or is already completed",
      });
    }

    res.json({
      message: "Task marked complete",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete task",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  claimTask,
  completeTask,
};

