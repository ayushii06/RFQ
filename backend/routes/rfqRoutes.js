import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { createRFQ, getRFQs, getRFQById } from "../controller/rfqController.js";
import { submitBid } from "../controller/bidController.js";

const router = express.Router();

router
  .route("/")
  .post(protect, authorize("buyer", "admin"), createRFQ)
  .get(protect, getRFQs);

router.route("/:id").get(protect, getRFQById);

router.route("/:id/bids").post(protect, authorize("supplier"), submitBid);

export default router;
