import React from "react";

const GV_Header: React.FC = () => {
  // This constant holds the static app title for branding as per the datamap default.
  const header_title: string = "The Simplest To Do App";

  return (
    <>
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-800">
            {header_title}
          </div>
          <nav>
            {/* Future navigation links (e.g., About, Help) can be added here using <Link> as needed */}
          </nav>
        </div>
      </header>
    </>
  );
};

export default GV_Header;