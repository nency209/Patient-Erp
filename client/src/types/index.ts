export interface PatientMedicine {
  medicineName: string;
  category?: string;
  timings: {
    am?: string; // e.g., "8:00"
    pm?: string; // e.g., "8:00"
  };
  bottleNumber: 1 | 2 | 3;
}
export interface Medicine {
  id: string;
  name: string;
  category: string;
  oneLiner: string;
  shortDescription?: string;
  longDescription: string;
  images: string[];
}
export interface Patient {
  id: string;
  name: string;
  age: number;
  address: string;
  phoneNumber: string;
  birthDate?: string;
  education?: string;
  maritalStatus: 'Married' | 'Unmarried';
  husbandName?: string;
  husbandAge?: number;
  marriageYear?: number;
  husbandOccupation?: string;
  hasChildren?: boolean;
  childAge?: number;
  childStudy?: string;
  schedule: string[];
  healthConcerns: {
    main: string;
    additional: string[];
  };
  medicines: PatientMedicine[];
  createdAt: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  date: string;
  notes: string;
  medicinesPrescribed: PatientMedicine[];
  nextAppointment?: string;
}