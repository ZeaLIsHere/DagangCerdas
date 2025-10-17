import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNavigation from './BottomNavigation';
import TopBar from './TopBar';
import NotificationSystem from './NotificationSystem';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="pt-16 px-4 pb-4"
      >
        {children}
      </motion.main>
      <BottomNavigation />
      <NotificationSystem />
    </div>
  );
}
