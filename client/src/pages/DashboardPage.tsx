import { useState } from 'react';
import { Dashboard as StatsDashboard } from '../components/common/Dashboard';
import { NewCaseForm } from '../components/common/NewCaseForm';
import { FollowUp } from '../components/common/FollowUp';
import { MedicineManager } from '../components/common/MedicineDetails';
import { MedicinesBunch } from '../components/common/MedicinesBunch';
import { PatientHistory } from '../components/common/PatientHistory';

// Hooks
import { useMedicines } from '../hooks/useMedicines';
import { useBunches } from '../hooks/useBunches';

export function DashboardPage() {
  const [view, setView] = useState('home');
  
  // Medicine Logic
  const { 
    medicines, 
    handleSaveMedicine, 
    handleDeleteMedicine 
  } = useMedicines();

  // Bunch Logic (Cleanly separated)
  const { 
    bunches, 
    handleSaveBunch, 
    handleDeleteBunch 
  } = useBunches();

  return (
    <div className="dashboard-container">

      
      {view === 'home' && <StatsDashboard onNavigate={setView} />}
      {/* ... existing views */}
      {view === 'patient-history' && (
        <PatientHistory onNavigate={() => setView('home')} />
      )}
    
      {/* {view === 'home' && <StatsDashboard onNavigate={setView} />} */}

      {view === 'new-case' && (
        <NewCaseForm onNavigate={() => setView('home')} medicinesBunch={medicines} />
      )}

      {view === 'follow-up' && (
        <FollowUp onNavigate={() => setView('home')} />
      )}

      {view === 'medicines' && (
        <MedicineManager
          medicines={medicines}
          onNavigate={() => setView('home')}
          onSave={handleSaveMedicine}
          onDelete={handleDeleteMedicine}
        />
      )}

      {view === 'medicines-bunch' && (
        <MedicinesBunch
          medicines={medicines}
          bunches={bunches}
          onNavigate={() => setView('home')}
          onAddBunch={handleSaveBunch}
          onDeleteBunch={handleDeleteBunch}
        />
      )}
    </div>
  );
}