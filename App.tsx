import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ServiceDesk from './pages/ServiceDesk';
import SalesPOS from './pages/SalesPOS';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Login from './pages/Login';
import CrmDashboard from './pages/CRM/CrmDashboard';
import LeadPipeline from './pages/CRM/LeadPipeline';
import CustomerList from './pages/CRM/CustomerList';
import Marketing from './pages/Marketing';
import { Menu, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
      </div>
    );
  }

  // If no session, show Login
  if (!session) {
    return <Login />;
  }

  // Protected Routes
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'service': return <ServiceDesk />;
      case 'sales': return <SalesPOS />;
      case 'financial': return <Financial />;
      case 'reports': return <Reports />;

      // CRM Routes
      case 'crm_dashboard': return <CrmDashboard />;
      case 'crm_leads': return <LeadPipeline />;
      case 'crm_customers': return <CustomerList />;
      case 'marketing': return <Marketing />;

      case 'settings': return <Settings />;
      case 'help': return <Help />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        session={session}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <span className="text-lg font-bold text-slate-800">iGestão Pro</span>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
