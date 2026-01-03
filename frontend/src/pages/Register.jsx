import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useDepartments } from '../context/DepartmentsContext';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'patient',
        department: ''
    });
    const { departments } = useDepartments();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.role === 'doctor' && !formData.department) {
            setError('Please select a department');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', formData);
            if (formData.role === 'doctor') {
                setSuccess('Registration successful! Please wait for admin verification before logging in.');
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: 'patient',
                    department: ''
                });
            } else {
                localStorage.setItem('token', res.data.token);
                setSuccess('Account created! Redirecting...');
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container fade-in">
            <div className="register-card glass">
                <div className="register-header">
                    <h1>Clinicare</h1>
                    <p>Create Your Account</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                placeholder="John"
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="form-group">
                        <label>I am a:</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div>

                    {formData.role === 'doctor' && (
                        <div className="form-group fade-in">
                            <label>Department</label>
                            <select name="department" value={formData.department} onChange={handleChange} required>
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Processing...' : (formData.role === 'doctor' ? 'Register for Verification' : 'Create Account')}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>

            <style jsx>{`
                .register-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, var(--bg-pastel) 0%, #FFFFFF 100%);
                    padding: 40px 20px;
                }
                
                .register-card {
                    width: 100%;
                    max-width: 500px;
                    padding: 40px;
                    border-radius: var(--radius-lg);
                    box-shadow: 0 10px 30px var(--shadow);
                }
                
                .register-header {
                    text-align: center;
                    margin-bottom: 32px;
                }
                
                .register-header h1 {
                    font-size: 2.5rem;
                    color: var(--secondary);
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
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
                
                .form-group input, .form-group select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    font-family: var(--font-main);
                    background: white;
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

                .success-message {
                    background-color: #F0FAF0;
                    color: #27AE60;
                    padding: 12px;
                    border-radius: var(--radius-sm);
                    margin-bottom: 20px;
                    font-size: 0.85rem;
                    text-align: center;
                }
                
                .w-full {
                    width: 100%;
                }
                
                .register-footer {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                
                .register-footer Link, .register-footer a {
                    color: var(--primary-dark);
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default Register;
