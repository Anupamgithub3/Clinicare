import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDepartments } from '../context/DepartmentsContext';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('profile_intake');
  const [summary, setSummary] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [fetchingDoctors, setFetchingDoctors] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { departments } = useDepartments();

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setFetchingDoctors(true);
        const deptList = departments.length ? departments : (await api.get('/departments')).data.departments;
        const allDoctors = [];

        for (const dept of deptList) {
          try {
            const docRes = await api.get(`/departments/${dept._id}/doctors`);
            // Inject department name into each doctor object
            const docsWithDept = docRes.data.doctors.map(d => ({
              ...d,
              departmentName: dept.name
            }));
            allDoctors.push(...docsWithDept);
          } catch (e) {
            console.error(`Error loading doctors for ${dept.name}`, e);
          }
        }
        setDoctors(allDoctors);
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setFetchingDoctors(false);
      }
    };
    loadDoctors();
  }, [departments]);

  const startNewSession = async () => {
    if (!selectedDoctor) return;
    try {
      setLoading(true);
      const res = await api.post('/chat/sessions', { title: 'Symptom Check' });
      setSession(res.data.session);
      setMessages([res.data.initialMessage]);
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !session) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/chat/sessions/${session._id}/messages`, { content: input });
      setMessages((prev) => [...prev, res.data.messages[1]]);
      if (res.data.phase) setPhase(res.data.phase);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setLoading(false);
    }
  };

  const endSessionAndSend = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/chat/sessions/${session._id}/end`, { doctorId: selectedDoctor });
      setSummary(res.data.summary);
      setPhase('completed');
    } catch (err) {
      console.error('Failed to end session', err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="chat-welcome container fade-in">
        <div className="welcome-card glass">
          <h2>Ready to check your symptoms?</h2>
          <p>Please select a doctor to review your consultation, then we'll begin.</p>

          <div className="doctor-select-area">
            {fetchingDoctors ? (
              <p>Loading medical staff...</p>
            ) : (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="doctor-select"
              >
                <option value="">-- Choose a physician --</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name || `${d.firstName} ${d.lastName}`} ({d.departmentName})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={startNewSession}
            className="btn btn-primary"
            disabled={!selectedDoctor || fetchingDoctors}
            style={{ marginTop: '20px' }}
          >
            Start Consultation
          </button>
        </div>
        <style jsx>{`
            .doctor-select-area { margin: 24px 0; }
            .doctor-select { width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-family: var(--font-main); }
        `}</style>
      </div>
    );
  }

  // Phase 'select_doctor' is no longer needed as we select upfront

  if (phase === 'completed') {
    return (
      <div className="chat-welcome container fade-in">
        <div className="welcome-card glass">
          <div className="success-icon">✓</div>
          <h2>Consultation Sent!</h2>
          <p>Your summary has been sent to the doctor. They will review it and get back to you.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container container fade-in">
      <div className="chat-window glass">
        <div className="chat-header flex justify-between items-center">
          <div>
            <h3>AI Consultation</h3>
            <p className="status">Session: {session.title}</p>
          </div>
          <button onClick={endSessionAndSend} className="btn btn-outline btn-sm">End & Send Summary</button>
        </div>

        <div className="messages-area">
          {messages.map((m, i) => (
            <div key={i} className={`message-bubble ${m.role}`}>
              <div className="content">{m.content}</div>
            </div>
          ))}
          {loading && <div className="message-bubble assistant loading">...</div>}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>

      <style jsx>{`
        .chat-welcome { height: 80vh; display: flex; align-items: center; justify-content: center; }
        .welcome-card { width: 100%; max-width: 500px; padding: 48px; border-radius: var(--radius-lg); text-align: center; }
        .chat-container { height: calc(100vh - 120px); display: flex; flex-direction: column; }
        .chat-window { flex: 1; display: flex; flex-direction: column; border-radius: var(--radius-lg); overflow: hidden; margin: 20px 0; }
        .chat-header { padding: 20px 32px; background: var(--primary-light); border-bottom: 1px solid var(--border); }
        .status { font-size: 0.8rem; color: var(--primary-dark); font-weight: 600; }
        .messages-area { flex: 1; padding: 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
        .message-bubble { max-width: 80%; padding: 12px 20px; border-radius: var(--radius-md); font-size: 0.95rem; }
        .message-bubble.assistant { align-self: flex-start; background: var(--bg-pastel); color: var(--text-main); border-bottom-left-radius: 4px; }
        .message-bubble.user { align-self: flex-end; background: var(--primary); color: var(--text-on-primary); border-bottom-right-radius: 4px; }
        .chat-input-area { padding: 24px 32px; background: white; border-top: 1px solid var(--border); display: flex; gap: 16px; }
        .chat-input-area input { flex: 1; padding: 12px 20px; border: 1px solid var(--border); border-radius: var(--radius-sm); outline: none; }
        .success-icon { font-size: 4rem; color: var(--primary); margin-bottom: 24px; }
        .btn-sm { padding: 8px 16px; font-size: 0.85rem; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
      `}</style>
    </div>
  );
};

export default Chat;
