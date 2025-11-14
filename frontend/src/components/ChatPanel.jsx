import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { sendChatMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ChatMessage from './chat/ChatMessage';
import TypingIndicator from './chat/TypingIndicator';
import UsageLimitBanner from './usage/UsageLimitBanner';

const ChatPanel = ({ onResponse, parties, setParties }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant powered by Meta Llama. I can help you find the right mediator for your case. Just describe your needs in natural language, and I\'ll search our database for the best matches.',
      emotion: { sentiment: 'neutral', emotion: 'neutral', confidence: 0 }
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [partyInput, setPartyInput] = useState('');
  const [usage, setUsage] = useState({ aiCallsToday: 0, aiCallLimit: 20 });
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

      // Update usage stats
      if (response.usage) {
        setUsage(response.usage);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        emotion: response.emotion?.assistant || { sentiment: 'neutral', emotion: 'neutral', confidence: 0 }
      };

      setMessages(prev => [...prev, assistantMessage]);
      onResponse(response);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.error || 'Sorry, I encountered an error. Please try again.';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        emotion: { sentiment: 'negative', emotion: 'sadness', confidence: 0 }
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
      </div>

      {/* Usage Limit Banner */}
      <div className="px-6 pt-4">
        <UsageLimitBanner
          type="aiCall"
          current={usage.aiCallsToday}
          limit={usage.aiCallLimit}
          onUpgrade={() => console.log('Navigate to upgrade page')}
        />
      </div>

      {/* Messages - DRY ChatMessage components */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.map((msg, idx) => (
          <div key={idx} className="animate-fade-in">
            <ChatMessage message={msg} emotion={msg.emotion} />
          </div>
        ))}

        {loading && <TypingIndicator />}
        
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
