const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        location: {
            type: String,
            required: true
        },

        budget: {
            type: Number,
            min: [0, "Budget cannot be negative"],
            required: true
        },

        dueDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["open", "claimed", "completed", "cancelled"],
            default: "open"
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        claimedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },

        ratingReview: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

TaskSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Task", TaskSchema);
