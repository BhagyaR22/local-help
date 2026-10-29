const Task = require("../models/Task");
const allowedCategories = require("../constants/serviceCategories");
const { parsePagination, paginationInfo, escapeRegex } = require("../utils/pagination");
const recalculateReputation = require("../utils/recalculateReputation");

const createTask = async (req, res) => {
  try {
    const { title, description, category, location, dueDate, budget } = req.body;
    const offeredBudget = Number(budget);

    if (![title, description, category, location].every(
      (value) => typeof value === "string" && value.trim()
    )) {
      return res.status(400).json({
        message: "Title, description, category, and location are required",
      });
    }
    if (budget === undefined || budget === null || String(budget).trim() === "" || !Number.isFinite(offeredBudget) || offeredBudget < 0) {
      return res.status(400).json({ message: "Enter a valid offered budget of LKR 0 or more" });
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
      budget: offeredBudget,
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
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { status: "open" };
    if (req.user?.userId) filter.postedBy = { $ne: req.user.userId };

    if (req.query.category) {
      if (!allowedCategories.includes(req.query.category)) {
        return res.status(400).json({ message: "Choose a valid service category" });
      }
      filter.category = req.query.category;
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    if (search) {
      const match = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ title: match }, { description: match }, { location: match }, { category: match }];
    }

    const [tasks, totalItems] = await Promise.all([
      Task.find(filter)
        .populate("postedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, pagination: paginationInfo(page, limit, totalItems) });
  } catch (error) {
    res.status(500).json({ message: "Failed to get tasks", error: error.message });
  }
};
const updateTask = async (req, res) => {
  try {
    const allowedFields = ["title", "description", "category", "location", "dueDate", "budget"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "budget") {
          const amount = Number(req.body[field]);
          if (req.body[field] === "" || !Number.isFinite(amount) || amount < 0) {
            return res.status(400).json({ message: "Enter a valid offered budget of LKR 0 or more" });
          }
          updates.budget = amount;
          continue;
        }
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
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { $or: [{ postedBy: req.user.userId }, { claimedBy: req.user.userId }] };
    if (req.query.category) {
      if (!allowedCategories.includes(req.query.category)) {
        return res.status(400).json({ message: "Choose a valid service category" });
      }
      filter.category = req.query.category;
    }
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    if (search) {
      const match = new RegExp(escapeRegex(search), "i");
      filter.$and = [{ $or: [{ title: match }, { description: match }, { location: match }, { category: match }] }];
    }

    const [tasks, totalItems] = await Promise.all([
      Task.find(filter)
        .populate("postedBy", "name firstName lastName username contactNumber")
        .populate("claimedBy", "name firstName lastName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    const visibleTasks = tasks.map((task) => {
      const item = task.toObject();
      const claimedById = item.claimedBy?._id || item.claimedBy;
      const isThisUserTheClaimer = String(claimedById) === String(req.user.userId);
      if (!isThisUserTheClaimer && item.postedBy) delete item.postedBy.contactNumber;
      return item;
    });

    res.json({ tasks: visibleTasks, pagination: paginationInfo(page, limit, totalItems) });
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
      .populate("postedBy", "name firstName lastName username contactNumber")
      .populate("claimedBy", "name");

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

const cancelTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.status !== "claimed") {
      return res.status(400).json({ message: "Only claimed tasks can be cancelled or released" });
    }

    const currentUserId = String(req.user.userId);
    let updatedTask;
    let message;
    if (String(task.postedBy) === currentUserId) {
      updatedTask = await Task.findOneAndUpdate(
        { _id: task._id, postedBy: req.user.userId, status: "claimed" },
        { $set: { status: "cancelled" } },
        { new: true }
      );
      message = "Your request was cancelled";
    } else if (String(task.claimedBy) === currentUserId) {
      updatedTask = await Task.findOneAndUpdate(
        { _id: task._id, claimedBy: req.user.userId, status: "claimed" },
        { $set: { status: "open", claimedBy: null } },
        { new: true }
      );
      message = "You released the task; it is open for another helper";
    } else {
      return res.status(403).json({ message: "Only the requester or assigned helper can change this task" });
    }

    if (!updatedTask) return res.status(409).json({ message: "The task changed before your action completed" });
    res.json({ message, task: updatedTask });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ message: "Invalid task ID" });
    res.status(500).json({ message: "Failed to cancel or release task", error: error.message });
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
      .populate("postedBy", "name")
      .populate("claimedBy", "name");

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

const rateTaskHelper = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const review = typeof req.body.review === "string" ? req.body.review.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Choose a rating from 1 to 5 stars" });
    }
    if (review.length > 500) {
      return res.status(400).json({ message: "Review must be 500 characters or fewer" });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        postedBy: req.user.userId,
        status: "completed",
        rating: null,
        claimedBy: { $ne: null },
      },
      { $set: { rating, ratingReview: review } },
      { new: true, runValidators: true }
    );

    if (!task) {
      const existingTask = await Task.findById(req.params.id).select("postedBy status rating");
      if (!existingTask) return res.status(404).json({ message: "Task not found" });
      if (String(existingTask.postedBy) !== String(req.user.userId)) {
        return res.status(403).json({ message: "Only the person who requested this task can rate the helper" });
      }
      if (existingTask.status !== "completed") {
        return res.status(400).json({ message: "You can rate the helper after the task is completed" });
      }
      return res.status(409).json({ message: "You have already rated the helper for this task" });
    }

    const reputationSummary = await recalculateReputation(task.claimedBy);

    res.json({
      message: "Your rating was saved",
      rating: task.rating,
      reputation: reputationSummary.reputation,
      reputationCount: reputationSummary.reputationCount,
    });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ message: "Invalid task ID" });
    res.status(500).json({ message: "Failed to save rating", error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  claimTask,
  cancelTask,
  completeTask,
  rateTaskHelper,
};
