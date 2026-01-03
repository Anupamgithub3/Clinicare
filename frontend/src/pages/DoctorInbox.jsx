import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DoctorInbox = () => {
    const [inbox, setInbox] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const [prescriptionForm, setPrescriptionForm] = useState({ medicineId: '', quantity: 1, notes: '' });
    const [prescriptionList, setPrescriptionList] = useState([]);
    const [pMessage, setPMessage] = useState({ content: '', type: '' });

    const fetchInbox = async (patientId = '') => {
        try {
            const url = patientId ? `/doctor/inbox?patientId=${patientId}` : '/doctor/inbox';
            const res = await api.get(url);
            setInbox(res.data.inbox);
        } catch (err) {
            console.error('Failed to fetch inbox', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInbox();
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await api.get('/pharmacy');
            setMedicines(res.data.medicines);
        } catch (err) {
            console.error('Failed to fetch medicines', err);
        }
    };

    const addToPrescriptionList = () => {
        if (!prescriptionForm.medicineId) {
            setPMessage({ content: 'Please select a medicine first', type: 'error' });
            return;
        }

        const med = medicines.find(m => m._id === prescriptionForm.medicineId);
        const medName = prescriptionForm.medicineId === 'not_available' ? 'Unlisted Medicine' : med?.name;

        setPrescriptionList([...prescriptionList, {
            ...prescriptionForm,
            medName
        }]);

        setPrescriptionForm({ medicineId: '', quantity: 1, notes: '' });
        setPMessage({ content: 'Added to list!', type: 'success' });
        setTimeout(() => setPMessage({ content: '', type: '' }), 2000);
    };

    const removeFromList = (index) => {
        setPrescriptionList(prescriptionList.filter((_, i) => i !== index));
    };

    const handlePrescribe = async (e) => {
        e.preventDefault();
        if (prescriptionList.length === 0) {
            setPMessage({ content: 'Your prescription list is empty. Add medicines first.', type: 'error' });
            return;
        }

        try {
            await api.post('/doctor/prescribe-batch', {
                patientId: selectedItem.patientId._id,
                items: prescriptionList
            });

            setPMessage({ content: 'All recommendations sent successfully!', type: 'success' });
            setPrescriptionList([]);
        } catch (err) {
            setPMessage({ content: err.response?.data?.message || err.message || 'Action failed', type: 'error' });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchInbox(searchTerm);
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/doctor/inbox/${id}/status`, { status });
            fetchInbox();
            if (selectedItem?._id === id) {
                setSelectedItem({ ...selectedItem, status });
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    return (
        <div className="inbox-container container fade-in">
            <header className="section-header flex justify-between items-center">
                <div>
                    <h2>Patient Inbox</h2>
                    <p>Review AI-generated summaries and consultation requests.</p>
                </div>
                <form onSubmit={handleSearch} className="search-box">
                    <input
                        type="text"
                        placeholder="Search by Patient ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Search</button>
                </form>
            </header>

            <div className="inbox-layout">
                <aside className="inbox-list card glass">
                    {loading ? <p>Loading inbox...</p> : inbox.length === 0 ? <p>No items found.</p> : (
                        <ul>
                            {inbox.map((item) => (
                                <li
                                    key={item._id}
                                    className={`inbox-item ${selectedItem?._id === item._id ? 'active' : ''}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="item-meta">
                                        <span className={`priority-badge ${item.priority}`}>{item.priority}</span>
                                        <span className="date">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4>{item.patientId?.name || 'Unknown Patient'}</h4>
                                    <p className="summary-preview">{item.summaryId?.chiefComplaint || 'No complaint listed'}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                <main className="inbox-detail">
                    {selectedItem ? (
                        <div className="detail-card card glass">
                            <div className="detail-header flex justify-between">
                                <div>
                                    <h3>{selectedItem.patientId?.name}</h3>
                                    <p className="id-sub">Patient ID: {selectedItem.patientId?._id}</p>
                                </div>
                                <div className="status-selector">
                                    <select
                                        value={selectedItem.status}
                                        onChange={(e) => updateStatus(selectedItem._id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="responded">Responded</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="detail-content">
                                <section>
                                    <h4>AI Medical Summary</h4>
                                    <div className="summary-box">
                                        <p><strong>Chief Complaint:</strong> {selectedItem.summaryId?.chiefComplaint}</p>
                                        <p><strong>Urgency:</strong> <span className={`urgency-${selectedItem.summaryId?.urgency}`}>{selectedItem.summaryId?.urgency}</span></p>
                                        <div className="summary-text">
                                            {selectedItem.summaryId?.summary}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4>Reported Symptoms</h4>
                                    <ul className="symptom-list">
                                        {selectedItem.summaryId?.symptoms?.map((s, i) => (
                                            <li key={i}>
                                                <strong>{s.symptom}</strong> - {s.severity} ({s.duration})
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                                <section className="prescription-section">
                                    <h4>Prescribe Medication</h4>
                                    <div className="card glass prescription-card">
                                        {pMessage.content && (
                                            <div className={`alert ${pMessage.type}`}>{pMessage.content}</div>
                                        )}
                                        <form onSubmit={(e) => e.preventDefault()} className="prescription-form">
                                            <div className="form-group">
                                                <label>Select Medicine</label>
                                                <select
                                                    value={prescriptionForm.medicineId}
                                                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicineId: e.target.value })}
                                                >
                                                    <option value="">-- Select --</option>
                                                    {medicines.map(m => (
                                                        <option key={m._id} value={m._id}>{m.name} (${m.price})</option>
                                                    ))}
                                                    <option value="not_available">Medicine Not Found / Not Available</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="form-group">
                                                    <label>Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={prescriptionForm.quantity}
                                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, quantity: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Notes (Optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 1 tab twice daily"
                                                        value={prescriptionForm.notes}
                                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-secondary w-full mb-4"
                                                onClick={addToPrescriptionList}
                                            >
                                                + Add to Recommendation List
                                            </button>
                                        </form>

                                        {prescriptionList.length > 0 && (
                                            <div className="prescription-queue mt-4">
                                                <h5>Pending Recommendation List</h5>
                                                <ul className="queue-list">
                                                    {prescriptionList.map((item, idx) => (
                                                        <li key={idx} className="queue-item flex justify-between items-center">
                                                            <div>
                                                                <strong>{item.medName}</strong> x {item.quantity}
                                                                <p className="text-xs text-muted">{item.notes}</p>
                                                            </div>
                                                            <button className="text-danger" onClick={() => removeFromList(idx)}>×</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button
                                                    onClick={handlePrescribe}
                                                    className="btn btn-primary w-full mt-4 btn-lg"
                                                >
                                                    Send All Recommendations ({prescriptionList.length})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state card glass">
                            <p>Select a patient record from the list to view details.</p>
                        </div>
                    )}
                </main>
            </div>

            <style jsx>{`
        .inbox-container { padding-top: 20px; }
        .section-header { margin-bottom: 32px; }
        .search-box { display: flex; gap: 8px; }
        .search-box input { padding: 10px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); outline: none; }
        
        .inbox-layout { display: grid; grid-template-columns: 350px 1fr; gap: 32px; height: calc(100vh - 200px); }
        .inbox-list { overflow-y: auto; padding: 0; }
        .inbox-list ul { list-style: none; }
        .inbox-item { padding: 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; }
        .inbox-item:hover { background: var(--bg-pastel); }
        .inbox-item.active { background: var(--primary-light); border-left: 4px solid var(--primary); }
        
        .item-meta { display: flex; justify-content: space-between; margin-bottom: 8px; }
        
        .priority-badge { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .priority-badge.high, .priority-badge.urgent { background: #FF7675; color: white; }
        .priority-badge.medium { background: #FFEAA7; color: #636E72; }
        .priority-badge.low { background: #55EFC4; color: #2D3436; }
        .date { font-size: 0.75rem; color: var(--text-muted); }
        .summary-preview { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .inbox-detail { overflow-y: auto; }
        .detail-card { padding: 40px; }
        .id-sub { font-size: 0.8rem; color: var(--text-muted); }
        .summary-box { background: var(--bg-pastel); padding: 24px; border-radius: var(--radius-md); margin-top: 16px; }
        .summary-text { margin-top: 16px; white-space: pre-line; }
        .urgency-high, .urgency-emergency { color: #D63031; font-weight: 700; }
        .symptom-list { margin-top: 12px; list-style: square; padding-left: 20px; }
        
        section { margin-top: 32px; }
        h4 { margin-bottom: 12px; color: var(--secondary); border-bottom: 2px solid var(--primary-light); display: inline-block; }
        
        .empty-state { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

        .prescription-section { margin-top: 40px; border-top: 1px solid var(--border); padding-top: 32px; }
        .prescription-card { padding: 24px; border: 1px solid var(--primary-light); }
        .prescription-form .form-group { margin-bottom: 16px; }
        .prescription-form select, .prescription-form input { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px; }
        .new-medicine-fields { display: flex; gap: 8px; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        
        .alert { padding: 10px; border-radius: 4px; margin-bottom: 16px; font-size: 0.85rem; }
        .alert.success { background: #E3FAEF; color: #05C46B; }
        .alert.error { background: #FFF1F1; color: #D63031; }
        
        .w-full { width: 100%; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .gap-4 { gap: 16px; }
        .mb-4 { margin-bottom: 16px; }
        .mt-4 { margin-top: 16px; }
        .btn-lg { padding: 14px; font-size: 1.1rem; }
        .btn-secondary { background: #636E72; color: white; }
        .text-danger { color: #D63031; font-weight: 700; background: none; border: none; cursor: pointer; font-size: 1.2rem; }
        
        .prescription-queue h5 { margin-bottom: 12px; font-size: 0.9rem; text-transform: uppercase; color: var(--text-muted); }
        .queue-list { list-style: none; padding: 0; border: 1px dashed var(--primary); border-radius: 4px; overflow: hidden; }
        .queue-item { padding: 12px; background: #fdfdfd; border-bottom: 1px solid var(--border); }
        .queue-item:last-child { border-bottom: none; }
      `}</style>
        </div>
    );
};

export default DoctorInbox;
