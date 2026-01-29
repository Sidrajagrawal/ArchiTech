import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArchiiChatModal from './ArchiiChatModal';
import './ResultPage.css';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { imageBase64 } = location.state || {};
  const [isArchiiModalOpen, setIsArchiiModalOpen] = useState(false);

  if (!imageBase64) {
    return (
      <div className="result-container">
        <p>No image found. Please generate a plan first.</p>
        <button onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

  // Handle download functionality
  const handleDownload = () => {
    const downloadLink = document.createElement('a');
    
    downloadLink.href = imageBase64;
    
    downloadLink.download = 'floor-plan.png';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const openArchiiChat = () => {
    setIsArchiiModalOpen(true);
  };

  return (
    <div className="main-result">
      <div className="result-container">
        <div className='result-title'>Generated Floor Plan</div>
        <img
          src={imageBase64}
          alt="Generated Floor Plan"
          style={{ width: '90%', maxWidth: '700px', margin: '20px auto' }}
        />
        <br />
        <button onClick={() => navigate('/create')} className='btn-1 btn btn-warning'>Generate New Plan</button>
        <button className='btn-2 btn btn-secondary'><i className="ri-pencil-line"></i> Edit This Plan</button>
        <button onClick={handleDownload} className='btn-3 btn btn-success'><i className="ri-download-line"></i> Download</button>
        <button onClick={openArchiiChat} className='btn-4 btn btn-primary'><i className="ri-chat-1-fill"></i> Archii</button>
      </div>

      <ArchiiChatModal 
        isOpen={isArchiiModalOpen} 
        onClose={() => setIsArchiiModalOpen(false)}
        floorPlanContext="Generated floor plan" 
      />
    </div>
  );
};

export default ResultPage;