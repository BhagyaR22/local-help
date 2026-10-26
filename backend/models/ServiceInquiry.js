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
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

ServiceInquirySchema.index({ provider: 1, status: 1, createdAt: -1 });
ServiceInquirySchema.index({ requester: 1, createdAt: -1 });

module.exports = mongoose.model("ServiceInquiry", ServiceInquirySchema);
