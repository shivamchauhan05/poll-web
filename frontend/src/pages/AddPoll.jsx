import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import './AddPoll.css';

export default function AddPoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addOption = () => {
    if (options.length < 4) {
      setOptions(prev => [...prev, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (idx, val) => {
    const copy = [...options]; 
    copy[idx] = val; 
    setOptions(copy);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(file);
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filtered = options.map(o => o.trim()).filter(Boolean);
    
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    if (filtered.length < 2) {
      alert('At least 2 options required');
      return;
    }

    if (filtered.length !== new Set(filtered).size) {
      alert('Options must be unique');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', question.trim());
      filtered.forEach(option => {
        formData.append('options', option);
      });
      
      if (image) {
        formData.append('image', image);
      }

      await api.post('/polls', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Poll created successfully!');
      navigate('/');
    } catch (err) {
      console.error('Error creating poll:', err);
      alert(err.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-poll-page">
      <div className="container">
        <div className="page-header">
          <h1>Create New Poll</h1>
          <p>Create an engaging poll with up to 4 options</p>
        </div>

        <div className="poll-form">
          <form onSubmit={handleSubmit}>
            {/* Question Section */}
            <div className="form-section">
              <label className="form-label">Poll Question *</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="question-input"
                rows="3"
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="form-section">
              <label className="form-label">Add Image (Optional)</label>
              <div className="image-upload-section">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" onClick={removeImage} className="remove-image-btn">
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="image-input"
                    />
                    <div className="upload-placeholder">
                      <i className="upload-icon">📷</i>
                      <p>Click to upload image</p>
                      <small>Supports JPG, PNG, GIF • Max 5MB</small>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Options Section */}
            <div className="form-section">
              <div className="options-header">
                <label className="form-label">Poll Options *</label>
                <span className="options-count">{options.length}/4</span>
              </div>
              
              <div className="options-list">
                {options.map((option, index) => (
                  <div key={index} className="option-input-group">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="option-input"
                      required={index < 2} // First two options are required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="remove-option-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 4 && (
                <button type="button" onClick={addOption} className="add-option-btn">
                  + Add Option
                </button>
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary submit-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Creating Poll...
                  </>
                ) : (
                  'Create Poll'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}