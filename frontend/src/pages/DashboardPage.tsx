import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Clock, Award, CheckCircle2, Lock } from "lucide-react";
import type { RFQItem } from "../types/RFQItem";
import { getTimeLeft } from "../lib/getTimeLeft";


export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("supplier");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  

  const isFlickering = (closeTime: string, triggerMin: number) => {
    const diffMs = new Date(closeTime).getTime() - currentTime.getTime();
    return diffMs > 0 && diffMs <= (triggerMin || 10) * 60 * 1000;
  };

  useEffect(() => {
    const cachedRole = localStorage.getItem("rfq_user_role") || "supplier";
    setRole(cachedRole);

    const syncAndFetch = async () => {
      try {
        const token = await getToken();
        if (!token || !user) return;

        // 1. Sync Clerk User Profile to MongoDB
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        await fetch(`${apiUrl}/users/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clerkUserId: user.id,
            name: user.fullName || user.username || user.emailAddresses[0].emailAddress,
            email: user.emailAddresses[0].emailAddress,
            role: cachedRole,
          }),
        });

        // 2. Fetch RFQs
        const res = await fetch(`${apiUrl}/rfqs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setRfqs(data);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    syncAndFetch();
    const interval = setInterval(syncAndFetch, 5000); // Poll every 5s for live auction updates
    return () => clearInterval(interval);
  }, [getToken, user]);

  const getStatusBadge = (status: RFQItem["status"]) => {
    switch (status) {
      case "Active":
        return <span className="badge badge-active"><Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Active</span>;
      case "Closed":
        return <span className="badge badge-closed"><CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Closed</span>;
      case "Force Closed":
        return <span className="badge badge-force-closed"><Lock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Force Closed</span>;
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading auctions...</div>;
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111' }}>Live British Auctions</h1>
          <p style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Logged in as {role}</p>
        </div>

        {role === "buyer" && (
          <Link to="/create-rfq" className="btn btn-cyan">
            <PlusCircle size={20} /> Create New RFQ
          </Link>
        )}
      </div>

      {rfqs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          No auctions available yet.
        </div>
      ) : (
        <div className="grid">
          {rfqs.map((rfq) => (
            <div key={rfq._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111' }}>{rfq.rfqName}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {getStatusBadge(rfq.status)}
                    {rfq.status === "Active" && (
                      <span className={isFlickering(rfq.bidCloseTime, rfq.triggerWindow) ? "flicker" : ""} style={{ fontSize: '12px', fontWeight: 600, color: 'red' }}>
                        {getTimeLeft({closeTime:rfq.bidCloseTime,currentTime})}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Lowest Bid</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={24} /> {rfq.currentLowestBid ? `$${rfq.currentLowestBid}` : "No bids yet"}
                  </p>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                  <p>Bid Closes: <strong>{new Date(rfq.bidCloseTime).toLocaleString()}</strong></p>
                  <p>Hard Deadline: <strong style={{ color: 'red' }}>{new Date(rfq.forcedBidCloseTime).toLocaleString()}</strong></p>
                </div>

                <Link to={`/rfq/${rfq._id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
