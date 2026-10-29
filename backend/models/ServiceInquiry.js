const mongoose = require("mongoose");

const ServiceInquirySchema = new mongoose.Schema(
  {
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOffer",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed"],
      default: "pending",
    },
    completedAt: { type: Date, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    ratingReview: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

ServiceInquirySchema.index({ provider: 1, status: 1, createdAt: -1 });
ServiceInquirySchema.index({ requester: 1, createdAt: -1 });

module.exports = mongoose.model("ServiceInquiry", ServiceInquirySchema);
