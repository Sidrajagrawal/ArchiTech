import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import './CreatePage.css';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const imageUrl = location.state?.generatedImage;

  const handleEdit = async () => {
    setProcessing(true);
    try {
      const response = await axios.post('http://localhost:8000/convert-to-svg/', {
        image_url: imageUrl
      });
      if (response.data.svg_data) {
        navigate('/editor', { state: { svgData: response.data.svg_data } });
      }
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert image to SVG. The server might be busy.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI-FloorPlan-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not auto-download. Opening in new tab instead.");
      window.open(imageUrl, "_blank");
    }
  };

  if (!imageUrl) {
    return (
      <div className="createPage-body">
        <div className="form-container" style={{ textAlign: 'center', position: 'relative', zIndex: 50 }}>
          <h2>No Blueprint Found</h2>
          <button onClick={() => navigate('/')} className="generate-btn">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="createPage-body">
      <div className="main-card" style={{
        flexDirection: 'column',
        maxWidth: '800px',
        height: 'auto',
        position: 'relative',
        zIndex: 50
      }}>

        <div style={{
          background: '#f8fafc',
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <img
            src={imageUrl}
            alt="AI Floor Plan"
            style={{
              maxWidth: '100%',
              maxHeight: '500px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}
          />
        </div>

        <div style={{ padding: '30px 40px', display: 'flex', gap: '15px', background: 'white' }}>

          <button
            onClick={handleDownload}
            className="generate-btn"
            style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Download size={20} /> Download
          </button>

          <button
            onClick={() => navigate('/create')}
            className="generate-btn"
            style={{ margin: 0, background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            get another
          </button>
          <button
            onClick={handleEdit}
            disabled={processing}
            className="generate-btn"
            style={{ margin: 0, background: '#3b82f6', color: '#0f172a', border: '1px solid #3b82f6', cursor: 'pointer' }}
          >
            {processing ? 'Converting...' : 'Edit'}
          </button>

        </div>

      </div>
    </div>
  );
};

export default ResultPage;