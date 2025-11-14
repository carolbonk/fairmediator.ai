import { FaRobot } from 'react-icons/fa';

/**
 * TypingIndicator - Animated typing indicator for AI responses
 * DRY: Reusable component with neomorphic design
 */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] flex items-start space-x-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          }}
        >
          <FaRobot className="text-white text-sm" />
        </div>

        {/* Typing animation */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center space-x-2"
          style={{
            background: '#F3F4F6',
            boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)',
          }}
        >
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              background: '#9CA3AF',
              animationDelay: '0ms',
              animationDuration: '1s'
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              background: '#9CA3AF',
              animationDelay: '200ms',
              animationDuration: '1s'
            }}
          />
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              background: '#9CA3AF',
              animationDelay: '400ms',
              animationDuration: '1s'
            }}
          />
        </div>
      </div>
    </div>
  );
}
