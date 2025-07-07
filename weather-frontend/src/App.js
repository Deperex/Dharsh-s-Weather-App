import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Form state
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editId, setEditId] = useState(null);

  // CRUD state
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [msg, setMsg] = useState('');

  const [showInfo, setShowInfo] = useState(false);

  // Fetch all saved records
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/records');
        setRecords(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  // Create or update a record
  const handleSave = async e => {
    e.preventDefault();
    setMsg('');
    const payload = { location, start_date: startDate, end_date: endDate };
    try {
      if (editId) {
        await axios.put(`/records/${editId}`, payload);
        setMsg('Record updated.');
      } else {
        await axios.post('/records', payload);
        setMsg('Record created.');
      }
      setLocation('');
      setStartDate('');
      setEndDate('');
      setEditId(null);
      const list = await axios.get('/records');
      setRecords(list.data);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message;
      setMsg(`Error saving record: ${serverMsg}`);
    }
  };

  // Delete a record
  const handleDelete = async id => {
    setMsg('');
    try {
      await axios.delete(`/records/${id}`);
      setRecords(records.filter(r => r.id !== id));
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(null);
      }
      setMsg('Record deleted.');
    } catch (e) {
      console.error(e);
      setMsg('Error deleting record.');
    }
  };

  // Edit a record
  const handleEdit = record => {
    setMsg('');
    setEditId(record.id);
    setLocation(record.location);
    setStartDate(record.start_date);
    setEndDate(record.end_date);
    setSelectedRecord(null);
  };

  // View a record's forecast
  const handleView = async record => {
    setMsg('');
    setSelectedRecord(record);
  };

  // Cancel edit
  const handleCancel = () => {
    setEditId(null);
    setLocation('');
    setStartDate('');
    setEndDate('');
    setMsg('');
  };

  return (
    <div className="App" style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      {/* Header with name and Info button */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dharsh Nagrani's Weather App</h1>
        <button onClick={() => setShowInfo(true)} style={{ padding: '0.5rem' }}>Info</button>
      </header>

      {/* Info Modal */}
      {showInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, maxWidth: 500, textAlign: 'left' }}>
            <h2>Product Manager Accelerator</h2>
            <p>Product Manager Accelerator is a program designed to fast-track aspiring and current product managers through comprehensive training, mentorship, and industry networking opportunities. Join us on LinkedIn for more information:</p>
            <p><a href="https://www.linkedin.com/school/pmaccelerator/" target="_blank" rel="noopener noreferrer">Our LinkedIn page</a></p>
            <button onClick={() => setShowInfo(false)} style={{ marginTop: '1rem', padding: '0.5rem' }}>Close</button>
          </div>
        </div>
      )}

      {/* Form for Create/Update */}
      <form onSubmit={handleSave} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: 8 }}
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: 8 }}
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: 8 }}
        />
        <button type="submit" style={{ padding: '0.5rem' }}>
          {editId ? 'Update Record' : 'Create Record'}
        </button>
        {editId && (
          <button type="button" onClick={handleCancel} style={{ marginLeft: 8, padding: '0.5rem' }}>
            Cancel
          </button>
        )}
      </form>

      {msg && <p>{msg}</p>}

      {/* List of records with actions */}
      <h2>Saved Records</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {records.map(r => (
          <li key={r.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div><strong>#{r.id}</strong> {r.location} ({r.start_date} → {r.end_date})</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => handleView(r)} style={{ marginRight: 8 }}>View</button>
              <button onClick={() => handleEdit(r)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => handleDelete(r.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Display selected record's forecast */}
      {selectedRecord && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Forecast for {selectedRecord.location} ({selectedRecord.start_date} → {selectedRecord.end_date})</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            {selectedRecord.data.map(day => (
              <div key={day.date} style={{ flex: '1 0 30%', border: '1px solid #ccc', borderRadius: 6, padding: 12, margin: '0.5rem 0' }}>
                <p><strong>{new Date(day.date).toLocaleDateString()}</strong></p>
                <img src={day.day.condition.icon} alt={day.day.condition.text} />
                <p>{day.day.condition.text}</p>
                <p>High: {day.day.maxtemp_c}°C</p>
                <p>Low: {day.day.mintemp_c}°C</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;