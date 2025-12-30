import { useState } from 'react';

/**
 * Netlify Forms - Feedback Component
 * Free tier: 100 submissions/month
 * No backend needed - Netlify handles form submissions automatically!
 */
const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedbackType: 'general',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Netlify automatically detects forms with data-netlify="true"
      // and creates a serverless endpoint for them
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'feedback',
          ...formData
        }).toString()
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', feedbackType: 'general', message: '' });

        // Reset success message after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-neu-100 rounded-lg p-6 shadow-neu max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-neu-800 mb-2">Send Us Feedback</h2>
      <p className="text-sm text-neu-600 mb-4">
        Help us improve FairMediator! Report issues, suggest features, or share your experience.
      </p>

      <form
        name="feedback"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
      >
        {/* Hidden field for Netlify Forms */}
        <input type="hidden" name="form-name" value="feedback" />

        {/* Honeypot field for spam prevention */}
        <p className="hidden">
          <label>
            Don't fill this out if you're human: <input name="bot-field" />
          </label>
        </p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neu-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-neu w-full text-sm"
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neu-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-neu w-full text-sm"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Feedback Type */}
          <div>
            <label htmlFor="feedbackType" className="block text-sm font-medium text-neu-700 mb-1">
              Feedback Type
            </label>
            <select
              id="feedbackType"
              name="feedbackType"
              value={formData.feedbackType}
              onChange={handleChange}
              className="input-neu w-full text-sm"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="data-issue">Mediator Data Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-neu-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="4"
              className="input-neu w-full text-sm resize-none"
              placeholder="Tell us what's on your mind..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="btn-neu-primary w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Sending...' : 'Send Feedback'}
          </button>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
              Thank you! Your feedback has been received.
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm">
              Oops! Something went wrong. Please try again.
            </div>
          )}
        </div>
      </form>

      <p className="text-xs text-neu-600 mt-4">
        This form is powered by Netlify Forms (100% free, 100 submissions/month)
      </p>
    </div>
  );
};

export default FeedbackForm;
