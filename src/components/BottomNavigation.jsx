import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, Package, BarChart3, Users } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Beranda' },
  { path: '/cashier', icon: ShoppingCart, label: 'Kasir' },
  { path: '/collective-shopping', icon: Users, label: 'Kolektif' },
  { path: '/stock', icon: Package, label: 'Stok' },
  { path: '/statistics', icon: BarChart3, label: 'Statistik' },
];

export default function BottomNavigation() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t z-50 transition-all duration-300"
         style={{ 
           backgroundColor: 'var(--color-background)', 
           borderColor: 'var(--color-text-secondary)' 
         }}>
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link key={path} to={path} className="flex-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
