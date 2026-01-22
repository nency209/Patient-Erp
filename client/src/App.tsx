import { DashboardPage } from './pages/DashboardPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* All feature navigation is now handled inside DashboardPage */}
      <DashboardPage />
      
      <Toaster position="top-right" richColors />
    </div>
  );
}