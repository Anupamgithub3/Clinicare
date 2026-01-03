import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const DoctorVerification = () => {
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const fetchPending = async () => {
        try {
            const res = await api.get('/auth/pending-verifications');
            setPendingDoctors(res.data.pendingDoctors);
        } catch (err) {
            setMessage('Failed to fetch pending verifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleVerifyValue = async (id) => {
        try {
            await api.put(`/auth/verify/${id}`);
            setMessage('Doctor verified successfully!');
            fetchPending(); // Refresh list
        } catch (err) {
            setMessage('Verification failed');
        }
    };

    return (
        <div className="verification-container container fade-in">
            <header className="dashboard-header flex justify-between items-center">
                <div className="brand">
                    <h1>Doctor Verifications</h1>
                    <p className="badge">ADMIN APPROVAL REQUIRED</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="btn btn-outline">Back to Dashboard</button>
            </header>

            <main className="main-content">
                {message && <div className={`alert ${message.includes('failed') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

                {loading ? (
                    <p>Loading pending requests...</p>
                ) : pendingDoctors.length === 0 ? (
                    <div className="card glass text-center">
                        <p>No pending doctor verifications at this time.</p>
                    </div>
                ) : (
                    <div className="table-responsive card glass">
                        <table className="verification-table">
                            <thead>
                                <tr>
                                    <th>Doctor Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Registration Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingDoctors.map(doctor => (
                                    <tr key={doctor._id}>
                                        <td><strong>Dr. {doctor.firstName} {doctor.lastName}</strong></td>
                                        <td>{doctor.email}</td>
                                        <td>{doctor.department?.name || 'N/A'}</td>
                                        <td>{new Date(doctor.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleVerifyValue(doctor._id)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Verify & Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <style jsx>{`
                .verification-container { padding-top: 40px; }
                .dashboard-header { margin-bottom: 48px; }
                .verification-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .verification-table th, .verification-table td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border); }
                .verification-table th { font-weight: 600; color: var(--text-muted); }
                .btn-sm { padding: 8px 16px; font-size: 0.8rem; }
                .alert { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 24px; text-align: center; }
                .alert-success { background: #E9F7EF; color: #1E8449; }
                .alert-error { background: #FDEDEC; color: #A93226; }
                .text-center { text-align: center; padding: 40px; }
            `}</style>
        </div>
    );
};

export default DoctorVerification;
