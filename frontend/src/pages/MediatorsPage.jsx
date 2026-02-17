import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaGraduationCap, FaBalanceScale, FaLandmark, FaGlobeAmericas, FaRobot, FaTools, FaMapPin, FaChartBar, FaSearch, FaUsers, FaShieldAlt } from 'react-icons/fa';
import SEO from '../components/SEO/SEO';
import { getLocalBusinessSchema } from '../components/SEO/schemas';

// State abbreviations per region (universal, not translated)
const REGION_STATES = {
  northeast: ['NY', 'NJ', 'PA', 'MA', 'CT', 'RI', 'VT', 'NH', 'ME'],
  southeast: ['FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'WV'],
  midwest: ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'],
  southwest: ['TX', 'OK', 'NM', 'AZ'],
  west: ['CA', 'WA', 'OR', 'NV', 'ID', 'UT', 'CO', 'WY', 'MT', 'AK', 'HI'],
};

// Icons per howWeHandle item (positional, not translatable)
const HOW_WE_HANDLE_ICONS = [FaGraduationCap, FaBalanceScale, FaLandmark, FaGlobeAmericas];

// Icons per coming soon card (positional)
const COMING_SOON_ICONS = [FaMapPin, FaBalanceScale, FaChartBar, FaSearch];

const MediatorsPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const { t } = useTranslation();

  const stateVariationsArray = t('mediatorsPage.stateVariations', { returnObjects: true });
  const stateVariations = Array.isArray(stateVariationsArray)
    ? stateVariationsArray.reduce((acc, region) => {
        acc[region.key] = { ...region, states: REGION_STATES[region.key] || [] };
        return acc;
      }, {})
    : {};

  const howWeHandleData = t('mediatorsPage.howWeHandle', { returnObjects: true });
  const aiConsistencyCards = t('mediatorsPage.aiConsistency.cards', { returnObjects: true });
  const comingSoonCards = t('mediatorsPage.comingSoon.cards', { returnObjects: true });

  const regionalData = Object.entries(stateVariations);
  const filteredRegions = selectedRegion === 'all'
    ? regionalData
    : regionalData.filter(([key]) => key === selectedRegion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col">
      <SEO
        title="Mediators"
        description="Mediation isn't federally regulated. Every state makes its own rules. Compare mediator requirements, certification standards, and costs across all 50 states."
        keywords={['state mediator requirements', 'mediator certification', 'mediation by state', 'mediator credentials', 'state mediation laws']}
        jsonLd={getLocalBusinessSchema()}
      />
      <Header />

      {/* Hero Section - Card-Based Design */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('mediatorsPage.hero.title')}
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              {t('mediatorsPage.hero.subtitle')}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Card 1: 50 States */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaMapMarkedAlt className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                {t('mediatorsPage.hero.states.title')}
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                {t('mediatorsPage.hero.states.description')}
              </p>
            </div>

            {/* Card 2: Verified Mediators */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaUsers className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                {t('mediatorsPage.hero.verified.title')}
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                {t('mediatorsPage.hero.verified.description')}
              </p>
            </div>

            {/* Card 3: Zero Bias */}
            <div className="bg-white rounded-2xl p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.3),-4px_-4px_16px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_28px_rgba(0,0,0,0.4),-6px_-6px_20px_rgba(255,255,255,0.15)] hover:-translate-y-2 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-neu flex items-center justify-center group-hover:shadow-neu-lg transition-all duration-300">
                  <FaShieldAlt className="text-3xl text-slate-700" />
                </div>
              </div>
              <h3 className="text-center text-2xl font-bold text-slate-800 mb-3">
                {t('mediatorsPage.hero.bias.title')}
              </h3>
              <p className="text-center text-sm text-slate-600 leading-relaxed">
                {t('mediatorsPage.hero.bias.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* The Problem */}
        <section className="mb-16">
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <FaMapMarkedAlt className="text-4xl text-gray-500" />
              {t('mediatorsPage.patchwork.title')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p className="text-lg leading-relaxed">
                {t('mediatorsPage.patchwork.para1Pre')} <strong className="text-gray-800">{t('mediatorsPage.patchwork.para1Bold')}</strong>{t('mediatorsPage.patchwork.para1Post')}
              </p>
              <div className="bg-white rounded-xl p-6 my-6 shadow-inner">
                <h3 className="font-semibold text-gray-800 mb-3">{t('mediatorsPage.patchwork.exampleTitle')}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{t('mediatorsPage.patchwork.box')}</p>
              </div>
              <p>
                {t('mediatorsPage.patchwork.para2Pre')} <strong className="text-gray-800">{t('mediatorsPage.patchwork.para2Bold')}</strong>{t('mediatorsPage.patchwork.para2Post')}
              </p>
            </div>
          </div>
        </section>

        {/* Regional Filter */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              {t('mediatorsPage.regional.title')}
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedRegion('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedRegion === 'all'
                    ? 'bg-gray-600 text-white shadow-neumorphic'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('mediatorsPage.regional.all')}
              </button>
              {Object.entries(stateVariations).map(([key, region]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRegion(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedRegion === key
                      ? 'bg-gray-600 text-white shadow-neumorphic'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          {/* Region Cards */}
          <div className="space-y-6">
            {filteredRegions.map(([key, region]) => (
              <div
                key={key}
                className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    {region.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {region.states.map(state => (
                      <span
                        key={state}
                        className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-600 shadow-sm"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('mediatorsPage.regional.labels.certification')}</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.certification}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('mediatorsPage.regional.labels.courtIntegration')}</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.courtIntegration}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('mediatorsPage.regional.labels.specialties')}</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.specialty}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('mediatorsPage.regional.labels.cost')}</h4>
                    <p className="text-sm text-gray-700">{region.characteristics.averageCost}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-4 border-l-4 border-gray-400">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaMapPin className="text-gray-600" />
                    {t('mediatorsPage.regional.labels.uniqueRequirement')}: {region.example.state}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {region.example.detail}
                  </p>
                </div>

                <div className="mt-4 bg-yellow-50 rounded-lg p-3 border-l-2 border-yellow-400">
                  <p className="text-xs text-yellow-800">
                    <strong>{t('mediatorsPage.regional.noteLabel')}</strong> {region.characteristics.uniqueRequirement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How We Handle Complexity */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              {t('mediatorsPage.complexity.title')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('mediatorsPage.complexity.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            {Array.isArray(howWeHandleData) && howWeHandleData.map((item, index) => {
              const IconComponent = HOW_WE_HANDLE_ICONS[index];
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 hover:shadow-neumorphic-hover transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <IconComponent className="text-4xl text-gray-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {t('mediatorsPage.complexity.challenge')}: {item.challenge}
                      </h3>
                    </div>
                  </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-red-50 rounded-xl p-4 border-l-2 border-red-400">
                    <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">{t('mediatorsPage.complexity.problem')}</h4>
                    <p className="text-sm text-red-900">{item.problem}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-l-2 border-green-400">
                    <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">{t('mediatorsPage.complexity.solution')}</h4>
                    <p className="text-sm text-green-900">{item.solution}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-inner">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('mediatorsPage.complexity.technical')}
                  </h4>
                  <p className="text-xs text-gray-700 font-mono bg-gray-50 p-2 rounded">
                    {item.technical}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        </section>

        {/* AI Consistency Across States */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <FaRobot className="text-4xl text-gray-500" />
              {t('mediatorsPage.aiConsistency.title')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p className="text-base leading-relaxed">
                {t('mediatorsPage.aiConsistency.subtitle')}
              </p>

              <div className="grid md:grid-cols-3 gap-4 my-6">
                {Array.isArray(aiConsistencyCards) && aiConsistencyCards.map((card, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">{card.title}</h4>
                    <p className="text-xs text-gray-600 mb-3">{card.description}</p>
                    <p className="text-xs italic text-gray-500">{card.italic}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                <p className="text-sm text-blue-900">
                  <strong className="font-semibold">{t('mediatorsPage.aiConsistency.translationLabel')}</strong> {t('mediatorsPage.aiConsistency.translation')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon: State-Specific Features */}
        <section className="mb-12">
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <FaTools className="text-3xl text-gray-500" />
              {t('mediatorsPage.comingSoon.title')}
            </h2>
            <div className="text-gray-600 space-y-4">
              <p>
                {t('mediatorsPage.comingSoon.subtitle')}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {Array.isArray(comingSoonCards) && comingSoonCards.map((card, i) => {
                  const Icon = COMING_SOON_ICONS[i];
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border-l-2 border-gray-300">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                        <Icon className="text-gray-500" />
                        {card.title}
                      </h4>
                      <p className="text-xs text-gray-600">{card.description}</p>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm italic text-gray-500 mt-4">{t('mediatorsPage.comingSoon.release')}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-3xl shadow-neumorphic p-10 text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            {t('mediatorsPage.cta.title')}
          </h2>
          <p className="text-base mb-6 opacity-95 max-w-2xl mx-auto">
            {t('mediatorsPage.cta.subtitle')}
          </p>
          <Link
            to="/safeguards"
            className="inline-block bg-white text-gray-700 font-semibold px-8 py-3 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            {t('mediatorsPage.cta.button')}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MediatorsPage;
