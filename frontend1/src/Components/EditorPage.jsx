import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SVGEditor } from '../utils/SVGEditorEngine'; 
import { ArrowLeft, Save, Grid, Layers, MousePointer } from 'lucide-react';
import './CreatePage.css'; 

const EditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [editorInstance, setEditorInstance] = useState(null);

  const svgData = location.state?.svgData;

  useEffect(() => {
    if (!editorInstance) {
      const editor = new SVGEditor('svg-editor-container');
      setEditorInstance(editor);

      if (svgData) {
        editor.loadFromString(svgData);
      } else {
        editor.createGrid();
      }
    }
  }, [svgData]);

  const handleAddRoom = () => editorInstance?.addRoom();
  const handleAddDoor = () => editorInstance?.addDoor();
  const handleToggleGrid = () => editorInstance?.toggleGrid();
  
  const handleDownload = () => {
      editorInstance?.saveSVG();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>
      
      {/* Toolbar */}
      <div style={{ 
        padding: '15px 20px', 
        background: '#1e293b', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <ArrowLeft />
          </button>
          <h3 style={{ margin: 0 }}>Blueprint Editor</h3>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAddRoom} className="tool-btn">Add Room</button>
          <button onClick={handleAddDoor} className="tool-btn">Add Door</button>
          <button onClick={handleToggleGrid} className="tool-btn"><Grid size={16}/> Grid</button>
          <button onClick={handleDownload} className="generate-btn" style={{ padding: '8px 15px', fontSize: '14px' }}>
            <Save size={16} /> Save SVG
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        <div id="svg-editor-container" style={{ flex: 1, position: 'relative' }}></div>

      </div>
    </div>
  );
};

export default EditorPage;