import React from "react";
import { Route, Routes } from "react-router-dom";

/* Import the provided views */
import GV_Header from "@/components/views/GV_Header.tsx";
import GV_Footer from "@/components/views/GV_Footer.tsx";
import GV_Notification from "@/components/views/GV_Notification.tsx";
import UV_Landing from "@/components/views/UV_Landing.tsx";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global Header fixed at the top */}
      <GV_Header />

      {/* Global Notification overlay */}
      <GV_Notification />

      {/* Main content area */}
      <main className="flex-grow pt-16 pb-16">
        <Routes>
          <Route path="/" element={<UV_Landing />} />
        </Routes>
      </main>

      {/* Global Footer fixed at the bottom */}
      <GV_Footer />
    </div>
  );
};

export default App;