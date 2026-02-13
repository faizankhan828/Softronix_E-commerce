import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AiChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! 👋 I\'m your AI assistant powered by Google Gemini. I\'m here to help you with any questions or tasks. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const GEMINI_API_KEY = '***REDACTED_GOOGLE_API_KEY_2***';
  // Using gemini-flash-latest as it is confirmed working and stable
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: input,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else if (data.error) {
        throw new Error(data.error.message || 'API returned an error');
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! 👋 I\'m your AI assistant powered by Google Gemini. I\'m here to help you with any questions or tasks. How can I assist you today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-blue-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-blue-500/50 transition-all group"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:text-blue-300 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-slate-300 font-medium text-xs sm:text-sm">Home</span>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/30">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                <span className="font-bold text-white text-xs sm:text-base">AI Assistant</span>
                <span className="hidden sm:inline px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">Pro</span>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="px-3 sm:px-5 py-1.5 sm:py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg sm:rounded-xl font-medium transition-all shadow-lg hover:shadow-red-500/50 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-base"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Messages Area */}
          <div className="h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)] overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl ${
                    message.role === 'user' 
                      ? 'bg-linear-to-br from-blue-600 to-cyan-600 shadow-blue-500/50' 
                      : 'bg-linear-to-br from-slate-700 to-slate-600 shadow-slate-900/50 border border-slate-600'
                  }`}>
                    {message.role === 'user' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  {/* Message Bubble */}
                  <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 shadow-xl ${
                    message.role === 'user'
                      ? 'bg-linear-to-br from-blue-600 to-cyan-600 text-white shadow-blue-500/30'
                      : 'bg-slate-700/50 text-slate-100 border border-slate-600/50 shadow-slate-900/30'
                  }`}>
                    {message.role === 'assistant' ? (
                      <div className="text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-white/10">
                      <p className={`text-[10px] sm:text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.role === 'assistant' && (
                        <span className="text-[10px] sm:text-xs text-slate-400 flex items-center space-x-1">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                          </svg>
                          <span>AI</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%]">
                  <div className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center bg-linear-to-br from-slate-700 to-slate-600 shadow-xl border border-slate-600">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 border border-slate-600/50 shadow-xl">
                    <div className="flex space-x-1.5 sm:space-x-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-xl p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 items-stretch sm:items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full px-3 sm:px-4 lg:px-5 py-3 sm:py-4 pr-12 sm:pr-16 rounded-xl sm:rounded-2xl border-2 border-slate-600 focus:border-blue-500 focus:ring-2 sm:focus:ring-4 focus:ring-blue-500/20 outline-none resize-none bg-slate-900/50 text-slate-100 placeholder-slate-400 transition-all shadow-inner text-sm sm:text-base"
                  rows={1}
                  disabled={isLoading}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 flex items-center space-x-2">
                  <span className="text-[10px] sm:text-xs text-slate-500">{input.length}/2000</span>
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-blue-500/50 disabled:shadow-none transform hover:scale-105 disabled:scale-100 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <span>Send</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[10px] sm:text-xs text-slate-400 flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Powered by Google Gemini AI</span>
              </p>
              <p className="text-[10px] sm:text-xs text-blue-400 font-medium">
                No login required ✨
              </p>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-blue-400">{messages.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Messages</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-cyan-400">∞</div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Unlimited</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg sm:rounded-xl p-2 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-green-400">24/7</div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
