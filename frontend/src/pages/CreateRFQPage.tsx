import { useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

export default function CreateRFQPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    rfqName: "",
    bidStartTime: "",
    bidCloseTime: "",
    forcedBidCloseTime: "",
    pickupDate: "",
    isBritishAuction: true,
    triggerWindow: 10,
    extensionDuration: 5,
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Form Validations
    const errors: Record<string, boolean> = {};
    
    if (!form.rfqName) errors.rfqName = true;
    if (!form.bidStartTime) errors.bidStartTime = true;
    if (!form.pickupDate) errors.pickupDate = true;
    if (!form.bidCloseTime) errors.bidCloseTime = true;
    if (!form.forcedBidCloseTime) errors.forcedBidCloseTime = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill in all required fields.");
      return;
    }

    const start = new Date(form.bidStartTime);
    const close = new Date(form.bidCloseTime);
    const forced = new Date(form.forcedBidCloseTime);
    const pickup = new Date(form.pickupDate);

    if (start >= close) {
      errors.bidStartTime = true;
      errors.bidCloseTime = true;
      setFieldErrors(errors);
      setError("Bid Close Time must be later than Bid Start Time.");
      return;
    }

    if (forced <= close) {
      errors.forcedBidCloseTime = true;
      errors.bidCloseTime = true;
      setFieldErrors(errors);
      setError("Forced Bid Close Time must be later than the Bid Close Time.");
      return;
    }

    if (pickup <= start) {
      errors.pickupDate = true;
      errors.bidStartTime = true;
      setFieldErrors(errors);
      setError("Pickup Service Date must be later than Bid Start Date & Time.");
      return;
    }

    setFieldErrors({});

    try {
      setSubmitting(true);
      const token = await getToken();

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/rfqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          extensionTrigger: "bid_received", // Defaulted
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create RFQ");
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Create New RFQ</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Define shipping metrics and configure live British Auction strategies.</p>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid var(--color-orange)', color: '#d84315', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="form-group">
          <label className="form-label">RFQ Name / Title <span style={{ color: 'red' }}>*</span></label>
          <input 
            type="text" 
            className="form-control" 
            style={{ borderColor: fieldErrors.rfqName ? 'red' : undefined }} 
            required 
            value={form.rfqName} 
            onChange={(e) => setForm({ ...form, rfqName: e.target.value })} 
            placeholder="E.g., North Region Distribution" 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Bid Start Date & Time <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="datetime-local" 
              className="form-control" 
              style={{ borderColor: fieldErrors.bidStartTime ? 'red' : undefined }} 
              min={new Date().toISOString().slice(0, 16)}
              required 
              value={form.bidStartTime} 
              onChange={(e) => setForm({ ...form, bidStartTime: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pickup / Service Date <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="date" 
              className="form-control" 
              style={{ borderColor: fieldErrors.pickupDate ? 'red' : undefined }} 
              min={form.bidStartTime ? form.bidStartTime.slice(0, 10) : new Date().toISOString().slice(0, 10)}
              required 
              value={form.pickupDate} 
              onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Bid Close Date & Time <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="datetime-local" 
              className="form-control" 
              style={{ borderColor: fieldErrors.bidCloseTime ? 'red' : undefined }} 
              min={form.bidStartTime || new Date().toISOString().slice(0, 16)}
              required 
              value={form.bidCloseTime} 
              onChange={(e) => setForm({ ...form, bidCloseTime: e.target.value })} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#d84315', fontWeight: 600 }}>Forced Bid Close Time (Hard Cap) <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="datetime-local" 
              className="form-control" 
              style={{ borderColor: fieldErrors.forcedBidCloseTime ? 'red' : '#d84315', borderWidth: fieldErrors.forcedBidCloseTime ? '2px' : '1px' }} 
              min={form.bidCloseTime || form.bidStartTime || new Date().toISOString().slice(0, 16)}
              required 
              value={form.forcedBidCloseTime} 
              onChange={(e) => setForm({ ...form, forcedBidCloseTime: e.target.value })} 
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--color-cyan)' }} checked={form.isBritishAuction} onChange={(e) => setForm({ ...form, isBritishAuction: e.target.checked })} />
            Enable British Auction Rules
          </label>
        </div>

        {form.isBritishAuction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Trigger Window (X Minutes)</label>
                <input type="number" min="1" className="form-control" required value={form.triggerWindow} onChange={(e) => setForm({ ...form, triggerWindow: Number(e.target.value) })} />
              </div>

              <div className="form-group">
                <label className="form-label">Extension Duration (Y Minutes)</label>
                <input type="number" min="1" className="form-control" required value={form.extensionDuration} onChange={(e) => setForm({ ...form, extensionDuration: Number(e.target.value) })} />
              </div>
            </div>

            {/* Extension Trigger Condition removed as requested (defaults to bid_received) */}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn btn-cyan" style={{ width: '100%', padding: '16px' }}>
          <Send size={18} /> {submitting ? "Publishing..." : "Publish Auction"}
        </button>
      </form>
    </div>
  );
}
