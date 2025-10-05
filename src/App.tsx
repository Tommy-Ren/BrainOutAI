import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  files?: File[];
  reactions?: string[];
  isCached?: boolean;
}

interface SessionData {
  sessionId: string;
  queryCount: number;
  lastReset: number;
  history: Message[];
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
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isHistoryClosing, setIsHistoryClosing] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [panelOffset, setPanelOffset] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const trailIdRef = useRef<number>(0);
  const dragTimeoutRef = useRef<number | null>(null);

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

  // Session management constants
  const RATE_LIMIT = 10; // queries per hour
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  // Initialize or get session data
  const initializeSession = (): SessionData => {
    const stored = localStorage.getItem('brainoutai-session');
    const now = Date.now();

    if (stored) {
      const session: SessionData = JSON.parse(stored);
      // Reset count if window has passed
      if (now - session.lastReset > RATE_LIMIT_WINDOW) {
        session.queryCount = 0;
        session.lastReset = now;
      }
      return session;
    }

    // Create new session
    const newSession: SessionData = {
      sessionId: `session_${now}_${Math.random().toString(36).substring(2, 11)}`,
      queryCount: 0,
      lastReset: now,
      history: []
    };

    localStorage.setItem('brainoutai-session', JSON.stringify(newSession));
    return newSession;
  };

  // Check if user can make a query
  const canMakeQuery = (session: SessionData): boolean => {
    return session.queryCount < RATE_LIMIT;
  };

  // Get cached/fallback response
  const getFallbackResponse = (question: string): string => {
    const fallbacks = [
      `🤯 Server's having an existential crisis! But here's my cached wisdom: "${question}" requires a 47-dimensional analysis involving quantum mechanics, thermodynamics, and the philosophical implications of asking questions. The answer involves π, the speed of light, and probably some calculus. Trust me, it's complicated! 🧠`,
      `😵 API quota exceeded! But fear not - through advanced mathematical modeling and theoretical frameworks, "${question}" can be solved using a combination of differential equations, statistical analysis, and a deep understanding of the universe's fundamental constants. The solution is both elegant and unnecessarily complex! 🚀`,
      `🤖 Server busy mode activated! Your question "${question}" triggers a cascade of computational processes involving machine learning algorithms, neural networks, and quantum computing principles. The answer requires consideration of entropy, probability distributions, and the meaning of existence itself! 🔬`
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  // Reaction functions
  const addReaction = (messageId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const hasReaction = reactions.includes(reaction);
        return {
          ...msg,
          reactions: hasReaction
            ? reactions.filter(r => r !== reaction)
            : [...reactions, reaction]
        };
      }
      return msg;
    }));
  };

  // Share functions
  const shareToTwitter = (text: string) => {
    const tweetText = `Check out this hilariously over-complicated answer from BrainOutAI! 🧠\n\n"${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"\n\n#BrainOutAI #AI #OverComplicated`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank');
  };

  const shareToDiscord = (text: string) => {
    // Copy to clipboard for Discord sharing
    navigator.clipboard.writeText(`Check out this hilariously over-complicated answer from BrainOutAI! 🧠\n\n"${text}"\n\nTry it yourself at: ${window.location.href}`);
    alert('Copied to clipboard! Paste it in Discord 📋');
  };

  const shareToReddit = (text: string) => {
    const title = 'This AI makes simple questions unnecessarily complicated 🤯';
    const redditText = `Check out this hilariously over-complicated answer from BrainOutAI!\n\n"${text}"\n\nTry it yourself at: ${window.location.href}`;
    const url = `https://reddit.com/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(redditText)}`;
    window.open(url, '_blank');
  };

  // History panel functions
  const toggleHistory = () => {
    if (showHistory) {
      closeHistory();
    } else {
      setShowHistory(true);
      setIsHistoryClosing(false);
    }
  };

  const closeHistory = () => {
    setIsHistoryClosing(true);
    setTimeout(() => {
      setShowHistory(false);
      setIsHistoryClosing(false);
    }, 300); // Match animation duration
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Drag handlers for history panel
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setPanelOffset(0);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setPanelOffset(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged down more than 100px, close the panel
    if (panelOffset > 100) {
      closeHistory();
    } else {
      // Snap back to original position
      setPanelOffset(0);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setLastResponse(null);
    if (sessionData) {
      const clearedSession = {
        ...sessionData,
        history: []
      };
      setSessionData(clearedSession);
      localStorage.setItem('brainoutai-session', JSON.stringify(clearedSession));
    }
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

  // Initialize session and show meme popup on first visit only
  useEffect(() => {
    const session = initializeSession();
    setSessionData(session);
    setShowMemePopup(true);
  }, []);

  // Cleanup drag timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  // Add global event listeners for drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e as any);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e as any);
    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStartY, panelOffset]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || isLoading) return;

    // Ensure session is initialized
    const currentSession = sessionData || initializeSession();
    if (!sessionData) {
      setSessionData(currentSession);
    }

    // Check rate limiting
    if (!canMakeQuery(currentSession)) {
      setIsRateLimited(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText || (uploadedFiles.length > 0 ? `Uploaded ${uploadedFiles.length} file(s)` : ''),
        isUser: true,
        timestamp: new Date().toISOString(),
        files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
      };

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getFallbackResponse(userMessage.text),
        isUser: false,
        timestamp: new Date().toISOString(),
        isCached: true
      };

      setMessages(prev => [...prev, userMessage, fallbackResponse]);
      setInputText('');
      setUploadedFiles([]);

      // Update session data even for fallback responses
      const updatedSession = {
        ...currentSession,
        queryCount: currentSession.queryCount + 1,
        history: [...currentSession.history, userMessage, fallbackResponse]
      };

      setSessionData(updatedSession);
      localStorage.setItem('brainoutai-session', JSON.stringify(updatedSession));

      return;
    }

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

      // Update session data - increment query count
      const updatedSession = {
        ...currentSession,
        queryCount: currentSession.queryCount + 1,
        history: [...currentSession.history, userMessage, aiMessage]
      };

      setSessionData(updatedSession);
      localStorage.setItem('brainoutai-session', JSON.stringify(updatedSession));

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

    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }

    // Only activate if we have files being dragged
    if (e.dataTransfer.types.includes('Files')) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use a small timeout to prevent flickering when moving between child elements
    dragTimeoutRef.current = window.setTimeout(() => {
      setDragActive(false);
    }, 50);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear timeout if we're still dragging over the area
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear any timeout and immediately deactivate
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
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

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop
      mediaRecorderRef.current?.stop();
      // stream tracks will be stopped in onstop()
      return;
    }

    try {
      // Ask for the mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // Pick a safe mime type
      const mime =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/ogg'; // Safari fallback (no iOS recording support for MediaRecorder)

      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;

      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        // build the final blob
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        setAudioBlob(blob);

        // fully release mic
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;

        setIsRecording(false);
      };

      mr.start();        // start recording
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Please allow microphone access to record audio.');
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
          <div className="header-content">
            <h1>🧠 BrainOutAI</h1>
            <p>Making simple questions unnecessarily complicated</p>
          </div>
          <div className="header-controls">
            <button
              className="history-btn"
              onClick={toggleHistory}
              title="View conversation history"
            >
              📚 History
            </button>
            {sessionData && (
              <div className="rate-limit-indicator">
                <span className={sessionData.queryCount >= RATE_LIMIT ? 'limit-reached' : ''}>
                  {sessionData.queryCount}/{RATE_LIMIT} queries
                </span>
                {sessionData.queryCount >= RATE_LIMIT && (
                  <span className="limit-warning">⚠️ Rate limited</span>
                )}
              </div>
            )}
          </div>
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
                      <div key={index} className={`message-file ${getFilePreview(file) ? 'image-file' : 'non-image-file'}`}>
                        {getFilePreview(file) ? (
                          <>
                            <img src={getFilePreview(file)!} alt={file.name} className="message-file-thumbnail" />
                            <span className="message-file-name">{file.name}</span>
                          </>
                        ) : (
                          <>
                            <div className="message-file-icon">{getFileIcon(file)}</div>
                            <span className="message-file-name">{file.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="message-text">{message.text}</div>
                {!message.isUser && (
                  <div className="message-actions">
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(message.text)}
                      title="Copy to clipboard"
                    >
                      copy
                    </button>

                    {/* Reaction buttons */}
                    <div className="reaction-buttons">
                      <button
                        className={`reaction-btn ${message.reactions?.includes('😆') ? 'active' : ''}`}
                        onClick={() => addReaction(message.id, '😆')}
                        title="Funny"
                      >
                        😆 {message.reactions?.filter(r => r === '😆').length || ''}
                      </button>
                      <button
                        className={`reaction-btn ${message.reactions?.includes('🤯') ? 'active' : ''}`}
                        onClick={() => addReaction(message.id, '🤯')}
                        title="Mind blown"
                      >
                        🤯 {message.reactions?.filter(r => r === '🤯').length || ''}
                      </button>
                      <button
                        className={`reaction-btn ${message.reactions?.includes('🤔') ? 'active' : ''}`}
                        onClick={() => addReaction(message.id, '🤔')}
                        title="Thinking"
                      >
                        🤔 {message.reactions?.filter(r => r === '🤔').length || ''}
                      </button>
                    </div>

                    {/* Share buttons */}
                    <div className="share-buttons">
                      <button
                        className="share-btn facebook"
                        onClick={() => shareToTwitter(message.text)}
                        title="Share to Facebook"
                      >
                        <img src="/icons/facebook.svg" alt="Facebook" className="share-icon" />
                      </button>
                      <button
                        className="share-btn discord"
                        onClick={() => shareToDiscord(message.text)}
                        title="Share to Discord"
                      >
                        <img src="/icons/discord.svg" alt="Discord" className="share-icon" />
                      </button>
                      <button
                        className="share-btn reddit"
                        onClick={() => shareToReddit(message.text)}
                        title="Share to Reddit"
                      >
                        <img src="/icons/reddit.svg" alt="Reddit" className="share-icon" />
                      </button>
                    </div>

                    {message.isCached && (
                      <span className="cached-indicator" title="Cached response due to rate limiting">
                        📦 Cached
                      </span>
                    )}
                  </div>
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

        {/* History Panel */}
        {showHistory && sessionData && (
          <div
            className={`history-panel ${isHistoryClosing ? 'closing' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
              transform: `translateX(-50%) translateY(${panelOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <div
              className="history-header"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div className="drag-handle">
                <div className="drag-indicator"></div>
              </div>
              <div className="history-header-content">
                <h3>📚 Conversation History</h3>
                <div className="history-controls">
                  <button onClick={clearHistory} className="clear-history-btn">
                    🗑️ Clear
                  </button>
                  <button onClick={closeHistory} className="close-history-btn">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div className="history-content">
              {messages.length === 0 ? (
                <p className="no-history">No conversation history yet. Start chatting to see your history here!</p>
              ) : (
                <div className="history-messages">
                  {messages.map((msg, index) => {
                    const isExpanded = expandedMessages.has(msg.id);
                    const shouldTruncate = msg.text.length > 150;
                    const displayText = shouldTruncate && !isExpanded
                      ? `${msg.text.substring(0, 150)}...`
                      : msg.text;

                    return (
                      <div key={`history-${index}`} className={`history-message ${msg.isUser ? 'user' : 'ai'}`}>
                        <div className="history-message-content">
                          <span className="history-timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                          <div className="history-text">
                            {displayText}
                          </div>
                          {shouldTruncate && (
                            <button
                              className="expand-btn"
                              onClick={() => toggleMessageExpansion(msg.id)}
                            >
                              {isExpanded ? '📄 Show Less' : '📖 Show More'}
                            </button>
                          )}
                          {msg.isCached && (
                            <span className="history-cached">📦 Cached</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="input-container"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
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
              onClick={toggleRecording}
              aria-pressed={isRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              title={isRecording ? 'Stop recording' : 'Record voice'}
              disabled={isLoading}
              className="mic-btn"
            >
              <img
                src={isRecording ? './public/record-btn.png' : './public/mic-btn.png'}  
                alt={isRecording ? '■' : '🎤'}
                className="mic-icon"
              />
            </button>
            <button
              onClick={sendMessage}
              disabled={(!inputText.trim() && uploadedFiles.length === 0) || isLoading}
              className="send-btn"
            >
              <img
                src="./public/send-btn.png"
                alt="→"
                className="send-icon"
              />
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
