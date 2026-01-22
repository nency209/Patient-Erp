import { useState, useEffect, useCallback } from 'react';
import { medicineApi } from '../api/medicineApi';
import { toast } from 'sonner';

export function useBunches() {
  const [bunches, setBunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshBunches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicineApi.getBunches();
      setBunches(res.data);
    } catch (error) {
      toast.error("Failed to load bunches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshBunches(); }, [refreshBunches]);

  const handleSaveBunch = async (data: any) => {
    try {
      if (data.id) {
        await medicineApi.updateBunch(data.id, data);
      } else {
        await medicineApi.createBunch(data);
      }
      await refreshBunches();
      toast.success(data.id ? "Bunch updated" : "Bunch created");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error saving bunch");
      return false;
    }
  };

  const handleDeleteBunch = async (id: string) => {
    try {
      await medicineApi.deleteBunch(id);
      await refreshBunches();
      toast.success("Bunch deleted");
      return true;
    } catch (error) {
      toast.error("Delete failed");
      return false;
    }
  };

  return { bunches, loading, handleSaveBunch, handleDeleteBunch };
}