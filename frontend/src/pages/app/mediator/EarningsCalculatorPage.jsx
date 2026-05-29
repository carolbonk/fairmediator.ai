import { useAuth } from '../../../contexts/AuthContext';
import EarningsCalculator from '../../../components/mediator/EarningsCalculator';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackLink from '../../../components/common/BackLink';
import SEO from '../../../components/SEO/SEO';

export default function EarningsCalculatorPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex flex-col overflow-x-hidden">
      <SEO
        title="Earnings Calculator"
        description="Project your mediation practice revenue with 1–3 year scenarios including ODR and collaboration models."
      />
      <Header />
      <BackLink to="/mediators-crm/cases" />

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 sm:px-8 lg:px-10 py-12 sm:py-16">
        {/* Page header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-neu-600 to-neu-900 bg-clip-text text-transparent mb-3 tracking-tight">
            Earnings Calculator
          </h1>
          <p className="text-lg text-neu-600 leading-relaxed">
            Model your practice revenue with 1–3 year projections and scenario planning.
          </p>
        </div>

        {/* Calculator renders its own neumorphic cards directly on the page */}
        <EarningsCalculator mediatorId={user?._id} />
      </main>

      <Footer />
    </div>
  );
}
