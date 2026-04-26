import { useAuth, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom'

function Navbar() {
    const { isSignedIn } = useAuth();
  return (
    <header className="header">
        <div className="container header-content">
          <Link to={isSignedIn ? "/dashboard" : "/"} className="logo">
            <span>RFQ</span>Auction
          </Link>

          <nav className="nav-links">
            {isSignedIn && (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
          </nav>
        </div>
      </header>
  )
}

export default Navbar