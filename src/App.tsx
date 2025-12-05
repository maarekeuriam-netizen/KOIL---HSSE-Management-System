import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import IncidentForm from './components/IncidentForm';
import InspectionForm from './components/InspectionForm';
import RiskAssessmentForm from './components/RiskAssessmentForm';
import TrainingForm from './components/TrainingForm';
import DataImport from './components/DataImport';
import UserManagement from './components/UserManagement';
import RecordsViewer from './components/RecordsViewer';
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  GraduationCap,
  LogOut,
  Plus,
  Menu,
  X,
  Upload,
  Users,
  List
} from 'lucide-react';

type ActiveModal = 'incident' | 'inspection' | 'risk' | 'training' | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session?.user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setIsAdmin(profile?.role === 'admin');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={checkAuth} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <img
                src="/Logo Separate copy.png"
                alt="KOIL Logo"
                className="h-10 w-auto"
              />
              <div className="hidden sm:block h-8 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">HSSE Management</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Health, Safety, Security & Environment</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 space-y-1">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setActiveTab('import');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'import'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-5 h-5" />
                Import Data
              </button>

              <button
                onClick={() => {
                  setActiveTab('records');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'records'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-5 h-5" />
                All Records
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'users'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  Users
                </button>
              )}

              <div className="pt-4 pb-2 px-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </h3>
              </div>

              <button
                onClick={() => {
                  setActiveModal('incident');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <AlertTriangle className="w-5 h-5" />
                Report Incident
                <Plus className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => {
                  setActiveModal('inspection');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <ClipboardCheck className="w-5 h-5" />
                Report Near Miss
                <Plus className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => {
                  setActiveModal('risk');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Shield className="w-5 h-5" />
                Risk Assessment
                <Plus className="w-4 h-4 ml-auto" />
              </button>

              <button
                onClick={() => {
                  setActiveModal('training');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <GraduationCap className="w-5 h-5" />
                Add Training
                <Plus className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('import')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'import'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  Import Data
                </button>

                <button
                  onClick={() => setActiveTab('records')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === 'records'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-5 h-5" />
                  All Records
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                      activeTab === 'users'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    Users
                  </button>
                )}

                <div className="pt-4 pb-2 px-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </h3>
                </div>

                <button
                  onClick={() => setActiveModal('incident')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Report Incident
                  <Plus className="w-4 h-4 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveModal('inspection')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Report Near Miss
                  <Plus className="w-4 h-4 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveModal('risk')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <Shield className="w-5 h-5" />
                  Risk Assessment
                  <Plus className="w-4 h-4 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveModal('training')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <GraduationCap className="w-5 h-5" />
                  Add Training
                  <Plus className="w-4 h-4 ml-auto" />
                </button>
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
            {activeTab === 'import' && <DataImport />}
            {activeTab === 'records' && <RecordsViewer />}
            {activeTab === 'users' && isAdmin && <UserManagement />}
          </main>
        </div>
      </div>

      {activeModal === 'incident' && (
        <IncidentForm
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {activeModal === 'inspection' && (
        <InspectionForm
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {activeModal === 'risk' && (
        <RiskAssessmentForm
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {activeModal === 'training' && (
        <TrainingForm
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

export default App;
