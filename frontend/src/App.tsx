import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import CreateRFQPage from "./pages/CreateRFQPage";
import DetailsPage from "./pages/DetailsPage";
import Navbar from "./components/Navbar";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/home" />;
  }

  return <>{children}</>;
};

function App() {

  return (
    <>
    <Navbar/>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/create-rfq" element={<ProtectedRoute><CreateRFQPage /></ProtectedRoute>} />
          <Route path="/rfq/:id" element={<ProtectedRoute><DetailsPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default App;
