import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      {/* Background decoration */}
      <div className="healing-bg">
        <div className="plus-sign p1">+</div>
        <div className="plus-sign p2">+</div>
        <div className="plus-sign p3">+</div>
        <div className="plus-sign p4">+</div>
        <div className="plus-sign p5">+</div>
        <div className="plus-sign p6">+</div>
        <div className="plus-sign p7">+</div>
        <div className="plus-sign p8">+</div>
      </div>

      <div className="login-card glass">
        <div className="login-header">
          <h1>Clinicare</h1>
          <p>Your Healing Space</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. patient@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Entering...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg-pastel) 0%, #FFFFFF 100%);
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .healing-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .plus-sign {
          position: absolute;
          font-weight: 300;
          color: #7CFC00;
          opacity: 0.25;
          user-select: none;
        }

        .p1 { font-size: 15rem; top: -5%; left: -5%; transform: rotate(-15deg); }
        .p2 { font-size: 8rem; bottom: 10%; right: 5%; transform: rotate(10deg); }
        .p3 { font-size: 4rem; top: 20%; right: 15%; opacity: 0.2; }
        .p4 { font-size: 6rem; bottom: 30%; left: 10%; transform: rotate(45deg); opacity: 0.15; }
        .p5 { font-size: 3rem; top: 15%; left: 25%; opacity: 0.1; }
        .p6 { font-size: 5rem; top: 40%; right: 5%; transform: rotate(-10deg); opacity: 0.12; }
        .p7 { font-size: 2.5rem; bottom: 15%; right: 30%; transform: rotate(25deg); opacity: 0.15; }
        .p8 { font-size: 4rem; bottom: 5%; left: 20%; transform: rotate(-5deg); opacity: 0.1; }
        
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 30px var(--shadow);
          z-index: 1;
          position: relative;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .login-header h1 {
          font-size: 2.5rem;
          color: var(--secondary);
          margin-bottom: 4px;
        }
        
        .login-header p {
          color: var(--primary-dark);
          font-weight: 500;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font-main);
          transition: border-color 0.2s;
        }
        
        .form-group input:focus {
          border-color: var(--primary);
          outline: none;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .password-toggle:hover {
          opacity: 1;
        }
        
        .error-message {
          background-color: #FFF1F1;
          color: #D63031;
          padding: 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
          font-size: 0.85rem;
          text-align: center;
        }
        
        .w-full {
          width: 100%;
        }
        
        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        
        .login-footer span {
          color: var(--primary-dark);
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Login;
