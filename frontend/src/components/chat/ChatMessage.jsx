import { FaUser, FaRobot } from 'react-icons/fa';

/**
 * ChatMessage - Individual message with emotion indicator
 * DRY: Reusable component for all chat messages
 * Neomorphic design with emotion-based accents
 */
export default function ChatMessage({ message, emotion }) {
  const isUser = message.role === 'user';

  // Emotion color mapping
  const emotionColors = {
    positive: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
    negative: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
    neutral: { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' }
  };

  const emotionColor = emotionColors[emotion?.sentiment || 'neutral'];

  // Emotion emoji mapping
  const emotionEmojis = {
    joy: '😊',
    love: '❤️',
    surprise: '😮',
    anger: '😠',
    disgust: '🤢',
    fear: '😨',
    sadness: '😢',
    neutral: '😐'
  };

  const emoji = emotionEmojis[emotion?.emotion || 'neutral'];

  return (
    <div className={'flex mb-4 ' + (isUser ? 'justify-end' : 'justify-start')}>
      <div
        className="max-w-[80%] flex items-start space-x-3"
        style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: isUser
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
        >
          {isUser ? (
            <FaUser className="text-white text-sm" />
          ) : (
            <FaRobot className="text-white text-sm" />
          )}
        </div>

        {/* Message bubble */}
        <div
          className="rounded-2xl px-4 py-3 relative"
          style={{
            background: isUser ? '#FFFFFF' : emotionColor.bg,
            boxShadow: isUser
              ? '4px 4px 12px rgba(163, 177, 198, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.5)'
              : 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5), 0 0 0 1px ' + emotionColor.border + '20',
          }}
        >
          <p
            style={{
              fontSize: '0.9375rem',
              color: isUser ? '#1F2937' : emotionColor.text,
              lineHeight: '1.6',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </p>

          {/* Emotion indicator for AI responses */}
          {!isUser && emotion && emotion.confidence > 0.5 && (
            <div
              className="mt-2 pt-2"
              style={{
                borderTop: '1px solid ' + emotionColor.border + '30',
                fontSize: '0.75rem',
                color: emotionColor.text,
                opacity: 0.8,
              }}
            >
              <span title={'Emotion: ' + emotion.emotion + ' (' + (emotion.confidence * 100).toFixed(0) + '% confidence)'}>
                {emoji} {emotion.emotion}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
