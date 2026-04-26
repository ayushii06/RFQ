import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFQ",
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    carrierName: {
      type: String,
      required: true,
    },
    freightCharges: {
      type: Number,
      required: true,
    },
    originCharges: {
      type: Number,
      required: true,
    },
    destinationCharges: {
      type: Number,
      required: true,
    },
    totalCharges: {
      type: Number,
      required: true,
    },
    transitTime: {
      type: String, // e.g., "3 days", "48 hours"
      required: true,
    },
    quoteValidity: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
