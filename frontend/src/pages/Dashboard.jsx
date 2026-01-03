import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const renderPatientDashboard = () => (
        <div className="role-dashboard">
            <h2>Welcome Back, {user.name || 'Patient'}</h2>
            <div className="grid">
                <div className="card glass">
                    <h3>AI Consultation</h3>
                    <p>Begin a symptom intake with our AI assistant.</p>
                    <button onClick={() => navigate('/chat')} className="btn btn-primary">Start Chat</button>
                </div>
                <div className="card glass">
                    <h3>Pharmacy</h3>
                    <p>Browse medicines and order supplies online.</p>
                    <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">Go to Pharmacy</button>
                </div>

            </div>
        </div>
    );

    const renderDoctorDashboard = () => (
        <div className="role-dashboard">
            <h2>Medical Dashboard - Dr. {user.lastName || user.name}</h2>
            <div className="grid">
                <div className="card glass">
                    <h3>Patient Inbox</h3>
                    <p>Review new AI summaries and medical intake files.</p>
                    <button onClick={() => navigate('/doctor-inbox')} className="btn btn-primary">View Inbox</button>
                </div>
                <div className="card glass">
                    <h3>Pharmacy Inventory</h3>
                    <p>Check medicine availability and prices.</p>
                    <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">Check Supplies</button>
                </div>
            </div>
        </div>
    );

    const renderAdminDashboard = () => (
        <div className="role-dashboard">
            <h2>Admin Control Center</h2>
            <div className="grid">
                <div className="card glass border-highlight">
                    <h3>Pharmacy Management</h3>
                    <p>Manage medicine stock, pricing, and categories.</p>
                    <button onClick={() => navigate('/pharmacy')} className="btn btn-primary">Manage Pharmacy</button>
                </div>
                <div className="card glass border-highlight">
                    <h3>Doctor Verification</h3>
                    <p>Review and approve new doctor account requests.</p>
                    <button onClick={() => navigate('/verify-doctors')} className="btn btn-primary">Verify Doctors</button>
                </div>
                <div className="card glass border-highlight">
                    <h3>Department Management</h3>
                    <p>Organize units, manage staff, and view history.</p>
                    <button onClick={() => navigate('/manage-departments')} className="btn btn-primary">Manage Departments</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container container fade-in">
            <header className="dashboard-header flex justify-between items-center">
                <div className="brand">
                    <h1>Clinicare</h1>
                    <p className="badge">{user.role.toUpperCase()}</p>
                </div>
                <button onClick={logout} className="btn btn-outline">Logout</button>
            </header>

            <main className="main-content">
                {user.role === 'patient' && renderPatientDashboard()}
                {user.role === 'doctor' && renderDoctorDashboard()}
                {user.role === 'admin' && renderAdminDashboard()}
            </main>

            <style jsx>{`
        .dashboard-container { padding-top: 40px; }
        .dashboard-header { margin-bottom: 48px; display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { font-size: 2rem; margin: 0; }
        .badge { display: inline-block; padding: 2px 8px; background: var(--primary-light); border-radius: 4px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 24px; }
        .card { padding: 32px; border-radius: var(--radius-lg); text-align: left; }
        .card h3 { margin-bottom: 12px; color: var(--secondary); }
        .card p { margin-bottom: 24px; color: var(--text-muted); }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .border-highlight { border: 2px solid var(--primary); }
      `}</style>
        </div>
    );
};

export default Dashboard;
