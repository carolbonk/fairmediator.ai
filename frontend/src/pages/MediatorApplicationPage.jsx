import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MediatorApplicationPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    applyingAs: 'individual',
    location: '',
    authorized: '',
    preferredState: '',
    practiceAreas: [],
    experience: '',
    disputeTypes: '',
    certifications: '',
    languages: [],
    comments: ''
  });

  const practiceAreaOptions = [
    'Divorce & Family Law',
    'Real Estate',
    'Business & Commercial',
    'Employment',
    'Personal Injury',
    'Probate & Estate',
    'Construction',
    'Insurance',
    'Intellectual Property',
    'Environmental',
    'Healthcare',
    'Securities',
    'Other'
  ];

  const languageOptions = [
    'English',
    'Spanish',
    'French',
    'German',
    'Mandarin',
    'Cantonese',
    'Portuguese',
    'Italian',
    'Arabic',
    'Russian',
    'Japanese',
    'Korean',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setErrorMessage('Please fill in all required fields (name and email)');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    if (formData.practiceAreas.length === 0) {
      setErrorMessage('Please select at least one practice area');
      return false;
    }

    if (formData.languages.length === 0) {
      setErrorMessage('Please select at least one language');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/mediators/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMessage('Thank you for your application! We will review your information and contact you soon.');
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          applyingAs: 'individual',
          location: '',
          authorized: '',
          preferredState: '',
          practiceAreas: [],
          experience: '',
          disputeTypes: '',
          certifications: '',
          languages: [],
          comments: ''
        });

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      setErrorMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Join Our Network of Mediators
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with clients seeking fair, unbiased mediation services.
            Fill out the application below to join FairMediator.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Application Form Card */}
        <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    placeholder="John"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    placeholder="Doe"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    placeholder="john.doe@example.com"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Applying As */}
                <div>
                  <label htmlFor="applyingAs" className="block text-sm font-medium text-gray-700 mb-2">
                    Applying As
                  </label>
                  <select
                    id="applyingAs"
                    name="applyingAs"
                    value={formData.applyingAs}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    disabled={isLoading}
                  >
                    <option value="individual">Individual Mediator</option>
                    <option value="firm">Mediation Firm</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location (City, State)
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    placeholder="Miami, FL"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Professional Information</h2>

              <div className="space-y-5">
                {/* Work Authorization */}
                <div>
                  <label htmlFor="authorized" className="block text-sm font-medium text-gray-700 mb-2">
                    Are you authorized to work in the US?
                  </label>
                  <select
                    id="authorized"
                    name="authorized"
                    value={formData.authorized}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    disabled={isLoading}
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Preferred State */}
                <div>
                  <label htmlFor="preferredState" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred State to Practice
                  </label>
                  <input
                    type="text"
                    id="preferredState"
                    name="preferredState"
                    value={formData.preferredState}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    placeholder="Florida"
                    disabled={isLoading}
                  />
                </div>

                {/* Practice Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Practice Areas <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-gray-100 rounded-xl shadow-neumorphic-inset p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {practiceAreaOptions.map(area => (
                      <label key={area} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={area}
                          checked={formData.practiceAreas.includes(area)}
                          onChange={(e) => handleCheckboxChange(e, 'practiceAreas')}
                          className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Years of Experience */}
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200"
                    placeholder="10"
                    min="0"
                    disabled={isLoading}
                  />
                </div>

                {/* Dispute Types */}
                <div>
                  <label htmlFor="disputeTypes" className="block text-sm font-medium text-gray-700 mb-2">
                    Types of Disputes Handled
                  </label>
                  <textarea
                    id="disputeTypes"
                    name="disputeTypes"
                    value={formData.disputeTypes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200 resize-none"
                    placeholder="Civil, commercial, family law..."
                    disabled={isLoading}
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications & Credentials
                  </label>
                  <textarea
                    id="certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200 resize-none"
                    placeholder="List any relevant certifications, licenses, or credentials..."
                    disabled={isLoading}
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Languages Spoken <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-gray-100 rounded-xl shadow-neumorphic-inset p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                    {languageOptions.map(language => (
                      <label key={language} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={language}
                          checked={formData.languages.includes(language)}
                          onChange={(e) => handleCheckboxChange(e, 'languages')}
                          className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-gray-700">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments or Information
                  </label>
                  <textarea
                    id="comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200 resize-none"
                    placeholder="Any additional information you'd like to share..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white
                         font-medium rounded-xl shadow-neumorphic hover:shadow-neumorphic-hover
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:shadow-neumorphic focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting Application...
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Privacy Notice */}
        <div className="text-center text-sm text-gray-600 mb-8">
          <p>
            By submitting this application, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MediatorApplicationPage;
