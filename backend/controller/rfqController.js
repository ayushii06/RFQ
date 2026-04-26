import RFQ from "../models/rfqModel.js";
import Bid from "../models/bidModel.js";
import ActivityLog from "../models/activityLogModel.js";


export const createRFQ = async (req, res) => {
  const {
    rfqName,
    bidStartTime,
    bidCloseTime,
    forcedBidCloseTime,
    pickupDate,
    isBritishAuction,
    triggerWindow,
    extensionDuration,
  } = req.body;

  try {
    const start = new Date(bidStartTime);
    const close = new Date(bidCloseTime);
    const forced = new Date(forcedBidCloseTime);

    // Validation: Forced Bid Close Time must always be greater than Bid Close Time
    if (forced <= close) {
      return res.status(400).json({
        message: "Forced Bid Close Time must be later than Bid Close Time.",
      });
    }


    const rfq = await RFQ.create({
      rfqName,
      // referenceId: finalReferenceId,
      bidStartTime: start,
      bidCloseTime: close,
      forcedBidCloseTime: forced,
      pickupDate: new Date(pickupDate),
      isBritishAuction: !!isBritishAuction,
      triggerWindow: triggerWindow || 10,
      extensionDuration: extensionDuration || 5,
      // extensionTrigger: extensionTrigger || "bid_received",
      createdBy: req.user._id,
    });

    res.status(201).json(rfq);
  } catch (error) {
    console.error("Error in createRFQ:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all RFQs
// @route   GET /api/rfqs
// @access  Private
export const getRFQs = async (req, res) => {
  try {
    const rfqs = await RFQ.find().populate("createdBy", "name email");

    // Enhance RFQs with Current Lowest Bid
    const enhancedRFQs = await Promise.all(
      rfqs.map(async (rfq) => {
        const bids = await Bid.find({ rfqId: rfq._id });
        
        let lowestBid = null;
        if (bids.length > 0) {
          lowestBid = Math.min(...bids.map((b) => b.totalCharges));
        }

        // status is a virtual property, so it's included automatically when converting to JSON
        return {
          _id: rfq._id,
          rfqName: rfq.rfqName,
          // referenceId: rfq.referenceId,
          bidStartTime: rfq.bidStartTime,
          bidCloseTime: rfq.bidCloseTime,
          forcedBidCloseTime: rfq.forcedBidCloseTime,
          status: rfq.status,
          currentLowestBid: lowestBid,
          triggerWindow: rfq.triggerWindow || 10,
        };
      })
    );

    res.json(enhancedRFQs);
  } catch (error) {
    console.error("Error in getRFQs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get RFQ by ID (Details page)
// @route   GET /api/rfqs/:id
// @access  Private
export const getRFQById = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id).populate("createdBy", "name email");

    if (!rfq) {
      return res.status(404).json({ message: "RFQ not found" });
    }

    const bids = await Bid.find({ rfqId: rfq._id })
      .populate("supplierId", "name email")
      .sort({ totalCharges: 1 }); // Sort bids by price

    const logs = await ActivityLog.find({ rfqId: rfq._id }).sort({ createdAt: -1 });

    // Calculate Supplier Rankings
    // Map each supplier to their lowest totalCharges bid
    const supplierBestBids = {};
    bids.forEach((bid) => {
      const sId = bid.supplierId._id.toString();
      if (!supplierBestBids[sId] || bid.totalCharges < supplierBestBids[sId].totalCharges) {
        supplierBestBids[sId] = bid;
      }
    });

    // Sort suppliers by lowest bid price ascending
    const sortedSuppliers = Object.values(supplierBestBids).sort(
      (a, b) => a.totalCharges - b.totalCharges
    );

    // Formulate rankings array (L1, L2, L3...)
    const supplierRankings = sortedSuppliers.map((bid, index) => ({
      supplierId: bid.supplierId._id,
      supplierName: bid.supplierId.name,
      bestBidAmount: bid.totalCharges,
      rank: `L${index + 1}`,
    }));

    res.json({
      rfq,
      bids,
      supplierRankings,
      activityLog: logs,
    });
  } catch (error) {
    console.error("Error in getRFQById:", error);
    res.status(500).json({ message: "Server error" });
  }
};
