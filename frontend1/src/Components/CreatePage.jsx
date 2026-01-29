import React, { useState } from 'react';
import axios from 'axios';
import './CreatePage.css';
import { useNavigate } from 'react-router-dom';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const CreatePage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    house_type: 'Villa',
    total_land_dimension: '',
    state_location: '',
    layout_style: 'Open Concept',
    entrance_facing: 'South',
    architectural_style: 'Modern Blueprint',
    custom_requirements: '' // <--- NEW FIELD
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/generate-house-map/',
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.image_url) {
        navigate('/result', { state: { generatedImage: response.data.image_url } });
      } else {
        alert("Server returned success but no Image URL.");
      }
    } catch (error) {
      if (newTab) newTab.close();
      console.error('Full Error:', error);

      if (error.response) {
        alert(`Server Error: ${error.response.data.error}`);
      } else if (error.request) {
        alert("Network Error: Is the backend running? Check console for CORS errors.");
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="createPage-body">
      <div className="form-container">

        <p className="title">Configure Your Plan</p>
        <p className="subtitle">Enter the land size and location, our AI handles the rest.</p>

        <form onSubmit={handleSubmit}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

            <div className="input-group">
              <label>Total Land Dimension (feet) *</label>
              <input
                type="text"
                name="total_land_dimension"
                className="dimension-input"
                placeholder="e.g. 40x60"
                value={formData.total_land_dimension}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>State (India)</label>
              <select
                name="state_location"
                className="smart-select"
                value={formData.state_location}
                onChange={handleChange}
              >
                <option value="" disabled>Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>House Type</label>
              <select name="house_type" className="smart-select" value={formData.house_type} onChange={handleChange}>
                <option value="Villa">Villa (Family)</option>
                <option value="Studio">Studio (Compact)</option>
                <option value="Luxury House">Luxury Estate</option>
                <option value="Standard House">Standard Home</option>
              </select>
            </div>

            <div className="input-group">
              <label>Visual Style</label>
              <select name="architectural_style" className="smart-select" value={formData.architectural_style} onChange={handleChange}>
                <option value="Modern Blueprint">Blue Technical</option>
                <option value="Black & White Sketch">B&W Sketch</option>
                <option value="Real Estate Color">Real Estate (Color)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Layout Flow</label>
              <select name="layout_style" className="smart-select" value={formData.layout_style} onChange={handleChange}>
                <option value="Open Concept">Open Concept</option>
                <option value="Partitioned">Traditional Walls</option>
                <option value="L-Shaped">L-Shaped</option>
              </select>
            </div>

            <div className="input-group">
              <label>Entrance Facing</label>
              <select name="entrance_facing" className="smart-select" value={formData.entrance_facing} onChange={handleChange}>
                <option value="South">South (Bottom)</option>
                <option value="North">North (Top)</option>
                <option value="East">East (Right)</option>
                <option value="West">West (Left)</option>
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Specific Requirements (Optional)</label>
              <textarea
                name="custom_requirements"
                className="dimension-input"
                placeholder="e.g. 'Master Bedroom must be 14x14', 'Add a Pooja Room in North East', 'Kitchen needs to be large'"
                value={formData.custom_requirements}
                onChange={handleChange}
                rows="2"
                style={{ resize: 'none', height: 'auto' }}
              />
            </div>

          </div>

          <button type="submit" className="generate-btn" disabled={loading}>
            {loading ? <span>Generating...</span> : <span>Get Floor Plan</span>}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreatePage;