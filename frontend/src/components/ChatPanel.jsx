import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPaperPlane } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../services/api';
import { withRetry } from '../utils/retryHelper';
import FileUpload from './FileUpload';
import Tooltip from './Tooltip';
import CircularLoader from './common/CircularLoader';

const ChatPanel = ({ onResponse, parties, setParties, onDocumentAnalysis }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('chat.greeting')
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [partyInput, setPartyInput] = useState('');
  const [lastFailedInput, setLastFailedInput] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getErrorMessage = (error) => {
    // Network errors
    if (error.message === 'Failed to fetch' || error.name === 'NetworkError') {
      return '🔌 ' + t('errors.networkError');
    }

    // API rate limiting
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return '⏱️ ' + t('errors.rateLimitError');
    }

    // Server errors
    if (error.message?.includes('500') || error.message?.includes('server error')) {
      return '🔧 ' + t('errors.serverError');
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return '⏰ ' + t('errors.timeoutError');
    }

    // Generic fallback
    return '❌ ' + t('errors.genericError');
  };

  const handleSend = async (messageToSend = null) => {
    const actualMessage = messageToSend || input.trim();
    if (!actualMessage || loading) return;

    const userMessage = { role: 'user', content: actualMessage };
    setMessages(prev => [...prev, userMessage]);

    // Only clear input if sending from input field
    if (!messageToSend) {
      setInput('');
    }

    setLoading(true);

    try {
      // Wrap API call with retry logic (max 2 retries, 1s delay)
      const sendChatWithRetry = withRetry(sendChatMessage, { retries: 2, delay: 1000 });
      const response = await sendChatWithRetry(actualMessage, messages);

      const assistantMessage = {
        role: 'assistant',
        content: response.message
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastFailedInput(null); // Clear failed input on success

      onResponse(response);
    } catch (error) {
      console.error('Chat error:', error);
      setLastFailedInput(actualMessage); // Store for retry
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getErrorMessage(error),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedInput) {
      handleSend(lastFailedInput);
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
        <h3 className="text-sm font-bold text-[#1E3A8A] mb-2">Describe your legal dispute</h3>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-neu-800">
            AI Chat Assistant
          </h2>
          <Tooltip text="Our AI assistant helps you describe your case and find the perfect mediator. Powered by Hugging Face - completely free!" />
        </div>
        <p className="text-xs text-neu-600 mt-0.5">
          Powered by Hugging Face (100% FREE)
        </p>

        {/* Parties Input - Neumorphism */}
        <div className="mt-3">
          <label className="block text-xs font-semibold text-neu-700 mb-1 uppercase tracking-wide">
            Parties/Firms to Check for Conflicts:
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={partyInput}
              onChange={(e) => setPartyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addParty()}
              placeholder="e.g., BigLaw LLC"
              className="input-neu flex-1 text-sm py-2 min-h-[44px]"
            />
            <button
              onClick={addParty}
              className="btn-neu text-sm px-4 py-2 whitespace-nowrap min-h-[44px] min-w-[44px]"
            >
              Add
            </button>
          </div>

          {parties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {parties.map((party, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-100 text-blue-800 rounded-full shadow-neu-sm min-h-[36px]"
                >
                  {party}
                  <button
                    onClick={() => removeParty(party)}
                    className="hover:text-blue-600 transition-colors w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200 text-base"
                    aria-label={`Remove ${party}`}
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
                  ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-neu'
                  : msg.isError
                  ? 'bg-red-50 text-red-800 shadow-neu border border-red-200'
                  : 'bg-neu-100 text-neu-800 shadow-neu'
              }`}
            >
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              {msg.isError && lastFailedInput && (
                <button
                  onClick={handleRetry}
                  className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {t('errors.retry')}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-neu-100 px-4 py-3 rounded-xl shadow-neu">
              <CircularLoader />
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
            className="input-neu flex-1 resize-none text-xs leading-relaxed min-h-[80px]"
            rows="3"
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
        <p className="text-xs text-neu-600 mt-2">
          <kbd className="px-1.5 py-0.5 bg-neu-200 rounded shadow-neu-inset text-neu-700 text-xs">Enter</kbd> send • <kbd className="px-1.5 py-0.5 bg-neu-200 rounded shadow-neu-inset text-neu-700 text-xs">Shift+Enter</kbd> new line
        </p>
      </div>
    </div>
  );
};

// PropTypes validation
ChatPanel.propTypes = {
  onResponse: PropTypes.func.isRequired,
  parties: PropTypes.arrayOf(PropTypes.string).isRequired,
  setParties: PropTypes.func.isRequired,
  onDocumentAnalysis: PropTypes.func
};

export default ChatPanel;
