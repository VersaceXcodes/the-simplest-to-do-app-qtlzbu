import React from "react";

const GV_Footer: React.FC = () => {
  // Define the footer text as per the datamap default value.
  const footer_text = "© 2023 The Simplest To Do App";

  return (
    <>
      <footer className="fixed bottom-0 left-0 w-full bg-gray-100 text-gray-600 text-center py-2">
        {footer_text}
      </footer>
    </>
  );
};

export default GV_Footer;