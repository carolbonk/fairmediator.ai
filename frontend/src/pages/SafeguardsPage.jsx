import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaChartLine, FaBalanceScale, FaDollarSign, FaDatabase, FaShieldAlt, FaAward, FaBolt, FaUsers, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import SEO from '../components/SEO/SEO';

const SafeguardsPage = () => {
  const [activeTab, setActiveTab] = useState('ethics');
  const { t } = useTranslation();

  const standards = t('safeguards.page.ethics.standards', { returnObjects: true });
  const aiFeatures = t('safeguards.page.ai.features', { returnObjects: true });
  const aiFeatureIcons = [FaProjectDiagram, FaChartLine, FaBalanceScale];
  const costApis = t('safeguards.page.ai.costApis', { returnObjects: true });
  const dataSources = t('safeguards.page.ai.dataSources', { returnObjects: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <SEO
        title="Safeguards"
        description="AI safeguards for secure mediation. SafeGate Protocol with 94% accuracy, conflict detection, and autonomous moderation to protect every dispute resolution."
        keywords={['mediation safeguards', 'AI conflict detection', 'secure mediation', 'mediator screening', 'dispute resolution safety']}
      />
      <Header />

      {/* Hero Section - Card-Based Design */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('safeguards.page.hero.title')}
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              {t('safeguards.page.hero.subtitle')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Card 1: SafeGate Protocol */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaShieldAlt className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                {t('safeguards.page.hero.safegate.title')}
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                {t('safeguards.page.hero.safegate.description')}
              </p>
            </div>

            {/* Card 2: Detection Accuracy */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaAward className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                {t('safeguards.page.hero.accuracy.title')}
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                {t('safeguards.page.hero.accuracy.description')}
              </p>
            </div>

            {/* Card 3: Response Time */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaBolt className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                {t('safeguards.page.hero.response.title')}
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                {t('safeguards.page.hero.response.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex gap-4 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('ethics')}
            className={`px-6 py-3 font-semibold transition-all duration-200 ${
              activeTab === 'ethics'
                ? 'border-b-4 border-gray-600 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('safeguards.page.tabs.ethics')}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 font-semibold transition-all duration-200 ${
              activeTab === 'ai'
                ? 'border-b-4 border-gray-600 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('safeguards.page.tabs.ai')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Ethics Tab */}
        {activeTab === 'ethics' && (
          <>
            {/* Protection Section */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                  {t('safeguards.page.ethics.govTitle')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('safeguards.page.ethics.govSubtitle')}
                </p>
              </div>

              {/* SafeGate Card */}
              <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 mb-6 hover:shadow-neumorphic-hover transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FaShieldAlt className="text-xl text-gray-600" />
                  </span>
                  {t('safeguards.page.ethics.safegateTitle')}
                </h3>
                <div className="text-gray-600 space-y-4">
                  <p>{t('safeguards.page.ethics.safegateOnLoop')}</p>
                  <p>{t('safeguards.page.ethics.safegateProprietary')}</p>
                  <div className="bg-white rounded-xl p-4 my-4 shadow-inner">
                    <p className="text-sm text-gray-700 mb-2"><strong>{t('safeguards.page.ethics.activeIntercept')}:</strong> {t('safeguards.page.ethics.activeInterceptDesc')}</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>{t('safeguards.page.ethics.brake')}:</strong> {t('safeguards.page.ethics.brakeDesc')}</p>
                    <p className="text-sm text-gray-700"><strong>{t('safeguards.page.ethics.powerBalance')}:</strong> {t('safeguards.page.ethics.powerBalanceDesc')}</p>
                  </div>
                  <p className="text-sm italic text-gray-500">{t('safeguards.page.ethics.technicalNote')}</p>
                </div>
              </div>

              {/* Human Mediator Card */}
              <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FaUsers className="text-xl text-gray-600" />
                  </span>
                  {t('safeguards.page.ethics.humanTitle')}
                </h3>
                <div className="text-gray-600 space-y-4">
                  <p>
                    {t('safeguards.page.ethics.humanMediatorText1')} <strong className="text-gray-800 font-semibold">{t('safeguards.page.ethics.thirdParty')}</strong> {t('safeguards.page.ethics.humanMediatorText2')} <strong className="text-gray-800 font-semibold">{t('safeguards.page.ethics.fourthParty')}</strong> {t('safeguards.page.ethics.humanMediatorText3')} <strong className="text-gray-800 font-semibold">{t('safeguards.page.ethics.virtualFacilitator')}</strong>{t('safeguards.page.ethics.humanMediatorText4')} <strong className="text-gray-800 font-semibold">{t('safeguards.page.ethics.fifthParty')}</strong>.
                  </p>
                  <p>
                    <strong className="text-gray-800 font-semibold">{t('safeguards.page.ethics.ourRole')}:</strong> {t('safeguards.page.ethics.ourRoleDesc')}
                  </p>
                  <p>
                    <strong className="text-gray-800 font-semibold">{t('safeguards.page.ethics.aiRole')}:</strong> {t('safeguards.page.ethics.aiRoleDesc')}
                  </p>
                  <p className="text-sm italic text-gray-500">{t('safeguards.page.ethics.humanMediatorFunFact')}</p>
                </div>
              </div>
            </section>

            {/* Standards Grid */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                  {t('safeguards.page.ethics.standardsTitle')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('safeguards.page.ethics.standardsSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(standards) && standards.map((standard, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-2xl shadow-neumorphic p-6 hover:shadow-neumorphic-hover transition-all duration-200 hover:-translate-y-1"
                  >
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      {standard.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3 italic">
                      {standard.description}
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {standard.practice}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Warning Alert */}
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-xl shadow-neumorphic p-6 mb-16">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-600" />
                {t('safeguards.page.ethics.warningTitle')}
              </h3>
              <div className="text-gray-700 space-y-3 text-sm">
                <p>{t('safeguards.page.ethics.warningPara1')}</p>
                <p>
                  <strong className="font-semibold">{t('safeguards.page.ethics.warningPara2Label')}</strong> {t('safeguards.page.ethics.warningPara2')}
                </p>
                <p>
                  <strong className="font-semibold">{t('safeguards.page.ethics.warningPara3Label')}</strong> {t('safeguards.page.ethics.warningPara3')}
                </p>
                <p className="text-xs italic text-gray-600 mt-4">{t('safeguards.page.ethics.warningTranslation')}</p>
              </div>
            </div>
          </>
        )}

        {/* AI Intelligence Tab */}
        {activeTab === 'ai' && (
          <>
            <section className="mb-12">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                  {t('safeguards.page.ai.title')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('safeguards.page.ai.subtitle')}
                </p>
              </div>

              <div className="space-y-8">
                {Array.isArray(aiFeatures) && aiFeatures.map((feature, index) => {
                  const IconComponent = aiFeatureIcons[index];
                  return (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300"
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <IconComponent className="text-4xl text-gray-500 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-base text-gray-600 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                    <div className="bg-white rounded-xl p-6 mb-4 shadow-inner">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        {t('safeguards.page.ai.technicalDetails')}
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {feature.technical}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        {t('safeguards.page.ai.howItWorks')}
                      </h4>
                      <ol className="space-y-2">
                        {feature.howItWorks.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="font-bold text-gray-500 flex-shrink-0">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
                      <p className="text-sm text-gray-800">
                        <strong className="font-semibold">{t('safeguards.page.ai.realWorldImpact')}:</strong> {feature.impact}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>

            {/* Cost Transparency */}
            <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 mb-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaDollarSign className="text-4xl text-gray-500" />
                {t('safeguards.page.ai.freeTitle')}
              </h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  <strong className="text-gray-800 font-semibold">{t('safeguards.page.ai.costIntroLabel')}</strong> {t('safeguards.page.ai.costIntro')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                  {Array.isArray(costApis) && costApis.map((api, i) => (
                    <li key={i}>{api}</li>
                  ))}
                </ul>
                <p className="text-sm italic text-gray-500">{t('safeguards.page.ai.costFunFact')}</p>
                <div className="mt-6 bg-white rounded-xl p-4 shadow-inner">
                  <p className="text-sm text-gray-700">
                    <strong>{t('safeguards.page.ai.transparencyPromise')}:</strong> {t('safeguards.page.ai.transparencyNote')}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <FaDatabase className="text-4xl text-gray-500" />
                {t('safeguards.page.ai.dataTitle')}
              </h3>
              <div className="text-gray-600 space-y-4">
                <p>{t('safeguards.page.ai.dataIntro')}</p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {Array.isArray(dataSources) && dataSources.map((source, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">{source.title}</h4>
                      <p className="text-xs text-gray-600">{source.description}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm italic text-gray-500 mt-4">{t('safeguards.page.ai.dataNote')}</p>
              </div>
            </div>
          </>
        )}

        {/* CTA - Link to Mediators Page */}
        <div className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-3xl shadow-neumorphic p-10 text-center text-white mt-12 mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {t('safeguards.page.cta.title')}
          </h2>
          <p className="text-base mb-6 opacity-95 max-w-2xl mx-auto">
            {t('safeguards.page.cta.subtitle')}
          </p>
          <Link
            to="/mediators"
            className="inline-block bg-white text-gray-700 font-semibold px-8 py-3 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            {t('safeguards.page.cta.button')}
          </Link>
        </div>

        {/* Ethics Contact */}
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl shadow-neumorphic p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaExclamationCircle className="text-orange-600" />
            {t('safeguards.page.report.title')}
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            {t('safeguards.page.report.description')}
          </p>
          <a
            href="mailto:ethics-team@fairmediator.ai"
            className="inline-block bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm"
          >
            {t('safeguards.page.report.button')}
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SafeguardsPage;
