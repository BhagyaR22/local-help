const express = require("express");
const {
  getServiceOffers,
  saveServiceOffer,
  deleteServiceOffer,
} = require("../controllers/serviceOfferController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getServiceOffers);
router.post("/", authMiddleware, saveServiceOffer);
router.delete("/:id", authMiddleware, deleteServiceOffer);

module.exports = router;
