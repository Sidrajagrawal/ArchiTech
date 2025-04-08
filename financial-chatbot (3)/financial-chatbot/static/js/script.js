// Store conversation history
let conversationHistory = [];

// DOM elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Add initial bot message when page loads
window.onload = function() {
    addBotMessage("Hello! I'm your architecture assistant. How can I help you with house design, floor plans, or construction planning today?");
};

// Add a user message to the chat
function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Add to history
    conversationHistory.push({
        "role": "user",
        "content": message
    });
}

// Add a bot message to the chat
function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    scrollToBottom();
    
    // Add to history if it's not a loading indicator
    if (!message.includes("...")) {
        conversationHistory.push({
            "role": "assistant",
            "content": message
        });
    }
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.id = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        indicator.appendChild(dot);
    }
    chatContainer.appendChild(indicator);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Scroll chat to the bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message to backend
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (message) {
        // Clear input field
        userInput.value = '';
        
        // Add user message to chat
        addUserMessage(message);
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Call backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: conversationHistory.slice(0, -1) // Exclude the latest user message
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add response to chat
            addBotMessage(data.response);
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            addBotMessage("I'm sorry, I encountered an error processing your request. Please try again later.");
        }
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Focus input field when page loads
window.onload = function() {
    addBotMessage("Hello! I'm your financial assistant. How can I help you with investments, budgeting, or understanding financial concepts today?");
    userInput.focus();
};