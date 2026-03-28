import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { VocabularyProvider } from '../contexts/VocabularyContext';
import { UserProvider } from '../contexts/UserContext';

export function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <VocabularyProvider>
          <UserProvider>
            <div className="flex h-screen bg-background dark:bg-gray-950 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <Outlet />
              </main>
            </div>
          </UserProvider>
        </VocabularyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}