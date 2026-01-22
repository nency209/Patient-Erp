import { useState, useEffect, useCallback } from 'react';
import { medicineApi } from '../api/medicineApi';
import type{ Medicine } from '../types';
import { toast } from 'sonner';

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [medRes,] = await Promise.all([
        medicineApi.getAll(),
        // medicineApi.getBunches()
      ]);
      console.log("Raw Medicines from API:", medRes.data);
      setMedicines(medRes.data);
      // setBunches(bunchRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data from server");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSaveMedicine = async (data: any) => {
    try {
      const res = await medicineApi.saveMedicine(data);
      if (res.status === 200 || res.status === 201) {
        await refreshData(); // IMPORTANT: Refresh list after saving
        return true;
      }
    } catch (error) {
      toast.error("Error saving medicine");
      return false;
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    try {
      await medicineApi.deleteMedicine(id);
      await refreshData(); // IMPORTANT: Refresh list after deleting
      toast.success("Medicine deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return { medicines, loading, handleSaveMedicine, handleDeleteMedicine, refreshData };
}