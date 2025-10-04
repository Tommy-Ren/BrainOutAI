import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface MemePopupProps {
  onClose: () => void;
}

const MemePopup: React.FC<MemePopupProps> = ({ onClose }) => {
  const memes = [
    "🧠 When someone asks 'What's 2+2?' and you start explaining quantum superposition...",
    "🤓 Me: *turns simple addition into a 47-step proof involving thermodynamics*",
    "📚 BrainOutAI: Making rocket science out of making toast since 2024",
    "🔬 'How do I tie my shoes?' - *proceeds to explain the molecular structure of shoelaces*",
    "⚡ Warning: May cause excessive use of words like 'furthermore' and 'heretofore'",
    "🎯 BrainOutAI: Where asking for the time gets you a lecture on relativity"
  ];

  const randomMeme = memes[Math.floor(Math.random() * memes.length)];

  return (
    <div className="meme-popup-overlay">
      <div className="meme-popup">
        <div className="meme-content">
          <h2>Welcome to BrainOutAI! 🧠</h2>
          <p className="meme-text">{randomMeme}</p>
          <p className="meme-subtitle">
            Ready to turn your simple questions into PhD dissertations?
          </p>
          <button onClick={onClose} className="meme-close-btn">
            Let's Over-Complicate Things! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMemePopup, setShowMemePopup] = useState(false);
  const [lastResponse, setLastResponse] = useState<{ question: string, response: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show meme popup on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('brainoutai-visited');
    if (!hasVisited) {
      setShowMemePopup(true);
      localStorage.setItem('brainoutai-visited', 'true');
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, aiMessage]);
      setLastResponse({ question: inputText, response: data.response });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm currently experiencing a quantum entanglement disruption in my neural pathways. Please ensure your Gemini API key is properly configured and try again.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const makeItHarder = async () => {
    if (!lastResponse || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/make-harder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion: lastResponse.question,
          originalResponse: lastResponse.response
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to make it harder');
      }

      const data = await response.json();

      const harderMessage: Message = {
        id: Date.now().toString(),
        text: data.response,
        isUser: false,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, harderMessage]);
      setLastResponse({ question: lastResponse.question, response: data.response });

    } catch (error) {
      console.error('Error making it harder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="app">
      {showMemePopup && <MemePopup onClose={() => setShowMemePopup(false)} />}

      <div className="chat-container">
        <div className="chat-header">
          <h1>🧠 BrainOutAI</h1>
          <p>Making simple questions unnecessarily complicated since 2024</p>
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to BrainOutAI! 🚀</h2>
              <p>Ask me anything, and I'll give you the most over-engineered answer possible.</p>
              <div className="example-questions">
                <p>Try asking:</p>
                <ul>
                  <li>"What's 2 + 2?"</li>
                  <li>"How do I make coffee?"</li>
                  <li>"What time is it?"</li>
                  <li>"How do I tie my shoes?"</li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.isUser ? 'user' : 'ai'}`}>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                {!message.isUser && (
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(message.text)}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai loading">
              <div className="message-content">
                <div className="thinking-animation">
                  <span>🧠</span>
                  <span>Overthinking your question</span>
                  <div className="dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {lastResponse && !isLoading && (
            <button
              className="make-harder-btn"
              onClick={makeItHarder}
              title="Make the last answer even more complicated"
            >
              🔥 Make It Even Harder!
            </button>
          )}

          <div className="input-box">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... I'll make it complicated! 🤓"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="send-btn"
            >
              🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
