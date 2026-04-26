import Bid from "../models/bidModel.js";
import RFQ from "../models/rfqModel.js";
import ActivityLog from "../models/activityLogModel.js";

// Helper function to calculate ranked supplier ID list
const getRankingList = (bids) => {
  const bestBids = {};
  bids.forEach((bid) => {
    const sId = bid.supplierId._id
      ? bid.supplierId._id.toString()
      : bid.supplierId.toString();
    if (!bestBids[sId] || bid.totalCharges < bestBids[sId].totalCharges) {
      bestBids[sId] = bid;
    }
  });

  return Object.values(bestBids)
    .sort((a, b) => a.totalCharges - b.totalCharges)
    .map((b) =>
      b.supplierId._id ? b.supplierId._id.toString() : b.supplierId.toString()
    );
};

// @desc    Submit a new bid / quote
// @route   POST /api/rfqs/:id/bids
// @access  Private/Supplier
export const submitBid = async (req, res) => {
  const rfqId = req.params.id;
  const supplierId = req.user._id;

  const {
    carrierName,
    freightCharges,
    originCharges,
    destinationCharges,
    transitTime,
    quoteValidity,
  } = req.body;

  try {
    const rfq = await RFQ.findById(rfqId);

    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    const now = new Date();

    // Check if the auction is active
    if (now < rfq.bidStartTime) {
      return res.status(400).json({ message: "Bidding has not started yet." });
    }

    if (now >= rfq.bidCloseTime) {
      return res.status(400).json({ message: "Bidding has closed." });
    }

    const totalCharges =
      Number(freightCharges) +
      Number(originCharges) +
      Number(destinationCharges);

    const newBid = new Bid({
      rfqId,
      supplierId,
      carrierName,
      freightCharges: Number(freightCharges),
      originCharges: Number(originCharges),
      destinationCharges: Number(destinationCharges),
      totalCharges,
      transitTime,
      quoteValidity: new Date(quoteValidity),
    });

    // Handle British Auction Rules
    if (rfq.isBritishAuction) {
      const triggerWindowMinutes = rfq.triggerWindow || 10;
      const triggerWindowStart = new Date(
        rfq.bidCloseTime.getTime() - triggerWindowMinutes * 60000
      );
      const triggerWindowEnd = rfq.bidCloseTime;

      const isInTriggerWindow = now >= triggerWindowStart && now <= triggerWindowEnd;

      if (isInTriggerWindow) {
        let shouldExtend = false;
        let reason = "";

        const existingBids = await Bid.find({ rfqId });

        const oldRankings = getRankingList(existingBids);
        const simulatedBids = [...existingBids, newBid];
        const newRankings = getRankingList(simulatedBids);

        // Evaluate all 3 triggering conditions
        if (oldRankings.length > 0 && oldRankings[0] !== newRankings[0]) {
          shouldExtend = true;
          reason = "Lowest bidder (L1) rank changed";
        } else if (oldRankings.length !== newRankings.length) {
          shouldExtend = true;
          reason = "New supplier entered changing rankings";
        } else {
          let rankChanged = false;
          for (let i = 0; i < oldRankings.length; i++) {
            if (oldRankings[i] !== newRankings[i]) {
              rankChanged = true;
              break;
            }
          }
          if (rankChanged) {
            shouldExtend = true;
            reason = "Supplier rankings changed";
          } else {
            shouldExtend = true;
            reason = "New bid received";
          }
        }

        if (shouldExtend) {
          const extensionMs = (rfq.extensionDuration || 5) * 60000;
          let newCloseTime = new Date(rfq.bidCloseTime.getTime() + extensionMs);

          // Auction extensions must never exceed the Forced Bid Close Time
          if (newCloseTime > rfq.forcedBidCloseTime) {
            newCloseTime = rfq.forcedBidCloseTime;
          }

          // Check if time is actually extended (in case it already hit forced)
          if (newCloseTime.getTime() > rfq.bidCloseTime.getTime()) {
            rfq.bidCloseTime = newCloseTime;
            await rfq.save();

            // Log Time Extension
            await ActivityLog.create({
              rfqId,
              type: "time_extension",
              message: `Bid Close Time extended to ${newCloseTime.toLocaleTimeString()} due to: ${reason}`,
              details: {
                reason,
                newCloseTime,
                extensionDuration: rfq.extensionDuration,
              },
            });
          }
        }
      }
    }

    // Save Bid
    await newBid.save();

    // Log Bid Submission
    await ActivityLog.create({
      rfqId,
      type: "bid_submission",
      message: `${req.user.name} submitted a new quote for $${totalCharges}`,
      details: {
        bidId: newBid._id,
        supplierName: req.user.name,
        totalCharges,
      },
    });

    res.status(201).json(newBid);
  } catch (error) {
    console.error("Error in submitBid:", error);
    res.status(500).json({ message: "Server error" });
  }
};
