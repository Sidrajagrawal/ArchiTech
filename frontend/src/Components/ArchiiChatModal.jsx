import React, { useState, useEffect, useRef } from 'react';
import './ArchiiChatModal.css';

const API_URL = 'http://localhost:8000/api/chatbot/';

const ArchiiChatModal = ({ isOpen, onClose, floorPlanContext }) => {
  const [messages, setMessages] = useState([
    { content: "Hi, I'm Archii! Ask me about construction materials, dimensions, or how to improve your floor plan.", isUser: false }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading) return;
    
    // Add context about the floor plan if this is the first message
    const messageToSend = messages.length === 1 
      ? `${newMessage} (Context: I'm looking at a floor plan I just generated)`
      : newMessage;
    
    // Add user message to chat
    setMessages(prev => [...prev, { content: newMessage, isUser: true }]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Store session ID if provided
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Add bot response to chat
      setMessages(prev => [...prev, { content: data.response, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error
      setMessages(prev => [
        ...prev, 
        { 
          content: "Sorry, I couldn't process your request. Please try again.", 
          isUser: false 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="archii-modal-overlay">
      <div className="archii-chat-modal">
        <div className="archii-chat-header">
          <div className="archii-logo">
            <i className="ri-home-4-line"></i>
            <h2>Archii</h2>
          </div>
          <button className="archii-close-button" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="archii-chat-messages">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`archii-message ${message.isUser ? 'archii-user-message' : 'archii-bot-message'}`}
            >
              <div className="archii-message-avatar">
                {message.isUser ? (
                  <div className="archii-user-avatar">U</div>
                ) : (
                  <div className="archii-bot-avatar">A</div>
                )}
              </div>
              <div className="archii-message-content">
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="archii-message archii-bot-message">
              <div className="archii-message-avatar">
                <div className="archii-bot-avatar">A</div>
              </div>
              <div className="archii-typing-indicator">
                <div className="archii-dot"></div>
                <div className="archii-dot"></div>
                <div className="archii-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="archii-chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Ask Archii about your floor plan..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isLoading}
            ref={inputRef}
          />
          <button 
            type="submit" 
            disabled={isLoading || !newMessage.trim()}
            className="archii-send-button"
          >
            <i className="ri-send-plane-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ArchiiChatModal;