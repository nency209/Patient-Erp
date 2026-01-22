import type { Patient, FollowUp} from '../types';



export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 32,
    address: '123 Main Street, New York, NY 10001',
    phoneNumber: '+1-555-0123',
    birthDate: '1992-05-15',
    education: 'Bachelor of Science',
    maritalStatus: 'Married',
    husbandName: 'John Johnson',
    husbandAge: 35,
    marriageYear: 2015,
    husbandOccupation: 'Software Engineer',
    hasChildren: true,
    childAge: 5,
    childStudy: 'Kindergarten',
    schedule: ['Follow-up visit', 'Blood test'],
    healthConcerns: {
      main: 'Recurring headaches and fatigue',
      additional: ['Sleep disturbances', 'Stress']
    },
    medicines: [
      {
        medicineName: 'Ibuprofen',
        category: 'PAIN-8',
        timings: { am: '8:00', pm: '8:00' },
        bottleNumber: 1
      },
      {
        medicineName: 'Omeprazole',
        category: 'GUT-4',
        timings: { am: '7:30' },
        bottleNumber: 1
      }
    ],
    createdAt: '2024-11-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 45,
    address: '456 Oak Avenue, Los Angeles, CA 90001',
    phoneNumber: '+1-555-0456',
    birthDate: '1979-08-22',
    education: 'Master of Business Administration',
    maritalStatus: 'Unmarried',
    schedule: ['Routine checkup', 'Blood pressure monitoring'],
    healthConcerns: {
      main: 'High blood pressure and cholesterol',
      additional: ['Family history of heart disease', 'Sedentary lifestyle']
    },
    medicines: [
      {
        medicineName: 'Paracetamol',
        category: 'FEVER-8',
        timings: { am: '7:00' },
        bottleNumber: 1
      },
      {
        medicineName: 'Azithromycin',
        category: 'COLD-8',
        timings: { pm: '9:00' },
        bottleNumber: 2
      }
    ],
    createdAt: '2024-10-15T14:30:00Z'
  },
  {
    id: '3',
    name: 'Emily Davis',
    age: 28,
    address: '789 Pine Street, Chicago, IL 60601',
    phoneNumber: '+1-555-0789',
    birthDate: '1996-12-10',
    education: 'Bachelor of Arts',
    maritalStatus: 'Married',
    husbandName: 'David Davis',
    husbandAge: 30,
    marriageYear: 2020,
    husbandOccupation: 'Architect',
    hasChildren: false,
    schedule: ['Allergy consultation'],
    healthConcerns: {
      main: 'Seasonal allergies',
      additional: ['Pollen sensitivity', 'Dust mite allergy']
    },
    medicines: [
      {
        medicineName: 'Cetirizine',
        category: 'COLD-8',
        timings: { am: '8:00' },
        bottleNumber: 1
      }
    ],
    createdAt: '2024-12-01T09:15:00Z'
  }
];

export const mockFollowUps: FollowUp[] = [
  {
    id: '1',
    patientId: '1',
    date: '2024-11-15T10:00:00Z',
    notes: 'Patient reports improvement in headache frequency. Sleep quality has improved with new medication regimen.',
    medicinesPrescribed: [
      {
        medicineName: 'Ibuprofen',
        category: 'PAIN-8',
        timings: { am: '8:00', pm: '8:00' },
        bottleNumber: 1
      }
    ],
    nextAppointment: '2024-12-15'
  },
  {
    id: '2',
    patientId: '1',
    date: '2024-12-01T14:30:00Z',
    notes: 'Continued progress. Patient maintaining regular sleep schedule. Added omeprazole for acid reflux symptoms.',
    medicinesPrescribed: [
      {
        medicineName: 'Ibuprofen',
        category: 'PAIN-8',
        timings: { am: '8:00', pm: '8:00' },
        bottleNumber: 1
      },
      {
        medicineName: 'Omeprazole',
        category: 'GUT-4',
        timings: { am: '7:30' },
        bottleNumber: 1
      }
    ],
    nextAppointment: '2025-01-05'
  },
  {
    id: '3',
    patientId: '2',
    date: '2024-11-01T11:00:00Z',
    notes: 'Viral infection symptoms improving. Antibiotic course to be completed. Patient advised on rest and hydration.',
    medicinesPrescribed: [
      {
        medicineName: 'Paracetamol',
        category: 'FEVER-8',
        timings: { am: '7:00' },
        bottleNumber: 1
      },
      {
        medicineName: 'Azithromycin',
        category: 'COLD-8',
        timings: { pm: '9:00' },
        bottleNumber: 2
      }
    ],
    nextAppointment: '2024-12-20'
  },
  {
    id: '4',
    patientId: '3',
    date: '2024-12-08T15:00:00Z',
    notes: 'Allergy symptoms well controlled with current medication. Patient to continue treatment.',
    medicinesPrescribed: [
      {
        medicineName: 'Cetirizine',
        category: 'COLD-8',
        timings: { am: '8:00' },
        bottleNumber: 1
      }
    ],
    nextAppointment: '2025-01-10'
  }
];