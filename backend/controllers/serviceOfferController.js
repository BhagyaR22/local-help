const ServiceOffer = require("../models/ServiceOffer");
const allowedCategories = require("../constants/serviceCategories");

const getServiceOffers = async (req, res) => {
  try {
    const offers = await ServiceOffer.find()
      .populate("provider", "name email")
      .sort({ updatedAt: -1 });

    res.json({ offers });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get service prices",
      error: error.message,
    });
  }
};

const saveServiceOffer = async (req, res) => {
  try {
    const { category, price, description = "", location = "" } = req.body;
    const numericPrice = Number(price);

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Choose a valid service category" });
    }

    if (price === "" || price === null || price === undefined || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: "Enter a valid price in LKR" });
    }

    if (typeof description !== "string" || description.length > 500) {
      return res.status(400).json({ message: "Description must be 500 characters or fewer" });
    }

    if (typeof location !== "string" || location.length > 120) {
      return res.status(400).json({ message: "Location must be 120 characters or fewer" });
    }

    const offer = await ServiceOffer.findOneAndUpdate(
      { provider: req.user.userId, category },
      {
        $set: {
          price: numericPrice,
          description: description.trim(),
          location: location.trim(),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("provider", "name email");

    res.status(200).json({ message: "Service price saved", offer });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save service price",
      error: error.message,
    });
  }
};

const deleteServiceOffer = async (req, res) => {
  try {
    const offer = await ServiceOffer.findOneAndDelete({
      _id: req.params.id,
      provider: req.user.userId,
    });

    if (!offer) {
      return res.status(404).json({ message: "Service price not found or you are not its owner" });
    }

    res.json({ message: "Service price removed", offerId: offer._id });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid service price ID" });
    }
    res.status(500).json({
      message: "Failed to remove service price",
      error: error.message,
    });
  }
};

module.exports = { getServiceOffers, saveServiceOffer, deleteServiceOffer };
