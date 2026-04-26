export type RFQItem =  {
  _id: string;
  rfqName: string;
  referenceId: string;
  bidStartTime: string;
  bidCloseTime: string;
  forcedBidCloseTime: string;
  status: "Active" | "Closed" | "Force Closed";
  currentLowestBid: number | null;
  triggerWindow: number;
}