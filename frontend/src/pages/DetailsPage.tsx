import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, History, Trophy, FileText, Landmark } from "lucide-react";
import type { RFQDetails } from "../types/RFQDetails";



export default function DetailsPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  
  const [data, setData] = useState<RFQDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("supplier");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeLeft = (closeTime: string) => {
    const diffMs = new Date(closeTime).getTime() - currentTime.getTime();
    if (diffMs <= 0) return "Ended";
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s left`;
    if (minutes > 0) return `${minutes}m ${seconds}s left`;
    return `${seconds}s left`;
  };

  const isFlickering = (closeTime: string, triggerMin: number) => {
    const diffMs = new Date(closeTime).getTime() - currentTime.getTime();
    return diffMs > 0 && diffMs <= (triggerMin || 10) * 60 * 1000;
  };

  // Form State for bidding
  const [quoteForm, setQuoteForm] = useState({
    carrierName: "",
    freightCharges: "",
    originCharges: "",
    destinationCharges: "",
    transitTime: "",
    quoteValidity: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/rfqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem("rfq_user_role") || "supplier");
    fetchDetails();
    const interval = setInterval(fetchDetails, 4000); // Poll details rapidly
    return () => clearInterval(interval);
  }, [id, getToken]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !quoteForm.carrierName ||
      !quoteForm.freightCharges ||
      !quoteForm.originCharges ||
      !quoteForm.destinationCharges
    ) {
      setError("Please complete all numeric charge fields.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/rfqs/${id}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quoteForm),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Submission failed");
      }

      setQuoteForm({
        carrierName: "",
        freightCharges: "",
        originCharges: "",
        destinationCharges: "",
        transitTime: "",
        quoteValidity: "",
      });
      fetchDetails();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Auction Details...</div>;
  }

  const { rfq, bids, supplierRankings, activityLog } = data;

  const combinedLogs = [
    {
      _id: "rfq-creation",
      type: "rfq_creation" as const,
      message: `RFQ was created by ${rfq.createdBy?.name || "Buyer"}`,
      createdAt: rfq.createdAt,
    },
    ...activityLog
  ];

  if (rfq.status === "Closed") {
    combinedLogs.push({
      _id: "rfq-closed",
      type: "rfq_closed" as const,
      message: "Auction closed automatically at the scheduled close time.",
      createdAt: rfq.bidCloseTime,
    });
  } else if (rfq.status === "Force Closed") {
    combinedLogs.push({
      _id: "rfq-force-closed",
      type: "rfq_force_closed" as const,
      message: "Auction closed forcefully because the hard deadline was reached.",
      createdAt: rfq.forcedBidCloseTime,
    });
  }

  combinedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>{rfq.rfqName}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Pickup Date: {new Date(rfq.pickupDate).toLocaleDateString()} | 
            Hard Deadline: <strong style={{ color: 'red' }}>{new Date(rfq.forcedBidCloseTime).toLocaleString()}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {rfq.status === "Active" && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Time Left</p>
              <p className={isFlickering(rfq.bidCloseTime, rfq.triggerWindow) ? "flicker" : ""} style={{ fontSize: '18px', fontWeight: 700, color: 'red' }}>{getTimeLeft(rfq.bidCloseTime)}</p>
            </div>
          )}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Auction Status</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-cyan)' }}>{rfq.status}</p>
          </div>
        </div>
      </div>

      {/* Grid Layout for details */}
      <div style={{ display: 'grid', gridTemplateColumns: role === "supplier" && rfq.status === "Active" ? "2fr 1fr" : "1fr", gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Config, Rankings, Bids */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Auction Configs */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Clock size={18} color="var(--color-cyan)" /> British Auction Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Trigger Window (X)</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{rfq.triggerWindow} Minutes</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Extension Time (Y)</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{rfq.extensionDuration} Minutes</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Extension Trigger</p>
                <p style={{ fontSize: '16px', fontWeight: 600, textTransform: 'capitalize' }}>{rfq.extensionTrigger.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Supplier Rankings */}
          <div className="card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Trophy size={20} color="var(--color-orange)" /> Supplier Standings</h3>
            {supplierRankings.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No supplier quotes evaluated.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {supplierRankings.map((rank) => (
                  <div key={rank.supplierId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: rank.rank === "L1" ? 'rgba(0, 188, 212, 0.05)' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: rank.rank === "L1" ? 'var(--color-cyan)' : 'var(--text-primary)', width: '30px' }}>{rank.rank}</span>
                      <span style={{ fontWeight: 600 }}>{rank.supplierName}</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>${rank.bestBidAmount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Bids / Quote submissions */}
          <div className="card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><FileText size={20} /> Quote Submission Log</h3>
            {bids.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No proposals received.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Supplier</th>
                      <th style={{ padding: '12px' }}>Buyer</th>
                      <th style={{ padding: '12px' }}>Carrier</th>
                      <th style={{ padding: '12px' }}>Freight</th>
                      <th style={{ padding: '12px' }}>Origin</th>
                      <th style={{ padding: '12px' }}>Dest.</th>
                      <th style={{ padding: '12px' }}>Transit</th>
                      <th style={{ padding: '12px', fontWeight: 'bold' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => (
                      <tr key={bid._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                        <td style={{ padding: '12px' }}>{bid.supplierId?.name || "N/A"}</td>
                        <td style={{ padding: '12px' }}>{rfq.createdBy?.name || "N/A"}</td>
                        <td style={{ padding: '12px' }}>{bid.carrierName}</td>
                        <td style={{ padding: '12px' }}>${bid.freightCharges}</td>
                        <td style={{ padding: '12px' }}>${bid.originCharges}</td>
                        <td style={{ padding: '12px' }}>${bid.destinationCharges}</td>
                        <td style={{ padding: '12px' }}>{bid.transitTime}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'var(--color-cyan)' }}>${bid.totalCharges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><History size={20} /> Action Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {combinedLogs.map((log) => (
                <div key={log._id} style={{ fontSize: '13px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: log.type === "time_extension" ? 'rgba(255, 152, 0, 0.08)' : log.type === "rfq_creation" ? 'rgba(76, 175, 80, 0.08)' : log.type === "rfq_closed" ? 'rgba(33, 150, 243, 0.08)' : log.type === "rfq_force_closed" ? 'rgba(244, 67, 54, 0.08)' : '#f8fafc', borderLeft: `3px solid ${log.type === "time_extension" ? "var(--color-orange)" : log.type === "rfq_creation" ? "#4caf50" : log.type === "rfq_closed" ? "#2196f3" : log.type === "rfq_force_closed" ? "#f44336" : "var(--color-cyan)"}` }}>
                  <p style={{ color: '#222', marginBottom: '4px' }}>{log.message}</p>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Bid Submission Form (Only for Suppliers & Active Auctions) */}
        {role === "supplier" && rfq.status === "Active" && (
          <div className="card" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><Landmark size={22} color="var(--color-cyan)" /> Submit Quote</h3>
            
            {error && (
              <div style={{ fontSize: '13px', background: 'rgba(255, 152, 0, 0.1)', color: '#d84315', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Carrier Name</label>
                <input type="text" className="form-control" required value={quoteForm.carrierName} onChange={(e) => setQuoteForm({ ...quoteForm, carrierName: e.target.value })} placeholder="E.g., DHL / FedEx" />
              </div>

              <div className="form-group">
                <label className="form-label">Freight Charges ($)</label>
                <input type="number" min="0" className="form-control" required value={quoteForm.freightCharges} onChange={(e) => setQuoteForm({ ...quoteForm, freightCharges: e.target.value })} placeholder="0.00" />
              </div>

              <div className="form-group">
                <label className="form-label">Origin Charges ($)</label>
                <input type="number" min="0" className="form-control" required value={quoteForm.originCharges} onChange={(e) => setQuoteForm({ ...quoteForm, originCharges: e.target.value })} placeholder="0.00" />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Charges ($)</label>
                <input type="number" min="0" className="form-control" required value={quoteForm.destinationCharges} onChange={(e) => setQuoteForm({ ...quoteForm, destinationCharges: e.target.value })} placeholder="0.00" />
              </div>

              <div className="form-group">
                <label className="form-label">Transit Time</label>
                <input type="text" className="form-control" required value={quoteForm.transitTime} onChange={(e) => setQuoteForm({ ...quoteForm, transitTime: e.target.value })} placeholder="E.g., 3-5 Business Days" />
              </div>

              <div className="form-group">
                <label className="form-label">Quote Validity</label>
                <input type="date" className="form-control" required value={quoteForm.quoteValidity} onChange={(e) => setQuoteForm({ ...quoteForm, quoteValidity: e.target.value })} />
              </div>

              <button type="submit" disabled={submitting} className="btn btn-cyan" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>
                {submitting ? "Submitting..." : "Submit Quote Proposal"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
