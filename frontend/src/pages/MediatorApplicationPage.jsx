import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCopy, FaCheck } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CustomSelect from '../components/common/CustomSelect';
import SEO from '../components/SEO/SEO';

const MediatorApplicationPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedAppId, setSubmittedAppId] = useState(null); // drives success popup
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    applyingAs: 'individual',
    location: '',
    authorized: '',
    preferredState: '',
    preferredStateReason: '',
    practiceAreas: [],
    experience: '',
    disputeTypes: '',
    certifications: '',
    languages: [],
    comments: ''
  });

  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];

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
    // Clear error when user starts typing
    if (errorMessage) setErrorMessage('');
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
        const json = await response.json();
        const appId = json?.data?.applicationId || 'FM-UNKNOWN';

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          applyingAs: 'individual',
          location: '',
          authorized: '',
          preferredState: '',
          preferredStateReason: '',
          practiceAreas: [],
          experience: '',
          disputeTypes: '',
          certifications: '',
          languages: [],
          comments: ''
        });

        setSubmittedAppId(appId); // opens success popup
      } else {
        const errJson = await response.json().catch(() => ({}));
        setErrorMessage(errJson?.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      setErrorMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(submittedAppId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <SEO
        title="Join FairMediator - Mediator Application | FairMediator"
        description="Join our vetted network of mediators. Apply to be listed in our directory and connect with parties seeking qualified, unbiased mediators. AI conflict-of-interest screening included."
        keywords="mediator signup, join mediator network, mediator application, list your mediation practice"
        ogType="website"
      />

      {/* ── Success Popup ─────────────────────────────────────────────────── */}
      {submittedAppId && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => navigate('/')}
          />
          <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div
              className="bg-dark-neu-300 rounded-t-2xl sm:rounded-2xl shadow-dark-neu-lg w-full sm:max-w-md mx-auto flex flex-col overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 sm:p-8">
                {/* Icon + Title */}
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-3">
                    <FaCheckCircle className="text-2xl text-white" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Submitted successfully
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
                    We&apos;ve received your application{' '}
                    <span className="text-white font-semibold">(Ref: {submittedAppId})</span>.
                    Our team will review it and reply within 2 weeks.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-3 px-5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Done
                  </button>
                  <button
                    onClick={handleCopyRef}
                    className="flex-1 py-3 px-5 bg-dark-neu-400 hover:bg-dark-neu-500 text-white/80 hover:text-white text-sm font-semibold rounded-xl border border-dark-neu-500 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {copied ? (
                      <>
                        <FaCheck className="text-green-400" aria-hidden="true" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy aria-hidden="true" />
                        Copy reference
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          {/* Eyebrow */}
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full bg-white/10 text-gray-300 border border-white/20">
            Mediator Marketplace
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
            Impartiality is not a feature —<br className="hidden sm:block" />
            <span className="text-gray-300">it&apos;s the foundation.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            FairMediator exists because disputes deserve a neutral ground. Every mediator
            on our marketplace is vetted, screened for conflicts of interest, and committed
            to one thing: a fair process for all parties.
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              AI conflict-of-interest screening
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Manual review by our team
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Reply within 2 weeks
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Section title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Join Our Network of Mediators
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with clients seeking fair, unbiased mediation services.
            Fill out the application below to join FairMediator.
          </p>
        </div>


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
                  <CustomSelect
                    id="applyingAs"
                    value={formData.applyingAs}
                    onChange={(v) => setFormData(prev => ({ ...prev, applyingAs: v }))}
                    options={[
                      { value: 'individual', label: 'Individual Mediator' },
                      { value: 'firm', label: 'Mediation Firm' },
                    ]}
                    disabled={isLoading}
                    variant="gray"
                  />
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
                  <CustomSelect
                    id="authorized"
                    value={formData.authorized}
                    onChange={(v) => setFormData(prev => ({ ...prev, authorized: v }))}
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    placeholder="Select..."
                    disabled={isLoading}
                    variant="gray"
                  />
                </div>

                {/* Preferred State */}
                <div>
                  <label htmlFor="preferredState" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred State to Practice
                  </label>
                  <CustomSelect
                    id="preferredState"
                    value={formData.preferredState}
                    onChange={(v) => setFormData(prev => ({ ...prev, preferredState: v }))}
                    options={US_STATES}
                    placeholder="Select a state..."
                    disabled={isLoading}
                    variant="gray"
                  />
                </div>

                {/* Reason for preferred state */}
                <div>
                  <label htmlFor="preferredStateReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Why did you choose this state? <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="preferredStateReason"
                    name="preferredStateReason"
                    value={formData.preferredStateReason}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl shadow-neumorphic-inset
                             text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-blue-500 transition-all duration-200 resize-none"
                    placeholder="e.g. I have been practicing in Florida for 12 years and have deep connections with the local legal community..."
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
                className="w-full py-3 px-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white
                         font-medium rounded-xl shadow-neumorphic hover:shadow-neumorphic-hover
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:shadow-neumorphic focus:outline-none focus:ring-2
                         focus:ring-slate-600 focus:ring-offset-2"
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
