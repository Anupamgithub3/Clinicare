import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useDepartments } from '../context/DepartmentsContext';

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null);
    const [members, setMembers] = useState({ active: [], inactive: [] });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', description: '' });
    const [doctorIdentifier, setDoctorIdentifier] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const { refresh, fetchDetailed } = useDepartments();

    const fetchDepartments = async () => {
        try {
            // For admin panel try detailed view first (requires auth)
            try {
                const detailed = await fetchDetailed();
                setDepartments(detailed);
            } catch (err) {
                // Fallback to public listing
                const res = await api.get('/departments');
                setDepartments(res.data.departments);
            }
        } catch (err) {
            setMessage('Failed to fetch departments');
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (deptId) => {
        try {
            const res = await api.get(`/departments/${deptId}/members`);
            setMembers({
                active: res.data.activeMembers,
                inactive: res.data.inactiveMembers
            });
        } catch (err) {
            setMessage('Failed to fetch department members');
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleAddDept = async (e) => {
        e.preventDefault();
        try {
            await api.post('/departments', newDept);
            setMessage('Department created successfully!');
            setShowAddModal(false);
            setNewDept({ name: '', description: '' });
            await fetchDepartments();
            if (refresh) await refresh();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to create department');
        }
    };

    const handleToggleStatus = async (doctorId) => {
        try {
            await api.put(`/departments/members/${doctorId}/status`);
            if (selectedDept) fetchMembers(selectedDept._id);
            await fetchDepartments(); // Update counts
            if (refresh) await refresh();
        } catch (err) {
            setMessage('Failed to update member status');
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        if (!selectedDept) return setMessage('No department selected');
        if (!doctorIdentifier.trim()) return setMessage('Provide doctor ID or email');

        try {
            const payload = doctorIdentifier.includes('@') ? { email: doctorIdentifier.trim() } : { doctorId: doctorIdentifier.trim() };
            await api.post(`/departments/${selectedDept._id}/members`, payload);
            setMessage('Doctor added to department');
            setDoctorIdentifier('');
            fetchMembers(selectedDept._id);
            await fetchDepartments();
            if (refresh) await refresh();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to add doctor');
        }
    };

    const handleRemoveDoctor = async (doctorId) => {
        try {
            await api.delete(`/departments/members/${doctorId}`);
            setMessage('Doctor removed from department');
            if (selectedDept) fetchMembers(selectedDept._id);
            await fetchDepartments();
            if (refresh) await refresh();
        } catch (err) {
            setMessage('Failed to remove doctor');
        }
    };

    const selectDept = (dept) => {
        setSelectedDept(dept);
        fetchMembers(dept._id);
    };

    return (
        <div className="dept-mgmt-container container fade-in">
            <header className="dashboard-header flex justify-between items-center">
                <div className="brand">
                    <h1>Department Management</h1>
                    <p className="badge">ADMIN CONTROL</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Add New Department</button>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-outline">Back</button>
                </div>
            </header>

            {message && <div className={`alert ${message.includes('failed') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

            <main className="mgmt-layout">
                <section className="dept-list-section card glass">
                    <h3>All Departments</h3>
                    <div className="dept-grid">
                        {departments.map(dept => (
                            <div
                                key={dept._id}
                                className={`dept-card ${selectedDept?._id === dept._id ? 'active' : ''}`}
                                onClick={() => selectDept(dept)}
                            >
                                <h4>{dept.name}</h4>
                                <p className="dept-desc">{dept.description?.substring(0, 60)}...</p>
                                <div className="dept-stats">
                                    <span className="stat active-stat">{dept.activeCount} Active</span>
                                    <span className="stat inactive-stat">{dept.inactiveCount} Inactive</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dept-details-section">
                    {selectedDept ? (
                        <div className="card glass">
                            <div className="details-header">
                                <h3>{selectedDept.name} Members</h3>
                                <p>{selectedDept.description}</p>
                            </div>

                            <div className="add-doctor">
                                <form onSubmit={handleAddDoctor} className="inline-form">
                                    <input
                                        placeholder="Doctor ID or email"
                                        value={doctorIdentifier}
                                        onChange={e => setDoctorIdentifier(e.target.value)}
                                    />
                                    <button className="btn btn-primary btn-sm" type="submit">Add Doctor</button>
                                </form>
                            </div>

                            <div className="member-lists">
                                <div className="member-group">
                                    <h4>Active Staff</h4>
                                    {members.active.length === 0 ? <p className="no-data">No active doctors</p> : (
                                        <table className="member-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {members.active.map(m => (
                                                    <tr key={m._id}>
                                                        <td>Dr. {m.firstName} {m.lastName}</td>
                                                        <td>{m.email}</td>
                                                        <td>
                                                            <button onClick={() => handleToggleStatus(m._id)} className="btn btn-outline btn-xs">Disable</button>
                                                            <button onClick={() => handleRemoveDoctor(m._id)} className="btn btn-danger btn-xs" style={{ marginLeft: '8px' }}>Remove</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div className="member-group">
                                    <h4>Inactive/Past Staff</h4>
                                    {members.inactive.length === 0 ? <p className="no-data">No history in this department</p> : (
                                        <table className="member-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {members.inactive.map(m => (
                                                    <tr key={m._id}>
                                                        <td>Dr. {m.firstName} {m.lastName}</td>
                                                        <td>{m.email}</td>
                                                        <td>
                                                            <button onClick={() => handleToggleStatus(m._id)} className="btn btn-primary btn-xs">Re-activate</button>
                                                            <button onClick={() => handleRemoveDoctor(m._id)} className="btn btn-danger btn-xs" style={{ marginLeft: '8px' }}>Remove</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card glass empty-state">
                            <p>Select a department to view and manage its staff.</p>
                        </div>
                    )}
                </section>
            </main>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <h3>Create Department</h3>
                        <form onSubmit={handleAddDept}>
                            <div className="form-group">
                                <label>Department Name</label>
                                <input
                                    value={newDept.name}
                                    onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                                    required
                                    placeholder="e.g. Cardiology"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newDept.description}
                                    onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                                    required
                                    placeholder="Brief description of the department's focus..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Department</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .dept-mgmt-container { padding-top: 40px; }
                .mgmt-layout { display: grid; grid-template-columns: 350px 1fr; gap: 24px; margin-top: 24px; }
                
                .dept-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 15px; }
                .dept-card { padding: 15px; border-radius: var(--radius-md); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
                .dept-card:hover { border-color: var(--primary); background: var(--bg-white); }
                .dept-card.active { border-color: var(--primary); background: var(--primary-light); }
                
                .dept-desc { font-size: 0.8rem; color: var(--text-muted); margin: 8px 0; }
                .dept-stats { display: flex; gap: 10px; font-size: 0.75rem; font-weight: 600; }
                .stat { padding: 2px 6px; border-radius: 4px; }
                .active-stat { background: #E9F7EF; color: #1E8449; }
                .inactive-stat { background: #FDEDEC; color: #A93226; }

                .details-header { margin-bottom: 30px; border-bottom: 1px solid var(--border); padding-bottom: 15px; }
                .details-header p { color: var(--text-muted); margin-top: 5px; }

                .member-lists { display: flex; flex-direction: column; gap: 40px; }
                .member-group h4 { margin-bottom: 15px; color: var(--secondary); border-left: 4px solid var(--primary); padding-left: 10px; }
                
                .member-table { width: 100%; border-collapse: collapse; }
                .member-table th, .member-table td { padding: 10px; text-align: left; font-size: 0.9rem; border-bottom: 1px solid var(--border); }
                .btn-xs { padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; }

                .empty-state { display: flex; align-items: center; justify-content: center; height: 300px; color: var(--text-muted); }
                .no-data { color: var(--text-muted); font-size: 0.85rem; font-style: italic; }

                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { width: 100%; max-width: 500px; padding: 30px; border-radius: var(--radius-lg); }
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
                textarea { width: 100%; min-height: 100px; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: var(--font-main); }

                .add-doctor { margin: 12px 0 18px; }
                .inline-form { display:flex; gap:8px; align-items:center; }
                .inline-form input { padding:8px 10px; border:1px solid var(--border); border-radius:4px; }
                .btn-danger { background: #E74C3C; color: white; border: none; padding: 6px 10px; border-radius:4px; }
                .btn-xs { padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; }

                .alert { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 24px; text-align: center; }
                .alert-success { background: #E9F7EF; color: #1E8449; }
                .alert-error { background: #FDEDEC; color: #A93226; }
                .header-actions { display: flex; gap: 10px; }
            `}</style>
        </div>
    );
};

export default DepartmentManagement;
