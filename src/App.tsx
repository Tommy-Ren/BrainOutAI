import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  files?: File[];
}

interface MemePopupProps {
  onClose: () => void;
}

const MemePopup: React.FC<MemePopupProps> = ({ onClose }) => {
  const [randomMeme, setRandomMeme] = useState<string>('');

  const memes = [
    "🧠 When someone asks 'What's 1+1?' and you start explaining quantum superposition...",
    "🤓 Me: *turns simple addition into a 47-step proof involving thermodynamics*",
    "📚 BrainOutAI: Making rocket science out of making toast since 2024",
    "🔬 'How do I tie my shoes?' - *proceeds to explain the molecular structure of shoelaces*",
    "⚡ Warning: May cause excessive use of words like 'furthermore' and 'heretofore'",
    "🎯 BrainOutAI: Where asking for the time gets you a lecture on relativity"
  ];

  useEffect(() => {
    setRandomMeme(memes[Math.floor(Math.random() * memes.length)]);
  }, []);

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
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);
  const [backgroundGradient, setBackgroundGradient] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [cursorTrails, setCursorTrails] = useState<Array<{ id: number, x: number, y: number }>>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const trailIdRef = useRef<number>(0);

  // Generate random gradient function
  const generateRandomGradient = (darkMode: boolean = true) => {
    const darkGradients = [
      'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
      'linear-gradient(135deg, #0f0f0f 0%, #2d1b69 50%, #11998e 100%)',
      'linear-gradient(135deg, #1a1a1a 0%, #2c1810 50%, #8b4513 100%)',
      'linear-gradient(135deg, #0f0f0f 0%, #1e3c72 50%, #2a5298 100%)',
      'linear-gradient(135deg, #1a1a1a 0%, #4a148c 50%, #7b1fa2 100%)',
      'linear-gradient(135deg, #0f0f0f 0%, #134e5e 50%, #71b280 100%)',
      'linear-gradient(135deg, #1a1a1a 0%, #5c258d 50%, #4389a2 100%)',
      'linear-gradient(135deg, #0f0f0f 0%, #2c3e50 50%, #34495e 100%)',
      'linear-gradient(135deg, #1a1a1a 0%, #8e44ad 50%, #3498db 100%)',
      'linear-gradient(135deg, #0f0f0f 0%, #e74c3c 20%, #8e44ad 100%)'
    ];

    const lightGradients = [
      'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      'linear-gradient(135deg, #e3ffe7 0%, #d9e7ff 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #e0c3fc 0%, #9bb5ff 100%)',
      'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
      'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
    ];

    const gradientOptions = darkMode ? darkGradients : lightGradients;
    const randomIndex = Math.floor(Math.random() * gradientOptions.length);
    return gradientOptions[randomIndex];
  };

  // Pool of example questions
  const questionPool = [
    "What's 1 + 1?",
    "How do I make coffee?",
    "What time is it?",
    "How do I tie my shoes?",
    "What's 2 + 2?",
    "How do I boil water?",
    "What is gravity?",
    "How do I open a door?",
    "What is the color blue?",
    "How do I breathe?",
    "What is a circle?",
    "How do I walk?",
    "What is light?",
    "How do I count to 10?",
    "What is a sandwich?",
    "How do I turn on a light?",
    "What is rain?",
    "How do I sit down?",
    "What is a book?",
    "How do I say hello?",
    "What is sleep?",
    "How do I write my name?",
    "What is a tree?",
    "How do I clap my hands?",
    "What is the sun?",
    "How do I smile?",
    "What is water?",
    "How do I blink?",
    "What is a cat?",
    "How do I wave goodbye?"
  ];

  // Generate random questions and background gradient on component mount
  useEffect(() => {
    const getRandomQuestions = () => {
      const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
    };

    setRandomQuestions(getRandomQuestions());
    setBackgroundGradient(generateRandomGradient(isDarkMode));
  }, []);

  // Cursor trail effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = {
        id: trailIdRef.current++,
        x: e.clientX,
        y: e.clientY
      };

      setCursorTrails(prev => [...prev, newTrail]);

      // Remove trail after animation
      setTimeout(() => {
        setCursorTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
      }, 800);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setBackgroundGradient(generateRandomGradient(newMode));
  };

  // Show meme popup on first visit only
  useEffect(() => {
    setShowMemePopup(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText || (uploadedFiles.length > 0 ? `Uploaded ${uploadedFiles.length} file(s)` : ''),
      isUser: true,
      timestamp: new Date().toISOString(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      let response;

      if (userMessage.files && userMessage.files.length > 0) {
        // Handle file upload with FormData
        const formData = new FormData();
        formData.append('message', inputText || 'Please analyze these files');
        userMessage.files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
        formData.append('fileCount', userMessage.files.length.toString());

        response = await fetch('/api/chat-with-files', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Handle text-only message
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: inputText }),
        });
      }

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
        text: "I apologize, that's beyond my current scope. Let's talk about something else.",
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

  const handleExampleClick = (question: string) => {
    setInputText(question);
    // Small delay to show the question in the input, then send it
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: question,
        isUser: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      // Send the message to the API
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to get response');
          }
          return response.json();
        })
        .then(data => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.response,
            isUser: false,
            timestamp: data.timestamp
          };

          setMessages(prev => [...prev, aiMessage]);
          setLastResponse({ question: question, response: data.response });
        })
        .catch(error => {
          console.error('Error sending message:', error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I apologize, but I'm currently experiencing a quantum entanglement disruption in my neural pathways. Please ensure your Gemini API key is properly configured and try again.",
            isUser: false,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, errorMessage]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // File upload handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragActive to false if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'video/mov', 'video/avi',
      'audio/mp3', 'audio/wav',
      'application/pdf'
    ];

    const validFiles = files.filter(file =>
      supportedTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.mov') ||
      file.name.toLowerCase().endsWith('.avi')
    );

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`} style={{ background: backgroundGradient }}>
      {/* Cursor trails */}
      {cursorTrails.map(trail => (
        <div
          key={trail.id}
          className={`cursor-trail ${isDarkMode ? 'dark-trail' : 'light-trail'}`}
          style={{
            left: trail.x - 5,
            top: trail.y - 5,
          }}
        />
      ))}

      {showMemePopup && <MemePopup onClose={() => setShowMemePopup(false)} />}

      {/* Mode toggle button */}
      <button
        className="mode-toggle"
        onClick={toggleMode}
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className="chat-container">
        <div className="chat-header">
          <h1>🧠 BrainOutAI</h1>
          <p>Making simple questions unnecessarily complicated</p>
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to BrainOutAI! 🚀</h2>
              <p>Ask me anything, and I'll give you the most over-engineered answer possible.</p>
              <div className="example-questions">
                <p>Try asking:</p>
                <ul>
                  {randomQuestions.map((question, index) => (
                    <li
                      key={index}
                      onClick={() => handleExampleClick(question)}
                      className="clickable-question"
                    >
                      "{question}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.isUser ? 'user' : 'ai'}`}>
              <div className="message-content">
                {message.files && message.files.length > 0 && (
                  <div className="message-files">
                    {message.files.map((file, index) => (
                      <div key={index} className="message-file">
                        {getFilePreview(file) ? (
                          <img src={getFilePreview(file)!} alt={file.name} className="message-file-thumbnail" />
                        ) : (
                          <div className="message-file-icon">{getFileIcon(file)}</div>
                        )}
                        <span className="message-file-name">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="message-text">{message.text}</div>
                {!message.isUser && (
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(message.text)}
                    title="Copy to clipboard"
                  >
                    copy
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

          {/* File previews */}
          {uploadedFiles.length > 0 && (
            <div className="file-previews">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-preview">
                  {getFilePreview(file) ? (
                    <img src={getFilePreview(file)!} alt={file.name} className="file-thumbnail" />
                  ) : (
                    <div className="file-icon">{getFileIcon(file)}</div>
                  )}
                  <span className="file-name">{file.name}</span>
                  <button
                    className="remove-file-btn"
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`input-box ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={dragActive ? "Drop files here... 📎" : "Ask me anything... I'll make it complicated! 🤓"}
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={(!inputText.trim() && uploadedFiles.length === 0) || isLoading}
              className="send-btn"
            >
              →
            </button>
          </div>

          {dragActive && (
            <div className="drag-overlay">
              <div className="drag-message">
                <span className="drag-icon">📎</span>
                <p>Drop your files here!</p>
                <small>Supports: Images, Videos, Audio, PDFs</small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App
