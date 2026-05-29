import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * Consistent "Go back" link, pinned flush-left under the header logo.
 * Render it directly after <Header /> so it sits below the logo on every page.
 * The container mirrors the header's width/padding so the link aligns with
 * the logo's left edge regardless of the page's inner content width.
 */
export default function BackLink({ to = '/', label = 'Go back' }) {
  return (
    <nav
      aria-label="Back navigation"
      className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4"
    >
      <Link
        to={to}
        className="inline-flex items-center gap-2 text-sm font-semibold text-neu-600 hover:text-neu-900 transition-colors"
      >
        <FaArrowLeft className="text-xs" aria-hidden="true" />
        {label}
      </Link>
    </nav>
  );
}
