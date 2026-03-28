import { AnimatePresence, motion } from 'motion/react';
import { Outlet, useLocation, useOutlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { VocabularyProvider } from '../contexts/VocabularyContext';
import { UserProvider } from '../contexts/UserContext';

export function RootLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <VocabularyProvider>
          <UserProvider>
            <div className="flex h-screen bg-background dark:bg-gray-950 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-background dark:bg-gray-950">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="min-h-full bg-background dark:bg-gray-950"
                  >
                    {outlet ?? <Outlet />}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </UserProvider>
        </VocabularyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
