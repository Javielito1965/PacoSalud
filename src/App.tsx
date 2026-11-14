import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, NavTab } from './components/Header';
import { DashboardSection } from './components/DashboardSection';
import { BloodPressureSection } from './components/BloodPressureSection';
import { MedicationSection } from './components/MedicationSection';
import { AppointmentsSection } from './components/AppointmentsSection';
import { AdminPanelSection } from './components/AdminPanelSection';
import { MedicalReportModal } from './components/MedicalReportModal';
import { DeployGuideModal } from './components/DeployGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';

function MainApp() {
  const { config, storageWarning, dismissStorageWarning } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [openBPModalDirectly, setOpenBPModalDirectly] = useState(false);

  // Font size classes based on accessibility configuration
  const fontClass = 
    config.fontSize === 'xlarge' 
      ? 'text-base sm:text-lg' 
      : config.fontSize === 'large' 
        ? 'text-sm sm:text-base' 
        : 'text-xs sm:text-sm';

  const handleOpenNewBP = () => {
    setOpenBPModalDirectly(true);
    setCurrentTab('tension');
  };

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors ${fontClass}`}>
      
      {/* Top Header Navigation */}
      <Header 
        currentTab={currentTab} 
        onSelectTab={(tab) => {
          setOpenBPModalDirectly(false);
          setCurrentTab(tab);
        }} 
        onOpenReport={() => setIsReportOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-12">
        {storageWarning && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
            <span>{storageWarning}</span>
            <button
              type="button"
              onClick={dismissStorageWarning}
              className="px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900 font-semibold shrink-0"
            >
              Entendido
            </button>
          </div>
        )}
        {currentTab === 'dashboard' && (
          <DashboardSection 
            onNavigate={(tab) => {
              setOpenBPModalDirectly(false);
              setCurrentTab(tab);
            }}
            onOpenNewBPModal={handleOpenNewBP}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
          />
        )}

        {currentTab === 'tension' && (
          <BloodPressureSection 
            onOpenReport={() => setIsReportOpen(true)}
            isOpenModalDirectly={openBPModalDirectly}
          />
        )}

        {currentTab === 'medicacion' && (
          <MedicationSection 
            onOpenReport={() => setIsReportOpen(true)}
          />
        )}

        {currentTab === 'citas' && (
          <AppointmentsSection />
        )}

        {currentTab === 'admin' && (
          <AdminPanelSection 
            onOpenReport={() => setIsReportOpen(true)}
            onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
          />
        )}
      </main>

      {/* Printable Clinical Medical Report Modal */}
      <MedicalReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        onNavigateToDashboard={() => {
          setIsReportOpen(false);
          setCurrentTab('dashboard');
        }}
      />

      {/* Free Web Deployment & PWA Installation Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />

      {/* Connectivity Status Indicator */}
      <OfflineIndicator />

      {/* Discreet Footer (No mechanical clutter or fake engines) */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CUIDAFAM PRO · Panel de Control Familiar de Salud</span>
          <span>Cumple con estándares clínicos OMS / ESC-ESH · Almacenamiento local seguro</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
