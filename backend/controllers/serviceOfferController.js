const ServiceOffer = require("../models/ServiceOffer");
const ServiceInquiry = require("../models/ServiceInquiry");
const allowedCategories = require("../constants/serviceCategories");

const getServiceOffers = async (req, res) => {
  try {
    const offers = await ServiceOffer.find()
      .populate("provider", "name reputation reputationCount")
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
    ).populate("provider", "name");

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

const createServiceInquiry = async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 1000) {
      return res.status(400).json({ message: "Enter a message of 1,000 characters or fewer" });
    }

    const offer = await ServiceOffer.findById(req.params.id).select("provider category");
    if (!offer) return res.status(404).json({ message: "Service price not found" });
    if (String(offer.provider) === String(req.user.userId)) {
      return res.status(400).json({ message: "You cannot contact yourself about your own service" });
    }

    const pendingInquiry = await ServiceInquiry.findOne({
      offer: offer._id,
      requester: req.user.userId,
      status: "pending",
    });
    if (pendingInquiry) {
      return res.status(409).json({ message: "You already have a pending inquiry for this service" });
    }

    const inquiry = await ServiceInquiry.create({
      offer: offer._id,
      requester: req.user.userId,
      provider: offer.provider,
      message,
    });

    res.status(201).json({ message: "Your inquiry was sent to the provider", inquiryId: inquiry._id });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ message: "Invalid service price ID" });
    res.status(500).json({ message: "Failed to send inquiry", error: error.message });
  }
};

const getMyServiceInquiries = async (req, res) => {
  try {
    const inquiries = await ServiceInquiry.find({
      $or: [{ requester: req.user.userId }, { provider: req.user.userId }],
    })
      .populate("offer", "category price location")
      .populate("requester", "name username contactNumber")
      .populate("provider", "name contactNumber")
      .sort({ createdAt: -1 })
      .lean();

    const visibleInquiries = inquiries.map((inquiry) => {
      const isProvider = String(inquiry.provider?._id) === String(req.user.userId);
      const contactNumber = inquiry.status === "accepted"
        ? (isProvider ? inquiry.requester?.contactNumber : inquiry.provider?.contactNumber)
        : null;

      if (inquiry.requester) delete inquiry.requester.contactNumber;
      if (inquiry.provider) delete inquiry.provider.contactNumber;

      return { ...inquiry, isProvider, contactNumber };
    });

    res.json({ inquiries: visibleInquiries });
  } catch (error) {
    res.status(500).json({ message: "Failed to get service inquiries", error: error.message });
  }
};

const respondToServiceInquiry = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Choose accept or decline for this inquiry" });
    }

    const inquiry = await ServiceInquiry.findOneAndUpdate(
      { _id: req.params.id, provider: req.user.userId, status: "pending" },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({ message: "Pending inquiry not found or you are not its provider" });
    }

    res.json({ message: `Inquiry ${status}` });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ message: "Invalid inquiry ID" });
    res.status(500).json({ message: "Failed to update inquiry", error: error.message });
  }
};

module.exports = {
  getServiceOffers,
  saveServiceOffer,
  deleteServiceOffer,
  createServiceInquiry,
  getMyServiceInquiries,
  respondToServiceInquiry,
};
