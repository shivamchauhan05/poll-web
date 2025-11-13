import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function AddPoll(){
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const navigate = useNavigate();

  const addOption = () => setOptions(prev => [...prev, '']);

  const handleOptionChange = (idx, val) => {
    const copy = [...options]; copy[idx] = val; setOptions(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filtered = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || filtered.length < 2) return alert('Question and at least 2 options required');
    try {
      await api.post('/polls', { question, options: filtered });
      alert('Poll created');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Create failed');
    }
  };

  return (
    <div className="container py-4">
      <div className="col-lg-8 mx-auto">
        <h4 className="mb-3">Add Poll</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input value={question} onChange={e => setQuestion(e.target.value)} className="form-control form-control-lg" placeholder="Question" />
          </div>

          {options.map((opt, i) => (
            <div className="mb-2" key={i}>
              <input value={opt} onChange={e => handleOptionChange(i, e.target.value)} className="form-control" placeholder={`Option ${i+1}`} />
            </div>
          ))}

          <div className="d-flex gap-2 mb-3">
            <button type="button" className="btn btn-outline-secondary" onClick={addOption}>Add Option</button>
            <button type="submit" className="btn btn-primary">Create Poll</button>
          </div>
        </form>
      </div>
    </div>
  );
}
