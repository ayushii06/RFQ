import mongoose from "mongoose";

const rfqSchema = new mongoose.Schema(
  {
    rfqName: {
      type: String,
      required: true,
    },
    bidStartTime: {
      type: Date,
      required: true,
    },
    bidCloseTime: {
      type: Date,
      required: true,
    },
    forcedBidCloseTime: {
      type: Date,
      required: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    isBritishAuction: {
      type: Boolean,
      default: false,
    },
    triggerWindow: {
      type: Number, // in minutes (X)
      default: 10,
    },
    extensionDuration: {
      type: Number, // in minutes (Y)
      default: 5,
    },
    extensionTrigger: {
      type: String,
      enum: ["bid_received", "rank_change", "l1_change"],
      default: "bid_received",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// We can compute the status dynamically via virtuals or a method, or just get it on fetch.
// Let's create a virtual property 'status'
rfqSchema.virtual("status").get(function () {
  const now = new Date();
  if (this.bidCloseTime >= this.forcedBidCloseTime) {
    return "Force Closed";
  }
  if (now >= this.bidCloseTime) {
    return "Closed";
  }
  return "Active";
});

rfqSchema.set("toJSON", { virtuals: true });
rfqSchema.set("toObject", { virtuals: true });

const RFQ = mongoose.model("RFQ", rfqSchema);

export default RFQ;