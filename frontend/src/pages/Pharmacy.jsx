import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Pharmacy = () => {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [quantities, setQuantities] = useState({}); // { medicineId: quantity }
    const [cart, setCart] = useState([]); // Array of { id, name, price, quantity }
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [prescriptions, setPrescriptions] = useState([]);
    const [recSelectedQtys, setRecSelectedQtys] = useState({}); // { prescriptionId: quantity }
    const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '' });
    const [message, setMessage] = useState({ content: '', type: '' });

    const fetchMedicines = async (search = '') => {
        try {
            const res = await api.get(`/pharmacy${search ? `?search=${search}` : ''}`);
            setMedicines(res.data.medicines);
            // Initialize quantities
            const initialQtys = {};
            res.data.medicines.forEach(m => initialQtys[m._id] = 1);
            setQuantities(initialQtys);
        } catch (err) {
            console.error('Failed to fetch medicines', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
        if (user.role === 'patient') {
            fetchPrescriptions();
        }
    }, [user.role]);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/pharmacy/prescriptions');
            setPrescriptions(res.data.prescriptions);

            // Initialize recommendation quantities to the max allowed
            const initialRecQtys = {};
            res.data.prescriptions.forEach(p => {
                initialRecQtys[p._id] = p.remainingQuantity;
            });
            setRecSelectedQtys(initialRecQtys);
        } catch (err) {
            console.error('Failed to fetch prescriptions', err);
        }
    };

    const handleQtyChange = (id, val) => {
        const qty = Math.max(1, parseInt(val) || 1);
        setQuantities(prev => ({ ...prev, [id]: qty }));
    };

    const addToCart = (medicine, overideQty = null, prescriptionId = null) => {
        if (user.role === 'patient' && !medicine.prescribed && !overideQty) {
            setMessage({ content: `You can only buy medicines recommended by your doctor.`, type: 'error' });
            return;
        }

        const qty = overideQty || quantities[medicine._id] || 1;
        const limit = user.role === 'patient' ? (medicine.allowedQuantity || overideQty) : medicine.stock;

        // Check cumulative quantity already in cart for this specific recommendation session
        const existingInCart = cart.find(item => item.id === medicine._id && item.prescriptionId === prescriptionId);
        const currentQtyInCart = existingInCart ? existingInCart.quantity : 0;

        if (currentQtyInCart + qty > limit) {
            setMessage({
                content: `You cannot exceed the doctor's limit. You have ${currentQtyInCart} in cart, and the total limit is ${limit}.`,
                type: 'error'
            });
            return;
        }

        if (medicine.stock < qty) {
            setMessage({ content: `Only ${medicine.stock} units available for ${medicine.name}`, type: 'error' });
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === medicine._id && item.prescriptionId === prescriptionId);
            if (existing) {
                return prev.map(item => (item.id === medicine._id && item.prescriptionId === prescriptionId)
                    ? { ...item, quantity: item.quantity + qty }
                    : item
                );
            }
            return [...prev, {
                id: medicine._id,
                prescriptionId: prescriptionId, // Added for backend tracking
                name: medicine.name,
                price: medicine.price,
                quantity: qty
            }];
        });
        setMessage({ content: `${qty} x ${medicine.name} added to cart`, type: 'success' });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const groupPrescriptions = (list) => {
        if (!list || list.length === 0) return [];

        // Sort by createdAt descending
        const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const groups = [];
        const TIME_THRESHOLD = 10 * 60 * 1000; // 10 minutes

        sorted.forEach(p => {
            const lastGroup = groups[groups.length - 1];
            const pDate = new Date(p.createdAt);

            // Grouping logic:
            // 1. If p has batchId, it MUST match lastGroup.batchId
            // 2. If no batchId (legacy), fallback to time heuristic
            const isSameSession = lastGroup && (
                (p.batchId && lastGroup.batchId === p.batchId) ||
                (!p.batchId && !lastGroup.batchId &&
                    lastGroup.doctor?._id === p.doctor?._id &&
                    (new Date(lastGroup.timestamp) - pDate) < TIME_THRESHOLD)
            );

            if (isSameSession) {
                lastGroup.items.push(p);
            } else {
                groups.push({
                    id: p.batchId || p._id,
                    batchId: p.batchId,
                    doctor: p.doctor,
                    timestamp: p.createdAt,
                    items: [p]
                });
            }
        });

        return groups;
    };

    const handleCheckout = async () => {
        try {
            setLoading(true);
            const res = await api.post('/pharmacy/checkout', { items: cart });
            setMessage({ content: 'Order placed successfully!', type: 'success' });
            setCart([]);
            setIsCartOpen(false);
            fetchMedicines(searchTerm);
        } catch (err) {
            setMessage({ content: err.response?.data?.message || 'Checkout failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMedicines(searchTerm);
    };

    const handleAdminAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/pharmacy', form);
            setForm({ name: '', description: '', price: '', stock: '', category: '' });
            setMessage({ content: 'Medicine added successfully', type: 'success' });
            fetchMedicines(searchTerm);
        } catch (err) {
            setMessage({ content: 'Failed to add medicine', type: 'error' });
        }
    };

    return (
        <div className="pharmacy-container container fade-in">
            <header className="section-header flex justify-between items-center">
                <div>
                    <h2>Clinicare Pharmacy</h2>
                    <p>Browse and purchase medical supplies.</p>
                </div>
                <div className="header-actions flex items-center gap-4">
                    {user.role !== 'patient' && (
                        <form onSubmit={handleSearch} className="search-box">
                            <input
                                type="text"
                                placeholder="Search medicines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">Search</button>
                        </form>
                    )}
                    {user.role === 'patient' && (
                        <button className="cart-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
                            <span className="cart-icon">🛒</span>
                            {cart.length > 0 && <span className="cart-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
                        </button>
                    )}
                </div>
            </header>

            {message.content && (
                <div className={`alert ${message.type}`}>
                    {message.content}
                    <button onClick={() => setMessage({ content: '', type: '' })}>×</button>
                </div>
            )}

            {user.role === 'patient' && prescriptions.length > 0 && (
                <div className="recommendations-container mb-8">
                    <h2 className="mb-6">👨‍⚕️ Your Doctor Recommendations</h2>
                    {groupPrescriptions(prescriptions).map(group => {
                        // Section is considered fully completed only when EVERY item has been bought
                        const isGroupCompleted = group.items.every(p => p.remainingQuantity < (p.totalQuantity || p.remainingQuantity) || !p.isActive);
                        return (
                            <div key={group.id} className={`rec-group card glass mb-6 ${isGroupCompleted ? 'group-completed' : ''}`}>
                                <header className="rec-group-header flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="doc-icon">🩺</span>
                                        <h3>
                                            Recommended by Dr. {group.doctor?.name}
                                            {isGroupCompleted && <span className="tag-purchased ml-3">Fully Bought ✓</span>}
                                        </h3>
                                    </div>
                                    <span className="rec-date">
                                        {new Date(group.timestamp).toLocaleDateString()} at {new Date(group.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </header>

                                <div className="table-responsive">
                                    <table className="inventory-table rec-table">
                                        <thead>
                                            <tr>
                                                <th>Medicine Name</th>
                                                <th>Price</th>
                                                <th>Adjust Quantity</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.items.map(p => {
                                                const isBought = p.remainingQuantity === 0 || !p.isActive || (p.totalQuantity > 0 && p.remainingQuantity < p.totalQuantity);
                                                return (
                                                    <tr key={p._id} className={!p.medicine ? 'unlisted-row' : (isGroupCompleted ? 'completed-row' : '')}>
                                                        <td>
                                                            <strong>{p.medicine?.name || "Unlisted Medicine"}</strong>
                                                            {!p.medicine && <span className="tag-warning ml-2">Shop doesn't carry this</span>}
                                                            {isBought && p.medicine && <span className="tag-purchased ml-2">Purchased ✓</span>}
                                                            <p className="text-xs text-secondary mt-1">Doctor's Note: {p.notes}</p>
                                                        </td>
                                                        <td>{p.medicine ? `$${p.medicine.price.toFixed(2)}` : 'N/A'}</td>
                                                        <td>
                                                            {p.medicine && p.remainingQuantity > 0 && (
                                                                <div className="rec-qty-controls flex items-center gap-2">
                                                                    <button
                                                                        className="qty-btn"
                                                                        onClick={() => setRecSelectedQtys(prev => ({ ...prev, [p._id]: Math.max(1, (prev[p._id] || 1) - 1) }))}
                                                                    >-</button>
                                                                    <span className="rec-qty-val">{recSelectedQtys[p._id] || p.remainingQuantity}</span>
                                                                    <button
                                                                        className="qty-btn"
                                                                        onClick={() => setRecSelectedQtys(prev => ({ ...prev, [p._id]: Math.min(p.remainingQuantity, (prev[p._id] || 0) + 1) }))}
                                                                    >+</button>
                                                                    <span className="text-xs text-muted ml-2">
                                                                        (Bought: {(p.totalQuantity || p.remainingQuantity) - p.remainingQuantity} / {p.totalQuantity || p.remainingQuantity})
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {p.medicine && p.remainingQuantity === 0 && (
                                                                <span className="text-xs text-muted">
                                                                    (Bought: {p.totalQuantity || p.remainingQuantity} / {p.totalQuantity || p.remainingQuantity})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {p.medicine && !isBought ? (
                                                                <button
                                                                    className={`btn btn-sm ${(cart.find(item => item.id === p.medicine?._id && item.prescriptionId === p._id)?.quantity || 0) >= p.remainingQuantity ? 'btn-disabled' : 'btn-primary'}`}
                                                                    onClick={() => addToCart({ ...p.medicine, prescribed: true, allowedQuantity: p.remainingQuantity }, recSelectedQtys[p._id] || p.remainingQuantity, p._id)}
                                                                    disabled={(cart.find(item => item.id === p.medicine?._id && item.prescriptionId === p._id)?.quantity || 0) >= p.remainingQuantity}
                                                                >
                                                                    {(cart.find(item => item.id === p.medicine?._id && item.prescriptionId === p._id)?.quantity || 0) >= p.remainingQuantity ? 'Limit Reached' : 'Add to Cart'}
                                                                </button>
                                                            ) : (
                                                                <span className="status-purchased text-sm font-bold uppercase">
                                                                    {isBought ? (
                                                                        <><span className="check-icon">✓</span> Purchased</>
                                                                    ) : 'Talk to Pharmacist'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {user.role !== 'patient' && (
                <div className="layout-grid">
                    {user.role === 'admin' && (
                        <aside className="form-column">
                            {/* ... Restock Form ... */}
                            <div className="card glass">
                                <h3>Restock Pharmacy</h3>
                                <form onSubmit={handleAdminAdd}>
                                    <div className="form-group">
                                        <label>Medicine Name</label>
                                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Price ($)</label>
                                        <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Initial Stock</label>
                                        <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full">Add Medicine</button>
                                </form>
                            </div>
                        </aside>
                    )}

                    <main className={`table-column ${user.role !== 'admin' ? 'full-width' : ''}`}>
                        <div className="card glass">
                            <h3 className="mb-4">Inventory List</h3>
                            {loading ? <div className="loader">Updating...</div> : (
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Medicine Name</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicines.map((m) => (
                                            <tr key={m._id}>
                                                <td><strong>{m.name}</strong></td>
                                                <td>${m.price.toFixed(2)}</td>
                                                <td>
                                                    <span className={`stock-badge ${m.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                        {m.stock > 0 ? `${m.stock} Units` : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {user.role === 'admin' ? (
                                                        <span className="text-muted">Managed</span>
                                                    ) : (
                                                        <span className="text-muted text-sm italic">Available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </main>
                </div>
            )}

            {isCartOpen && (
                <div className="cart-drawer fade-in">
                    <div className="cart-content card glass">
                        <header className="flex justify-between items-center mb-6">
                            <h3>Your Cart</h3>
                            <button onClick={() => setIsCartOpen(false)} className="close-btn">×</button>
                        </header>

                        {cart.length === 0 ? <p className="text-center py-8">Your cart is empty.</p> : (
                            <>
                                <ul className="cart-list">
                                    {cart.map(item => (
                                        <li key={item.id} className="cart-item flex justify-between items-center">
                                            <div>
                                                <strong>{item.name}</strong>
                                                <p className="text-xs">{item.quantity} x ${item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                                                <button onClick={() => removeFromCart(item.id)} className="remove-btn">🗑️</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="order-summary mt-6 pt-6 border-t">
                                    <div className="flex justify-between mb-4">
                                        <span>Subtotal</span>
                                        <span className="font-bold">${calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <button onClick={handleCheckout} className="btn btn-primary w-full py-4">
                                        Proceed to Checkout (${calculateTotal().toFixed(2)})
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
        .section-header { margin-bottom: 32px; }
        .search-box { display: flex; gap: 8px; }
        .search-box input { padding: 10px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); outline: none; width: 250px; }
        
        .cart-btn { position: relative; background: white; border: 1px solid var(--border); padding: 10px 15px; border-radius: var(--radius-sm); cursor: pointer; transition: 0.2s; }
        .cart-btn:hover { background: var(--bg-pastel); }
        .cart-icon { font-size: 1.4rem; }
        .cart-badge { position: absolute; top: -5px; right: -5px; background: var(--primary); color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        
        .layout-grid { display: grid; grid-template-columns: 350px 1fr; gap: 32px; }
        .full-width { grid-column: 1 / -1; }
        
        .qty-input { width: 60px; padding: 6px; border: 1px solid var(--border); border-radius: 4px; text-align: center; }
        
        .inventory-table { width: 100%; border-collapse: collapse; }
        .inventory-table th { text-align: left; padding: 16px; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; }
        .inventory-table td { padding: 16px; border-bottom: 1px solid var(--border); }
        
        .stock-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
        .in-stock { background: #E3FAEF; color: #05C46B; }
        .out-of-stock { background: #FFF1F1; color: #D63031; }
        
        .prescribed-badge { margin-left: 8px; font-size: 0.65rem; background: var(--secondary); color: white; padding: 2px 6px; border-radius: 10px; vertical-align: middle; }
        .restricted-row { opacity: 0.6; }
        .btn-disabled { background: #E0E0E0; color: #9E9E9E; cursor: not-allowed; border-color: transparent; }
        
        .cart-drawer { position: fixed; top: 0; right: 0; width: 450px; height: 100vh; background: rgba(0,0,0,0.1); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: flex-end; }
        .cart-content { width: 400px; height: 100%; border-radius: 0; padding: 40px; display: flex; flex-direction: column; }
        .cart-list { flex: 1; overflow-y: auto; list-style: none; }
        .cart-item { padding: 15px 0; border-bottom: 1px solid var(--border); }
        .remove-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; filter: grayscale(1); }
        .remove-btn:hover { filter: none; }
        .close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; line-height: 1; }
        
        .alert { padding: 12px 20px; border-radius: var(--radius-sm); margin: 0 0 24px 0; display: flex; justify-content: space-between; align-items: center; }
        .alert.success { background: #E3FAEF; color: #05C46B; border-left: 5px solid #05C46B; }
        .alert.error { background: #FFF1F1; color: #D63031; border-left: 5px solid #D63031; }
        
        .border-t { border-top: 2px solid var(--border); }
        .loader { padding: 40px; text-align: center; color: var(--primary); font-weight: 600; }
        
        .recommendations-container { margin-bottom: 40px; }
        .rec-group { padding: 24px; border-left: 5px solid var(--secondary); margin-bottom: 32px; }
        .rec-group-header h3 { color: var(--secondary); margin: 0; }
        .rec-date { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
        .doc-icon { font-size: 1.2rem; }
        
        .rec-table { background: white; border-radius: 8px; overflow: hidden; }
        .unlisted-row { background: #fffdf5; opacity: 0.8; }
        .rec-qty-controls { background: white; padding: 2px 8px; border-radius: 20px; border: 1px solid var(--border); display: inline-flex; }
        .qty-btn { background: none; border: none; font-weight: 700; color: var(--primary); cursor: pointer; padding: 0 5px; font-size: 1.1rem; }
        .qty-btn:hover { color: var(--secondary); }
        .rec-qty-val { font-weight: 700; font-size: 0.9rem; min-width: 20px; text-align: center; }
        
        .tag-warning { font-size: 0.7rem; background: #ffeaa7; color: #d35400; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
        .tag-purchased { font-size: 0.7rem; background: #e3faef; color: #05c46b; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
        .group-completed { opacity: 0.7; filter: grayscale(0.5); border-left-color: #bdc3c7 !important; }
        .completed-row { background: #f9f9f9; }
        .ml-3 { margin-left: 12px; }
        .ml-2 { margin-left: 8px; }
        .table-responsive { overflow-x: auto; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .status-purchased { color: #05C46B; font-weight: 800; display: flex; align-items: center; gap: 4px; }
        .check-icon { font-size: 1.1rem; }

        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-4 { gap: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-6 { margin-top: 24px; }
        .pt-6 { padding-top: 24px; }
        .font-bold { font-weight: 700; }
      `}</style>
        </div>
    );
};

export default Pharmacy;
