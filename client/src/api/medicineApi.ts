import axiosInstance from './axiosInstance';
import type { Medicine } from '../types';

export const medicineApi = {
  getAll: () => axiosInstance.get<Medicine[]>('/medicines'),
  
  saveMedicine: (data: any) => {
    // FIX: Check for both frontend 'id' and MongoDB '_id'
    const recordId = data.id || data._id;
    
    if (recordId) {
      return axiosInstance.put(`/medicines/${recordId}`, data);
    }
    return axiosInstance.post('/medicines', data);
  },
  
  deleteMedicine: (id: string) => axiosInstance.delete(`/medicines/${id}`),

  getBunches: () => axiosInstance.get('/bunches'),
  createBunch: (data: any) => axiosInstance.post('/bunches', data),
  updateBunch: (id: string, data: any) => axiosInstance.put(`/bunches/${id}`, data),
  deleteBunch: (id: string) => axiosInstance.delete(`/bunches/${id}`),
};