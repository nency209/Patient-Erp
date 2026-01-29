/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/patientApi.ts
import axiosInstance from './axiosInstance';

export const patientApi = {
  createPatient: async (patientData: any) => {
    const response = await axiosInstance.post('/patients', patientData);
    return response.data;
  },
  // Added for History module
  getAllPatients: () => axiosInstance.get('/patients'),
  updatePatient: (id: string, data: any) => axiosInstance.put(`/patients/${id}`, data),
  deletePatient: (id: string) => axiosInstance.delete(`/patients/${id}`),
  addFollowUp: (id: string, data: any) => axiosInstance.post(`/patients/${id}/followups`, data),
  updateFollowUp: (id: string, followUpId: string, data: any) => 
    axiosInstance.put(`/patients/${id}/followups/${followUpId}`, data),
  deleteFollowUp: (id: string, followUpId: string) => 
    axiosInstance.delete(`/patients/${id}/followups/${followUpId}`),
};