import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function EditPoll(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
         const res = await api.get(`/polls/${id}`);
        setPoll(res.data);
        setQuestion(res.data.question);
        setOptions(res.data.options.map(o => o.text));
      } catch (err) {
        alert('Failed to load poll'); navigate('/');
      }
    };
    fetch();
  }, [id, navigate]);

  const handleSave = async () => {
    const filtered = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || filtered.length < 2) return alert('Question and at least 2 options required');
    try {
      await api.put(`/polls/${id}`, { question, options: filtered });
      alert('Updated');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  if (!poll) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="container py-4">
      <div className="col-lg-8 mx-auto">
        <h4 className="mb-3">Edit Poll</h4>
        <input className="form-control mb-2" value={question} onChange={e => setQuestion(e.target.value)} />
        {options.map((opt,i) => (
          <input className="form-control mb-2" key={i} value={opt} onChange={e => {
            const c = [...options]; c[i] = e.target.value; setOptions(c);
          }} />
        ))}
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
