import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, User, LogOut, Layout } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); // Simple way to reset state across the app
  };

  return (
    <nav className="glass" style={{ 
      position: 'fixed', 
      top: '1.5rem', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      width: '90%', 
      maxWidth: '1200px', 
      zIndex: 1000,
      padding: '0.75rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <motion.div
          animate={{ rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <BookOpen size={32} color="var(--primary)" />
        </motion.div>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Orbin AI</h2>
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            <Link to="/dashboard" className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
              <Layout size={18} /> Dashboard
            </Link>
            <button className="btn btn-outline" style={{ fontSize: '0.9rem' }} onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
