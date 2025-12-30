import Header from '../components/Header';
import Footer from '../components/Footer';
import FeedbackForm from '../components/FeedbackForm';

const FeedbackPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neu-50 to-neu-100 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neu-800 mb-2">
              We Value Your Feedback
            </h1>
            <p className="text-neu-600">
              Your input helps us build a better platform for everyone.
            </p>
          </div>

          <FeedbackForm />

          {/* Additional Info */}
          <div className="mt-8 bg-neu-100 rounded-lg p-6 shadow-neu">
            <h3 className="text-lg font-semibold text-neu-800 mb-3">
              Other Ways to Reach Us
            </h3>
            <ul className="space-y-2 text-sm text-neu-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Report Data Issues:</strong> If you notice incorrect mediator information,
                  please use the "Mediator Data Issue" option above.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Feature Requests:</strong> Have an idea for a new feature?
                  We'd love to hear it!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>Bug Reports:</strong> Encountered a problem? Let us know so we can fix it quickly.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeedbackPage;
