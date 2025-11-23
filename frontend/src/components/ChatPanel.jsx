import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { sendChatMessage } from '../services/api';
import FileUpload from './FileUpload';

const ChatPanel = ({ onResponse, parties, setParties, onDocumentAnalysis }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you find the right mediator for your case. Just describe your needs in natural language, and I\'ll search our database for the best matches.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [partyInput, setPartyInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(input, messages);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.message
      };

      setMessages(prev => [...prev, assistantMessage]);

      onResponse(response);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addParty = () => {
    if (partyInput.trim() && !parties.includes(partyInput.trim())) {
      setParties([...parties, partyInput.trim()]);
      setPartyInput('');
    }
  };

  const removeParty = (party) => {
    setParties(parties.filter(p => p !== party));
  };

  return (
    <div className="flex flex-col">
      {/* Header - Neumorphism */}
      <div className="px-4 py-3 bg-neu-100 border-b border-neu-200">
        <h2 className="text-base font-semibold text-neu-800">
          AI Chat Assistant
        </h2>
        <p className="text-xs text-neu-600 mt-0.5">
          Powered by Hugging Face (100% FREE)
        </p>

        {/* Parties Input - Neumorphism */}
        <div className="mt-3">
          <label className="block text-[10px] font-semibold text-neu-700 mb-1 uppercase tracking-wide">
            Parties/Firms to Check for Conflicts:
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={partyInput}
              onChange={(e) => setPartyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addParty()}
              placeholder="e.g., BigLaw LLC"
              className="input-neu flex-1 text-xs py-1.5"
            />
            <button
              onClick={addParty}
              className="btn-neu text-xs px-3 py-1.5 whitespace-nowrap"
            >
              Add
            </button>
          </div>

          {parties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {parties.map((party, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-full shadow-neu-sm"
                >
                  {party}
                  <button
                    onClick={() => removeParty(party)}
                    className="hover:text-blue-600 transition-colors w-3 h-3 flex items-center justify-center rounded-full hover:bg-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages - Neumorphism bubbles */}
      <div className="px-4 py-3 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-xl break-words ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-neu'
                  : 'bg-neu-100 text-neu-800 shadow-neu'
              }`}
            >
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-neu-100 px-3 py-2 rounded-xl shadow-neu">
              <FaSpinner className="animate-spin text-blue-500 text-sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Neumorphism */}
      <div className="border-t border-neu-200 px-4 py-3 bg-neu-100">
        {/* Document Analyzer - Compact line above textarea */}
        <div className="mb-2">
          <FileUpload onAnalysisComplete={(analysis) => {
            // Update parties from document analysis
            if (analysis.opposingParties && analysis.opposingParties.length > 0) {
              const newParties = [...new Set([...parties, ...analysis.opposingParties])];
              setParties(newParties);
            }
            // Send analysis to parent component
            if (onDocumentAnalysis) {
              onDocumentAnalysis(analysis);
            }
            // Auto-populate chat with case details
            const caseTypeText = analysis.caseType ? `Case Type: ${analysis.caseType.replace(/_/g, ' ')}` : '';
            const jurisdictionText = analysis.jurisdiction
              ? `\nJurisdiction: ${analysis.jurisdiction.city ? analysis.jurisdiction.city + ', ' : ''}${analysis.jurisdiction.state}`
              : '';
            const autoMessage = `I've uploaded a document. ${caseTypeText}${jurisdictionText}\n\nCan you recommend suitable mediators?`;
            setInput(autoMessage);
          }} />
        </div>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your mediation needs... (e.g., 'I need a mediator for a tech IP dispute')"
            className="input-neu flex-1 resize-none text-xs leading-relaxed min-h-[60px]"
            rows="2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-neu-primary self-end px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
        <p className="text-[10px] text-neu-600 mt-2">
          <kbd className="px-1 py-0.5 bg-neu-200 rounded shadow-neu-inset text-neu-700 text-[9px]">Enter</kbd> send • <kbd className="px-1 py-0.5 bg-neu-200 rounded shadow-neu-inset text-neu-700 text-[9px]">Shift+Enter</kbd> new line
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
