import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent} from '../ui/card'; 
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
// REMOVED ScrollArea import to fix the issue

import { 
  Plus, ArrowLeft, Trash2, Edit2, Loader2, Pill, Eye, User, Search,
  History, Calendar, Download, X, MessageSquare, Lightbulb, 
  FileText, Activity, HeartPulse, Baby, 
} from 'lucide-react';
import { patientApi } from '../../api/patientApi';
import { useBunches } from '../../hooks/useBunches';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Interfaces & Types ---

interface SubMedicine {
  name: string;
  reason?: string;
  showReason?: boolean;
}

interface MedicineTiming {
  am: string;
  pm: string;
  freq?: string; 
}

interface Prescription {
  id?: string | number;
  bottleNumber: 1 | 2 | 3; 
  bottleSize?: '15ml' | '30ml'; 
  mainCategory: string; 
  subMedicines: SubMedicine[];
  timings: MedicineTiming;
  suggestion?: string;
  showSuggestion?: boolean;
}

interface HealthConcerns {
  main: string;
  physical?: string;
  emotional?: string;
  pastHistory?: string;
  additional?: string[];
}

interface FollowUp {
  date: string | Date;
  notes?: string;
  visitObservation?: string;
  overallSuggestion?: string;
  medicines?: Prescription[];
}

interface Patient {
  _id: string;
  name: string;
  phoneNumber: string;
  age: string | number;
  gender: string;
  pMainDate?: string;
  birthDate?: string;
  weight?: string;
  height?: string;
  address?: string;
  education?: string;
  maritalStatus?: string;
  husbandName?: string;
  husbandAge?: number;
  hasChildren?: boolean;
  childName?: string;
  childAge?: number;
  childStudy?: string;
  work?: string; 
  city?: string;
  state?: string;
  healthConcerns: HealthConcerns;
  followUps: FollowUp[];
  medicines?: Prescription[];
  overallSuggestion?: string;
}

interface BunchItem {
  _id: string;
  name: string;
  medicineIds: (string | { name: string })[]; 
}

interface jsPDFCustom extends jsPDF {
  lastAutoTable: { finalY: number };
}

export function PatientHistory({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  const { bunches } = useBunches() as { bunches: BunchItem[], loading: boolean };
  
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [viewVisits, setViewVisits] = useState<Patient | null>(null); 

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientApi.getAllPatients();
      setPatients(res.data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) { 
      toast.error("Failed to load history"); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredPatients = useMemo(() => {
    return (patients || []).filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phoneNumber?.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const handleUpdate = async () => {
    if (!editPatient) return;
    if (!editPatient.name || !editPatient.age || !editPatient.phoneNumber || !editPatient.healthConcerns?.main) {
      toast.error('Missing required information');
      return;
    }
    try {
      await patientApi.updatePatient(editPatient._id, editPatient);
      toast.success("Patient record updated successfully");
      setEditPatient(null);
      fetchPatients();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) { toast.error("Update failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this record?")) return;
    try {
      await patientApi.deletePatient(id);
      setPatients(prev => prev.filter(p => p._id !== id));
      toast.success("Patient deleted");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) { toast.error("Delete failed"); }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const today = new Date();
    const birthDateObj = new Date(dob);
    let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      calculatedAge--;
    }
    return calculatedAge.toString();
  };

  // --- PDF GENERATION ---
  // --- PDF GENERATION ---
  const downloadPatientPDF = (patient: Patient) => {
    const doc = new jsPDF() as jsPDFCustom;
    const dateStr = format(new Date(), 'dd-MM-yyyy');
    const themeColor = [30, 58, 138] as [number, number, number]; // Dark Blue
    const subHeaderColor = [59, 130, 246] as [number, number, number]; // Lighter Blue

    let finalY = 0;

    // --- 1. HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(...themeColor);
    doc.text("PATIENT MEDICAL REPORT", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${dateStr}`, 14, 27);
    doc.line(14, 30, 196, 30);

    // --- 2. PERSONAL INFORMATION TABLE ---
    const childInfo = patient.hasChildren 
      ? `Yes (Name: ${patient.childName || '-'}, Age: ${patient.childAge || '-'}, Study: ${patient.childStudy || '-'})` 
      : 'No';

    const spouseInfo = patient.maritalStatus === 'Married' 
      ? `${patient.husbandName || '-'} (Age: ${patient.husbandAge || '-'})` 
      : 'N/A';

    autoTable(doc, {
      startY: 35,
      head: [['Category', 'Details']],
      body: [
        ['Full Name', patient.name],
        ['Contact', patient.phoneNumber],
        ['Demographics', `Age: ${patient.age} | Gender: ${patient.gender} | DOB: ${patient.birthDate || '-'}`],
        ['Address', patient.address || '-'],
        ['Education', patient.education || '-'],
        ['Occupation / Work', patient.work || '-'],
        ['Marital Status', patient.maritalStatus || '-'],
        ['Spouse Details', spouseInfo],
        ['Children', childInfo],
        ['Physical Stats', `Weight: ${patient.weight || '-'} | Height: ${patient.height || '-'}`],
        ['Registration Date', patient.pMainDate ? format(new Date(patient.pMainDate), 'dd-MM-yyyy') : '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: themeColor, fontSize: 12, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [241, 245, 249] },
        1: { cellWidth: 'auto' }
      }
    });

    finalY = doc.lastAutoTable.finalY + 10;

    // --- 3. HEALTH PROFILE ---
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.text("HEALTH PROFILE", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Concern Type', 'Description']],
      body: [
        ['Main Concern', patient.healthConcerns?.main || '-'],
        ['Physical Issues', patient.healthConcerns?.physical || '-'],
        ['Emotional Issues', patient.healthConcerns?.emotional || '-'],
        ['Past History', patient.healthConcerns?.pastHistory || '-'],
        ['Additional', (patient.healthConcerns?.additional || []).join(', ') || '-']
      ],
      theme: 'grid',
      headStyles: { fillColor: subHeaderColor },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] }, // Light gray col
      },
      styles: { overflow: 'linebreak' } // Handles long text with newlines
    });

    finalY = doc.lastAutoTable.finalY + 15;

    // --- 4. VISIT HISTORY (FOLLOW UPS) ---
    doc.setFontSize(16);
    doc.setTextColor(...themeColor);
    doc.text("VISIT TIMELINE & PRESCRIPTIONS", 14, finalY);
    
    finalY += 5;

    // Check if there are followups
    const visits = patient.followUps || [];
    if (visits.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("No visit history recorded.", 14, finalY + 10);
    }

    // Sort visits Newest First
    const sortedVisits = [...visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     
    sortedVisits.forEach((visit) => {
      // Check if we need a new page
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      // Visit Header
      doc.setFillColor(241, 245, 249); // Light slate bg
      doc.rect(14, finalY, 182, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`Visit Date: ${format(new Date(visit.date), 'dd-MM-yyyy')}`, 17, finalY + 7);
      
      finalY += 15;

      // Visit Clinical Notes Table
      autoTable(doc, {
        startY: finalY,
        body: [
          ['Complaint / Notes', visit.notes || 'No notes'],
          ['Observation', visit.visitObservation || 'No observation'],
          ['Overall Suggestion', visit.overallSuggestion || '-']
        ],
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40, textColor: subHeaderColor },
          1: { cellWidth: 'auto' }
        },
        styles: { fontSize: 10, cellPadding: 2 }
      });

      finalY = doc.lastAutoTable.finalY + 5;

      // Medicines Table for this Visit
      if (visit.medicines && visit.medicines.length > 0) {
        const medRows = visit.medicines.map(m => {
            // Format Sub-medicines list
            const contents = m.subMedicines.map(s => {
                let str = s.name;
                if(s.reason) str += ` (${s.reason})`;
                return str;
            }).join(', ');

            // Format Timings
            const timings = `AM: ${m.timings?.am || '-'} | PM: ${m.timings?.pm || '-'}`;
            const freq = m.timings?.freq ? ` | Freq: ${m.timings.freq}` : '';
            const instructions = `${timings}${freq}\n${m.suggestion ? `Note: ${m.suggestion}` : ''}`;

            return [
                `Bottle ${m.bottleNumber}\n(${m.bottleSize || '15ml'})`,
                m.mainCategory,
                contents || 'Empty',
                instructions
            ];
        });

        autoTable(doc, {
          startY: finalY,
          head: [['Btl', 'Category', 'Contents (Flower Remedies)', 'Timings & Instructions']],
          body: medRows,
          theme: 'grid',
          headStyles: { fillColor: [70, 70, 70], fontSize: 9 },
          styles: { fontSize: 9, valign: 'middle' },
          columnStyles: {
            0: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
            1: { cellWidth: 25, fontStyle: 'bold' },
            2: { cellWidth: 'auto' }, // Contents gets most space
            3: { cellWidth: 50 }
          }
        });
        
        finalY = doc.lastAutoTable.finalY + 15; // Space after meds
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("(No medicines prescribed)", 17, finalY + 5);
        finalY += 15;
      }
    });

    doc.save(`${patient.name.replace(/\s+/g, '_')}_Full_Report.pdf`);
    toast.success("Full medical report downloaded");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">PATIENT DATABASE</h1>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search name or phone..." className="pl-10 h-11 rounded-xl bg-slate-50 border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Patients Table */}
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Patient Details</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Main Health Concern</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 uppercase text-[10px] tracking-widest">Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((p) => (
                  <TableRow key={p._id} className="border-slate-100 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-600 h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                           <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-base">{p.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{p.phoneNumber} • {p.age}y • {p.gender}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                        <p className="text-sm font-semibold text-slate-600 truncate">{p.healthConcerns?.main}</p>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setViewVisits(p)} className="text-slate-600 font-bold border-slate-200">
                         <History className="h-4 w-4 mr-1.5" /> History
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setViewPatient(p)} className="text-blue-600 font-bold border-blue-200 bg-blue-50 hover:bg-blue-100">
                         <Eye className="h-4 w-4 mr-1.5" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="text-slate-600" onClick={() => setEditPatient(JSON.parse(JSON.stringify(p)))}>
                         <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p._id)} className="text-red-400 hover:bg-red-50 hover:text-red-600">
                         <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* --- MODAL 1: VIEW PERSONAL DETAILS (COMPACT & SCROLL FIXED) --- */}
      <Dialog open={!!viewPatient} onOpenChange={(open) => !open && setViewPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-white rounded-3xl border-none shadow-2xl overflow-hidden p-0">
            {/* Header: Clean & White */}
            <div className="bg-white border-b p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center border">
                        <User className="h-7 w-7 text-slate-700" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">{viewPatient?.name}</h2>
                        <div className="flex gap-4 text-slate-500 text-xs font-bold mt-1">
                            <span className="flex items-center"><Activity className="h-3 w-3 mr-1 text-blue-500"/> {viewPatient?.age} Years</span>
                            <span className="flex items-center"><User className="h-3 w-3 mr-1 text-blue-500"/> {viewPatient?.gender}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{viewPatient?.phoneNumber}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number</div>
                </div>
            </div>

            {/* FIXED SCROLLING CONTAINER */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
            <div className="p-6 md:p-8 space-y-6">
                {/* Section: Personal Basic */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div><Label className="text-[10px] text-slate-400 uppercase font-bold">DOB</Label><p className="font-bold text-slate-700 text-sm">{viewPatient?.birthDate || '-'}</p></div>
                        <div><Label className="text-[10px] text-slate-400 uppercase font-bold">Education</Label><p className="font-bold text-slate-700 text-sm">{viewPatient?.education || '-'}</p></div>
                        <div><Label className="text-[10px] text-slate-400 uppercase font-bold">Weight</Label><p className="font-bold text-slate-700 text-sm">{viewPatient?.weight ? `${viewPatient.weight} kg` : '-'}</p></div>
                        <div><Label className="text-[10px] text-slate-400 uppercase font-bold">Height</Label><p className="font-bold text-slate-700 text-sm">{viewPatient?.height ? `${viewPatient.height} cm` : '-'}</p></div>
                        <div className="col-span-2 md:col-span-4 border-t pt-3 mt-1"><Label className="text-[10px] text-slate-400 uppercase font-bold">Address</Label><p className="font-bold text-slate-700 text-sm">{viewPatient?.address || '-'}</p></div>
                    </div>
                </section>

                {/* Section: Family & Work */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Baby className="h-3 w-3" /> Socio-Economic
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <Label className="text-[10px] text-slate-400 uppercase font-bold">Occupation</Label>
                             <p className="text-slate-800 font-bold text-sm">{viewPatient?.work || 'Not specified'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <div className="flex justify-between items-center mb-1">
                                <Label className="text-[10px] text-slate-400 uppercase font-bold">Marital Status</Label>
                                <span className="text-slate-800 font-bold text-sm">{viewPatient?.maritalStatus}</span>
                             </div>
                             {viewPatient?.maritalStatus === 'Married' && (
                                <p className="text-xs text-slate-500">Spouse: <span className="font-semibold">{viewPatient?.husbandName || 'N/A'}</span></p>
                             )}
                             {viewPatient?.hasChildren && (
                                <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded font-medium">
                                    Child: {viewPatient?.childName} ({viewPatient?.childAge}y)
                                </div>
                             )}
                        </div>
                    </div>
                </section>

                {/* Section: Health */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <HeartPulse className="h-3 w-3" /> Health Profile
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                            <Activity className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <Label className="text-red-400 font-bold text-[10px] uppercase">Main Complaint</Label>
                                <p className="text-red-900 font-bold text-base leading-tight">{viewPatient?.healthConcerns?.main}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border p-3 rounded-xl">
                                <Label className="text-slate-400 font-bold text-[10px] uppercase">Physical</Label>
                                <p className="text-slate-700 font-medium text-sm">{viewPatient?.healthConcerns?.physical || 'None'}</p>
                            </div>
                            <div className="bg-white border p-3 rounded-xl">
                                <Label className="text-slate-400 font-bold text-[10px] uppercase">Emotional</Label>
                                <p className="text-slate-700 font-medium text-sm">{viewPatient?.healthConcerns?.emotional || 'None'}</p>
                            </div>
                        </div>
                        {viewPatient?.healthConcerns?.additional && viewPatient.healthConcerns.additional.length > 0 && (
                             <div className="flex flex-wrap gap-2 mt-1">
                                {viewPatient.healthConcerns.additional.map((c, i) => (
                                    <Badge key={i} variant="secondary" className="px-2 py-0.5 text-[10px]">{c}</Badge>
                                ))}
                             </div>
                        )}
                    </div>
                </section>
            </div>
            </div>

            <DialogFooter className="p-4 bg-white border-t shrink-0">
                <Button onClick={() => setViewPatient(null)} className="w-full font-bold bg-slate-900 text-white hover:bg-slate-800">CLOSE DETAILS</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: FOLLOWUP HISTORY (COMPACT, SCROLLABLE, FIXED LAYOUT) --- */}
      <Dialog open={!!viewVisits} onOpenChange={(open) => !open && setViewVisits(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-slate-50 rounded-2xl p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b shrink-0 flex justify-between items-center z-10">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <History className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-800">Visit Timeline</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{viewVisits?.name}</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                 <Badge variant="outline" className="hidden sm:flex border-slate-200 text-slate-500 font-mono">
                    {viewVisits?.followUps?.length || 0} VISITS
                 </Badge>
                 <Button variant="ghost" size="icon" onClick={() => setViewVisits(null)} className="h-8 w-8 rounded-full hover:bg-slate-100">
                    <X className="h-4 w-4 text-slate-500" />
                 </Button>
             </div>
          </div>

          {/* FIXED SCROLLING CONTAINER (Replaced ScrollArea with div) */}
          <div className="flex-1 overflow-y-auto">
            {(!viewVisits?.followUps || viewVisits.followUps.length === 0) ? (
              <div className="h-[40vh] flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 opacity-30" />
                  </div>
                  <p className="font-bold text-sm">No history recorded.</p>
              </div>
            ) : (
              <div className="p-6 relative max-w-3xl mx-auto">
                {/* Vertical Timeline Line */}
                <div className="absolute left-7.25 top-6 bottom-6 w-0.5 bg-slate-200"></div>

                <div className="space-y-8">
                {[...(viewVisits.followUps)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((f, i) => (
                  <div key={i} className="relative pl-12">
                      {/* Timeline Dot */}
                      <div className={`absolute left-5 top-0.5 h-5 w-5 rounded-full border-4 z-10 shadow-sm ${i === 0 ? 'bg-blue-600 border-blue-100' : 'bg-white border-slate-300'}`}></div>
                      
                      {/* Date & Tag */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`text-base font-black ${i === 0 ? 'text-blue-700' : 'text-slate-700'}`}>
                            {format(new Date(f.date), 'dd-MM-yyyy')}
                        </h3>
                        {i === 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">LATEST</span>}
                      </div>

                      {/* Content Card (Compact) */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* 1. Clinical Notes (Side by Side Grid) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b border-slate-100">
                           <div className="p-4">
                               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                                   <FileText className="h-3 w-3" /> Complaint
                               </div>
                               <p className="text-slate-800 text-sm font-medium leading-relaxed">
                                   {f.notes || <span className="text-slate-300 italic">No notes</span>}
                               </p>
                           </div>
                           <div className="p-4 bg-slate-50/50">
                               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                                   <Activity className="h-3 w-3" /> Observation
                               </div>
                               <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                   {f.visitObservation || <span className="text-slate-300 italic">No observations</span>}
                               </p>
                           </div>
                        </div>

                        {/* 2. Prescription (Compact List) */}
                        {f.medicines && f.medicines.length > 0 && (
                            <div className="bg-blue-50/20 p-4">
                                <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-3">
                                   <Pill className="h-3 w-3" /> Rx Prescriptions
                                </div>
                                
                                <div className="space-y-2">
                                    {f.medicines.map((m, mi) => (
                                        <div key={mi} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
                                            {/* Bottle Info Badge */}
                                            <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-1.5 rounded-lg">
                                                <div className="h-5 w-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                                                    {m.bottleNumber}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500">{m.bottleSize || '15ml'}</div>
                                            </div>

                                            {/* Medicine Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-slate-800 truncate">{m.mainCategory}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {m.timings?.am}-{m.timings?.pm}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                    {(m.subMedicines || []).map((sub, si) => (
                                                        <span key={si} className="text-xs text-slate-600 flex items-center gap-1">
                                                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                                            {sub.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                      </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-white border-t flex justify-end gap-2 shrink-0">
             {viewVisits && (
                <Button variant="outline" size="sm" onClick={() => downloadPatientPDF(viewVisits)} className="text-slate-600 border-slate-200">
                    <Download className="mr-2 h-3 w-3" /> PDF
                </Button>
             )}
             <Button size="sm" onClick={() => setViewVisits(null)} className="bg-slate-900 text-white hover:bg-slate-800">
                 Close Timeline
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG (UNCHANGED FUNCTIONALITY) --- */}
      <Dialog open={!!editPatient} onOpenChange={(open) => !open && setEditPatient(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white p-0 rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0 text-left">
              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Edit2 className="h-6 w-6" /></div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-800 uppercase">Edit Record</DialogTitle>
                    <DialogDescription>Updating details for {editPatient?.name}</DialogDescription>
                  </div>
              </div>
          </DialogHeader>
          
          {editPatient && (
            <Tabs defaultValue="personal" className="p-8">
                <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 mb-8 rounded-xl">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="work">Work/Family</TabsTrigger>
                    <TabsTrigger value="health">Health</TabsTrigger>
                    <TabsTrigger value="medicines">Medicines</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><Label>Full Name *</Label><Input value={editPatient.name} onChange={e => setEditPatient({...editPatient, name: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Patient Main Date</Label><Input type="date" value={editPatient.pMainDate || ''} onChange={e => setEditPatient({...editPatient, pMainDate: e.target.value})} /></div>
                        
                        <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={editPatient.birthDate || ''} onChange={e => {
                            setEditPatient({...editPatient, birthDate: e.target.value, age: calculateAge(e.target.value) || editPatient.age});
                        }} /></div>
                        <div className="space-y-2"><Label>Age *</Label><Input value={editPatient.age} onChange={e => setEditPatient({...editPatient, age: e.target.value})} /></div>
                        
                        <div className="space-y-2"><Label>Phone *</Label><Input value={editPatient.phoneNumber} onChange={e => setEditPatient({...editPatient, phoneNumber: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Education</Label><Input value={editPatient.education || ''} onChange={e => setEditPatient({...editPatient, education: e.target.value})} /></div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2"><Label>Weight (kg)</Label><Input value={editPatient.weight || ''} onChange={e => setEditPatient({...editPatient, weight: e.target.value})} /></div>
                           <div className="space-y-2"><Label>Height (cm)</Label><Input value={editPatient.height || ''} onChange={e => setEditPatient({...editPatient, height: e.target.value})} /></div>
                        </div>

                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <RadioGroup value={editPatient.gender} onValueChange={v => setEditPatient({...editPatient, gender: v})} className="flex gap-4 pt-2">
                                <div className="flex items-center space-x-1"><RadioGroupItem value="Male" id="m" /><Label htmlFor="m">Male</Label></div>
                                <div className="flex items-center space-x-1"><RadioGroupItem value="Female" id="f" /><Label htmlFor="f">Female</Label></div>
                            </RadioGroup>
                        </div>
                    </div>
                    <div className="space-y-2"><Label>Address</Label><Textarea value={editPatient.address || ''} onChange={e => setEditPatient({...editPatient, address: e.target.value})} /></div>
                </TabsContent>

                <TabsContent value="work" className="space-y-6">
                    <div className="space-y-2"><Label>Work Details / Occupation</Label><Textarea value={editPatient.work || ''} onChange={e => setEditPatient({...editPatient, work: e.target.value})} /></div>
                    
                    <div className="border-t pt-4 space-y-4">
                        <Label className="text-lg font-bold text-slate-700">Marital Status</Label>
                        <RadioGroup value={editPatient.maritalStatus || 'Unmarried'} onValueChange={v => setEditPatient({...editPatient, maritalStatus: v})} className="flex gap-6">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Unmarried" id="u" /><Label htmlFor="u">Unmarried</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Married" id="mar" /><Label htmlFor="mar">Married</Label></div>
                        </RadioGroup>

                        {editPatient.maritalStatus === 'Married' && (
                            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200 mt-4">
                                <h4 className="font-bold text-sm uppercase text-slate-500">Family Info</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Spouse Name</Label><Input value={editPatient.husbandName || ''} onChange={e => setEditPatient({...editPatient, husbandName: e.target.value})} /></div>
                                    <div className="space-y-2"><Label>Spouse Age</Label><Input type="number" value={editPatient.husbandAge || ''} onChange={e => setEditPatient({...editPatient, husbandAge: parseInt(e.target.value)})} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Has Children?</Label>
                                    <RadioGroup value={editPatient.hasChildren ? 'Yes' : 'No'} onValueChange={v => setEditPatient({...editPatient, hasChildren: v === 'Yes'})} className="flex gap-4">
                                        <div className="flex items-center space-x-1"><RadioGroupItem value="No" id="cNo" /><Label htmlFor="cNo">No</Label></div>
                                        <div className="flex items-center space-x-1"><RadioGroupItem value="Yes" id="cYes" /><Label htmlFor="cYes">Yes</Label></div>
                                    </RadioGroup>
                                </div>
                                {editPatient.hasChildren && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2"><Label>Child Name</Label><Input value={editPatient.childName || ''} onChange={e => setEditPatient({...editPatient, childName: e.target.value})} /></div>
                                        <div className="space-y-2"><Label>Child Age</Label><Input type="number" value={editPatient.childAge || ''} onChange={e => setEditPatient({...editPatient, childAge: parseInt(e.target.value)})} /></div>
                                        <div className="space-y-2"><Label>Child Study</Label><Input value={editPatient.childStudy || ''} onChange={e => setEditPatient({...editPatient, childStudy: e.target.value})} /></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="health" className="space-y-6">
                    <div className="space-y-2">
                        <Label className="font-bold text-blue-600">Main Health Concern *</Label>
                        <Textarea value={editPatient.healthConcerns.main} onChange={e => setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, main: e.target.value}})} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><Label>Physical</Label><Textarea value={editPatient.healthConcerns.physical || ''} onChange={e => setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, physical: e.target.value}})} /></div>
                        <div className="space-y-2"><Label>Emotional</Label><Textarea value={editPatient.healthConcerns.emotional || ''} onChange={e => setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, emotional: e.target.value}})} /></div>
                    </div>
                    <div className="space-y-2"><Label>Past History</Label><Textarea value={editPatient.healthConcerns.pastHistory || ''} onChange={e => setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, pastHistory: e.target.value}})} /></div>
                    
                    <div className="space-y-2">
                        <Label>Additional Concerns</Label>
                        {(editPatient.healthConcerns.additional || []).map((c, i) => (
                             <div key={i} className="flex gap-2 mb-2">
                                <Input value={c} onChange={e => {
                                    const newAdd = [...(editPatient.healthConcerns.additional || [])];
                                    newAdd[i] = e.target.value;
                                    setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, additional: newAdd}});
                                }} />
                                <Button variant="ghost" size="icon" onClick={() => {
                                    const newAdd = (editPatient.healthConcerns.additional || []).filter((_, idx) => idx !== i);
                                    setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, additional: newAdd}});
                                }}><X className="h-4 w-4" /></Button>
                             </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setEditPatient({...editPatient, healthConcerns: {...editPatient.healthConcerns, additional: [...(editPatient.healthConcerns.additional || []), '']}})}>
                            <Plus className="h-4 w-4 mr-2" /> Add Concern
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="medicines" className="space-y-6">
                {editPatient.medicines?.map((group: Prescription, gIdx: number) => (
                    <Card key={gIdx} className="border-2 border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                    <div className="bg-slate-50 p-4 flex justify-between items-center">
                        <span className="font-black text-slate-700 uppercase text-xs flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" /> Bottle: {group.bottleNumber}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => {
                           const newMeds = (editPatient.medicines || []).filter((_, i) => i !== gIdx);
                           setEditPatient({...editPatient, medicines: newMeds});
                        }} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400">SELECT BUNCH</Label>
                            <select className="w-full h-11 border-2 border-slate-50 rounded-xl px-3 bg-white" value={group.mainCategory} 
                            onChange={(e) => {
                                const selectedBunch = bunches.find(b => b.name === e.target.value);
                                const newMeds = [...(editPatient.medicines || [])];
                                newMeds[gIdx] = { 
                                ...newMeds[gIdx], 
                                mainCategory: e.target.value,
                                subMedicines: selectedBunch?.medicineIds?.map((m) => ({ name: typeof m === 'string' ? m : m.name, showReason: false, reason: '' })) || []
                                };
                                setEditPatient({...editPatient, medicines: newMeds});
                            }}>
                            <option value="">-- Choose --</option>
                            <option value="Main">Main</option>
                            {bunches.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
                            </select>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">BOTTLE #</Label>
                                    <RadioGroup value={group.bottleNumber.toString()} onValueChange={(val) => {
                                        const newMeds = [...(editPatient.medicines || [])];
                                        newMeds[gIdx].bottleNumber = parseInt(val) as 1|2|3;
                                        setEditPatient({...editPatient, medicines: newMeds});
                                    }} className="flex gap-2 pt-2">
                                        {[1,2,3].map(n => <div key={n} className="flex items-center space-x-1"><RadioGroupItem value={n.toString()} id={`b${n}-${gIdx}`}/><Label htmlFor={`b${n}-${gIdx}`}>{n}</Label></div>)}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400">SIZE</Label>
                                    <RadioGroup value={group.bottleSize || '15ml'} onValueChange={(val) => {
                                        const newMeds = [...(editPatient.medicines || [])];
                                        newMeds[gIdx].bottleSize = val as '15ml'|'30ml';
                                        setEditPatient({...editPatient, medicines: newMeds});
                                    }} className="flex gap-2 pt-2">
                                        <div className="flex items-center space-x-1"><RadioGroupItem value="15ml" id={`s15-${gIdx}`}/><Label htmlFor={`s15-${gIdx}`}>15ml</Label></div>
                                        <div className="flex items-center space-x-1"><RadioGroupItem value="30ml" id={`s30-${gIdx}`}/><Label htmlFor={`s30-${gIdx}`}>30ml</Label></div>
                                    </RadioGroup>
                                </div>
                           </div>
                        </div>

                        {/* SUB MEDICINES LIST */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                            {group.subMedicines.map((sub, sIdx) => (
                                <div key={sIdx} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Input value={sub.name} className="bg-white h-8" placeholder="Medicine Name" onChange={(e) => {
                                            const newMeds = [...(editPatient.medicines || [])];
                                            newMeds[gIdx].subMedicines[sIdx].name = e.target.value;
                                            setEditPatient({...editPatient, medicines: newMeds});
                                        }} />
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            const newMeds = [...(editPatient.medicines || [])];
                                            newMeds[gIdx].subMedicines[sIdx].showReason = !newMeds[gIdx].subMedicines[sIdx].showReason;
                                            setEditPatient({...editPatient, medicines: newMeds});
                                        }} className={sub.showReason ? "text-orange-500 bg-orange-50" : "text-slate-400"}><MessageSquare className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => {
                                            const newMeds = [...(editPatient.medicines || [])];
                                            newMeds[gIdx].subMedicines = newMeds[gIdx].subMedicines.filter((_, i) => i !== sIdx);
                                            setEditPatient({...editPatient, medicines: newMeds});
                                        }}><X className="h-4 w-4"/></Button>
                                    </div>
                                    {sub.showReason && (
                                        <Input value={sub.reason || ''} placeholder="Reason..." className="text-xs h-7 bg-orange-50/50 border-orange-100" onChange={(e) => {
                                            const newMeds = [...(editPatient.medicines || [])];
                                            newMeds[gIdx].subMedicines[sIdx].reason = e.target.value;
                                            setEditPatient({...editPatient, medicines: newMeds});
                                        }}/>
                                    )}
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" className="w-full border-dashed border text-blue-500" onClick={() => {
                                const newMeds = [...(editPatient.medicines || [])];
                                newMeds[gIdx].subMedicines.push({ name: '', showReason: false, reason: '' });
                                setEditPatient({...editPatient, medicines: newMeds});
                            }}><Plus className="h-3 w-3 mr-2"/> Add Row</Button>
                        </div>

                        {/* TIMINGS */}
                        <div className="grid grid-cols-3 gap-4 border-t pt-3">
                            <div className="space-y-1"><Label className="text-[10px] font-bold">AM</Label><Input value={group.timings?.am} onChange={e => {
                                const newMeds = [...(editPatient.medicines || [])];
                                newMeds[gIdx].timings.am = e.target.value;
                                setEditPatient({...editPatient, medicines: newMeds});
                            }} /></div>
                            <div className="space-y-1"><Label className="text-[10px] font-bold">PM</Label><Input value={group.timings?.pm} onChange={e => {
                                const newMeds = [...(editPatient.medicines || [])];
                                newMeds[gIdx].timings.pm = e.target.value;
                                setEditPatient({...editPatient, medicines: newMeds});
                            }} /></div>
                             <div className="space-y-1"><Label className="text-[10px] font-bold">FREQ</Label><Input value={group.timings?.freq || ''} onChange={e => {
                                const newMeds = [...(editPatient.medicines || [])];
                                newMeds[gIdx].timings.freq = e.target.value;
                                setEditPatient({...editPatient, medicines: newMeds});
                            }} /></div>
                        </div>
                        
                        {/* SUGGESTION */}
                         <div className="pt-2">
                             <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                                 const newMeds = [...(editPatient.medicines || [])];
                                 newMeds[gIdx].showSuggestion = !newMeds[gIdx].showSuggestion;
                                 setEditPatient({...editPatient, medicines: newMeds});
                             }}><Lightbulb className="h-3 w-3 mr-2"/> {group.showSuggestion ? 'Hide Suggestion' : 'Add Suggestion'}</Button>
                             {group.showSuggestion && (
                                 <Textarea value={group.suggestion || ''} onChange={e => {
                                     const newMeds = [...(editPatient.medicines || [])];
                                     newMeds[gIdx].suggestion = e.target.value;
                                     setEditPatient({...editPatient, medicines: newMeds});
                                 }} className="mt-2 text-xs bg-yellow-50/50" placeholder="Instructions..." />
                             )}
                         </div>

                    </CardContent>
                    </Card>
                ))}
                <Button variant="outline" className="w-full border-dashed border-2 py-6 rounded-2xl" 
                    onClick={() => setEditPatient({...editPatient, medicines: [...(editPatient.medicines || []), { id: Math.random(), bottleNumber: 1, bottleSize: '15ml', mainCategory: '', subMedicines: [], timings: {am:'', pm:'', freq:''} }]})}>
                    <Plus className="mr-2 h-4 w-4" /> ADD BOTTLE
                </Button>

                <div className="mt-8 space-y-2 border-t pt-4">
                    <Label className="font-bold">Overall Suggestions</Label>
                    <Textarea value={editPatient.overallSuggestion || ''} onChange={e => setEditPatient({...editPatient, overallSuggestion: e.target.value})} placeholder="General dietary or health advice..." />
                </div>
                </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="p-8 border-t bg-slate-50 flex gap-4">
            <Button variant="ghost" onClick={() => setEditPatient(null)} className="font-bold">CANCEL</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 font-black shadow-xl text-white hover:bg-blue-700">SAVE UPDATES</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}