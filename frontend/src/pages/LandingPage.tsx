import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Truck, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"supplier" | "buyer">(
    () => (localStorage.getItem("rfq_user_role") as "supplier" | "buyer") || "supplier"
  );

  useEffect(() => {
    if (isSignedIn) {
      // If user is already authenticated, save the selected role to localstorage
      // and redirect to dashboard
      localStorage.setItem("rfq_user_role", role);
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate, role]);

  const handleRoleSelect = (selectedRole: "supplier" | "buyer") => {
    setRole(selectedRole);
    localStorage.setItem("rfq_user_role", selectedRole);
  };

  return (
    <div className="landing-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', background: 'radial-gradient(circle at top right, rgba(0, 188, 212, 0.05), transparent), radial-gradient(circle at bottom left, rgba(255, 152, 0, 0.05), transparent)' }}>
      <div style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px', color: '#111' }}>
          Real-Time <span style={{ color: 'var(--color-cyan)' }}>British Auction</span> Engine
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Create and manage competitive Requests for Quotations with automatic trigger extensions and dynamic supplier feedback.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '32px' }}>
          <div 
            onClick={() => handleRoleSelect("supplier")}
            style={{ 
              padding: '20px', 
              border: `2px solid ${role === "supplier" ? "var(--color-cyan)" : "var(--border-color)"}`, 
              borderRadius: 'var(--radius-md)', 
              background: '#fff', 
              cursor: 'pointer',
              width: '180px',
              transition: 'all 0.2s',
              boxShadow: role === "supplier" ? 'var(--shadow-md)' : 'var(--shadow-sm)'
            }}
          >
            <Truck size={32} color={role === "supplier" ? "var(--color-cyan)" : "#555"} style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Supplier</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Bid on open RFQs</p>
          </div>

          <div 
            onClick={() => handleRoleSelect("buyer")}
            style={{ 
              padding: '20px', 
              border: `2px solid ${role === "buyer" ? "var(--color-orange)" : "var(--border-color)"}`, 
              borderRadius: 'var(--radius-md)', 
              background: '#fff', 
              cursor: 'pointer',
              width: '180px',
              transition: 'all 0.2s',
              boxShadow: role === "buyer" ? 'var(--shadow-md)' : 'var(--shadow-sm)'
            }}
          >
            <ShieldCheck size={32} color={role === "buyer" ? "var(--color-orange)" : "#555"} style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Buyer</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Publish RFQ requirements</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <SignInButton mode="modal">
            <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
              Sign In <ArrowRight size={18} />
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="btn btn-outline" style={{ padding: '14px 28px', fontSize: '16px' }}>
              Create Account
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
