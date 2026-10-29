const express = require("express");
const {
  getServiceOffers,
  saveServiceOffer,
  deleteServiceOffer,
  createServiceInquiry,
  getMyServiceInquiries,
  completeServiceInquiry,
  rateServiceProvider,
  respondToServiceInquiry,
} = require("../controllers/serviceOfferController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getServiceOffers);
router.get("/inquiries", authMiddleware, getMyServiceInquiries);
router.patch("/inquiries/:id", authMiddleware, respondToServiceInquiry);
router.patch("/inquiries/:id/complete", authMiddleware, completeServiceInquiry);
router.patch("/inquiries/:id/rating", authMiddleware, rateServiceProvider);
router.post("/", authMiddleware, saveServiceOffer);
router.post("/:id/inquiries", authMiddleware, createServiceInquiry);
router.delete("/:id", authMiddleware, deleteServiceOffer);

module.exports = router;
