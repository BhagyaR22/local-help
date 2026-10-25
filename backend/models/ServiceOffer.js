const mongoose = require("mongoose");
const serviceCategories = require("../constants/serviceCategories");

const ServiceOfferSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: serviceCategories,
      required: true,
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
  },
  { timestamps: true }
);

// A provider can maintain one current price for each service category.
ServiceOfferSchema.index({ provider: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("ServiceOffer", ServiceOfferSchema);
