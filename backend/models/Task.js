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

        dueDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["open", "claimed", "completed"],
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

module.exports = mongoose.model("Task", TaskSchema);
