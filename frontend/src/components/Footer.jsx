const Footer = () => {
  return (
    <footer className="bg-dark-neu-300 shadow-dark-neu-lg border-t border-dark-neu-500 mt-auto">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-3">
        <p className="text-white text-sm opacity-70 text-center">
          © 2025 FairMediator. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
