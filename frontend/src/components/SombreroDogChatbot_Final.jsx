import React, { useState, useRef, useEffect } from 'react';
import './SombreroDog_Final.css';
import dogImage from '../assets/sombrero-dog.png';

//SombreroDogChatbot is our method
const SombreroDogChatbot = () => {
  //isOpen --> checking if the button for chat is clicked
  const [isOpen, setIsOpen] = useState(false);
  //messages --> updating the messages within the chat, setting first chat message

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Me llamo Carlito. I can help answer your Spanish questions. What would you like to know?',
    },
  ]);

  const [inputValue, setInputValue] = useState('');

  //displays loading animation
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // System prompt with website knowledge
  const SYSTEM_PROMPT = `You are a helpful Spanish learning assistant for a Spanish learning website. You have two main roles:

1. WEBSITE NAVIGATION GUIDE:
Your name is Carlito! Help users navigate and use the website. Here's what the website offers:

PAGES:
- About Me Page: Introduction to the website and its purpose. Has a scrolling carousel format.
- Resources Page: Where users can upload and find learning materials
  * Upload quizzes (multiple choice, can be public or private)
  * Upload PDFs (study materials, can be public or private)
  * Upload videos or YouTube links (can be public or private)
  * Search/filter resources by type, name, or topic
  * View "My Resources" vs "All Resources"
  * Report inappropriate content
- Activities Page: Interactive learning games
  * Word Search: Find conjugated verbs
  * AI Conversation Bot: Practice Spanish conversations (5 exchanges with grammar feedback)
- Progress/History Page: Track your game statistics and learning progress
- Schedule Tutoring Page: Book tutoring sessions
- Settings Page: Customize your experience

FEATURES:
- All resources can be made public (everyone sees) or private (only you see)
- Resources have cards showing: name, author, topic, and action buttons
- Quizzes show number of questions and have a "Start" button
- PDFs have a "Download" button
- Videos have thumbnails and "Download" button
- You can report any inappropriate content
- Track how many times you've played each game

2. SPANISH LANGUAGE HELP:
Answer questions about Spanish grammar, vocabulary, conjugation, culture, etc.

Be friendly, encouraging, and use some Spanish phrases naturally. Keep responses concise (2-3 sentences max for navigation, slightly longer for Spanish explanations). If a user seems lost, proactively suggest relevant pages or features.`;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // TODO: Replace with your actual API endpoint
      // Option 1: Backend proxy (recommended)
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      //Option 2

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento! I am having trouble connecting!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick action buttons for common questions
  const quickActions = [
    "Give me some Spanish vocab words to memorize!",
    //"How do I upload a quiz?",
    //"Where are the games?",
    //"How do I make resources private?",
    "Show me Spanish verb conjugations"
  ];

  const handleQuickAction = (action) => {
    setInputValue(action);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        <img 
          src={dogImage} 
          alt="Spanish Helper Dog" 
          className="dog-image"
        />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="dog-avatar-small">
                <img 
                  src={dogImage} 
                  alt="Dog" 
                  className="dog-avatar-small-img"
                />
              </div>
              <h3>Chat with Carlito</h3>
            </div>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <img 
                      src={dogImage} 
                      alt="Dog" 
                      className="dog-avatar-message"
                    />
                  </div>
                )}
                <div className="message-content">{msg.content}</div>
                {msg.role === 'user' && (
                  <div className="message-avatar user-avatar">👤</div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-avatar">
                  <img 
                    src={dogImage} 
                    alt="Dog" 
                    className="dog-avatar-message"
                  />
                </div>
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            {/* Show quick actions only if this is the first message */}
            {messages.length === 1 && !isLoading && (
              <div className="quick-actions">
                <p className="quick-actions-label">Quick questions:</p>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="send-btn"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SombreroDogChatbot;

/* 
      // Option 2: Direct OpenAI API call (not recommended for production)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });
      */