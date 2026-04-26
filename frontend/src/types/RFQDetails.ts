export type RFQDetails = {
  rfq: {
    _id: string;
    rfqName: string;
    referenceId: string;
    bidStartTime: string;
    bidCloseTime: string;
    forcedBidCloseTime: string;
    pickupDate: string;
    isBritishAuction: boolean;
    triggerWindow: number;
    extensionDuration: number;
    extensionTrigger: string;
    status: string;
    createdAt: string;
    createdBy?: { _id: string; name: string; email: string };
  };
  bids: Array<{
    _id: string;
    carrierName: string;
    freightCharges: number;
    originCharges: number;
    destinationCharges: number;
    totalCharges: number;
    transitTime: string;
    quoteValidity: string;
    supplierId: { _id: string; name: string; email: string };
    createdAt: string;
  }>;
  supplierRankings: Array<{
    supplierId: string;
    supplierName: string;
    bestBidAmount: number;
    rank: string;
  }>;
  activityLog: Array<{
    _id: string;
    type: "bid_submission" | "time_extension" | "rfq_creation" | "rfq_closed" | "rfq_force_closed";
    message: string;
    createdAt: string;
  }>;
}