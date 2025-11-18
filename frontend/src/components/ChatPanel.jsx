import React, { useState, useRef, useEffect } from 'react';
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
    <div className="flex flex-col h-full">
      {/* Header - Neumorphism */}
      <div className="px-6 py-5 bg-neu-100 border-b border-neu-200">
        <h2 className="text-xl font-semibold text-neu-800">
          AI Chat Assistant
        </h2>
        <p className="text-sm text-neu-600 mt-1">
          Powered by Hugging Face (100% FREE)
        </p>
        
        {/* Parties Input - Neumorphism */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-neu-700 mb-2 uppercase tracking-wide">
            Parties/Firms to Check for Conflicts:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={partyInput}
              onChange={(e) => setPartyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addParty()}
              placeholder="e.g., BigLaw LLC"
              className="input-neu flex-1 text-sm"
            />
            <button
              onClick={addParty}
              className="btn-neu text-sm px-4 whitespace-nowrap"
            >
              Add
            </button>
          </div>
          
          {parties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {parties.map((party, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full shadow-neu-sm"
                >
                  {party}
                  <button
                    onClick={() => removeParty(party)}
                    className="hover:text-blue-600 transition-colors ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Document Analyzer - Integrated with Chat */}
        <div className="mt-5 pt-5 border-t border-neu-200">
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
      </div>

      {/* Messages - Neumorphism bubbles */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-neu'
                  : 'bg-neu-100 text-neu-800 shadow-neu'
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-neu-100 px-4 py-3 rounded-2xl shadow-neu">
              <FaSpinner className="animate-spin text-blue-500 text-lg" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Neumorphism */}
      <div className="border-t border-neu-200 px-6 py-5 bg-neu-100">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your mediation needs... (e.g., 'I need a mediator for a tech IP dispute, neutral stance')"
            className="input-neu flex-1 resize-none text-[15px] leading-relaxed min-h-[80px]"
            rows="3"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-neu-primary self-end px-5 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="text-lg" />
          </button>
        </div>
        <p className="text-xs text-neu-600 mt-3">
          Press <kbd className="px-1.5 py-0.5 bg-neu-200 rounded shadow-neu-inset text-neu-700">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-neu-200 rounded shadow-neu-inset text-neu-700">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
