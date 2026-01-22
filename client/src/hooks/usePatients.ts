import { useState } from 'react';
import { patientApi } from '../api/patientApi';
import { toast } from 'sonner';

export const usePatients = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savePatient = async (data: any, onSuccess: () => void) => {
    setIsSubmitting(true);
    try {
      await patientApi.createPatient(data);
      toast.success('Patient case saved successfully!');
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save patient case';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { savePatient, isSubmitting };
};