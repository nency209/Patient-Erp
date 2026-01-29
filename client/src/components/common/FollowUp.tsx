/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader, DialogFooter } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, Calendar, User, Plus, Trash2, 
  Edit2, Check, Pill, MessageSquare, Lightbulb, Eye,
  History, ClipboardList, Clock, X, Phone, MapPin, Briefcase, GraduationCap, Printer
} from 'lucide-react';
import { patientApi } from '../../api/patientApi';
import { useBunches } from '../../hooks/useBunches';
import { format } from 'date-fns';
import { toast } from 'sonner';

// --- Types ---

interface SubMedicine {
  name: string;
  reason: string;
  showReason: boolean;
  isEditing: boolean;
}

interface MedicineGroup {
  id: string;
  bottleNumber: string;
  bottleSize: string;
  mainCategory: string;
  subMedicines: SubMedicine[];
  suggestion: string;
  showSuggestion: boolean;
  timings: { am: string; pm: string; freq: string };
}

interface FollowUpRecord {
  _id: string;
  date: string;
  notes?: string;
  visitObservation?: string;
  pastHistory?: string;
  medicines: MedicineGroup[];
  overallSuggestion?: string;
  previousAppointment?: string;
}

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  pMainDate: string;
  healthConcerns?: { main: string };
  phoneNumber?: string;
  address?: string;
  work?: string;
  education?: string;
  weight?: string;
  height?: string;
  maritalStatus?: string;
  followUps?: FollowUpRecord[];
}

interface FollowUpProps {
  onNavigate: (page: string) => void;
}

export function FollowUp({ onNavigate }: FollowUpProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewVisitDetail, setViewVisitDetail] = useState<FollowUpRecord | null>(null);
  const [viewPatientProfile, setViewPatientProfile] = useState<Patient | null>(null);
  
  // State for Printing
  const [printingVisit, setPrintingVisit] = useState<FollowUpRecord | null>(null);

  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [selectedPastFollowUpDate, setSelectedPastFollowUpDate] = useState<string>('none');
  
  const [followupChange, setFollowupChange] = useState('');
  const [pastHistory, setPastHistory] = useState(''); 
  const [visitObservation, setVisitObservation] = useState('');
  const [overallSuggestion, setOverallSuggestion] = useState('');
  const [followUpDate, setFollowUpDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [medicineGroups, setMedicineGroups] = useState<MedicineGroup[]>([]);
  const { bunches } = useBunches();

  const fetchPatients = useCallback(async () => {
    try {
      setLoadingPatients(true);
      const res = await patientApi.getAllPatients();
      setPatients(res.data);
    } catch (error) {
      toast.error("Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);

  const updateGroup = (id: string, updates: Partial<MedicineGroup>) => {
    setMedicineGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const addMedicineGroup = () => {
    const newGroup: MedicineGroup = {
      id: Math.random().toString(36).substring(2, 11),
      bottleNumber: "1", 
      bottleSize: "30ml",
      mainCategory: '',
      subMedicines: [],
      suggestion: '',
      showSuggestion: false,
      timings: { am: '', pm: '', freq: '' }
    };
    setMedicineGroups([...medicineGroups, newGroup]);
  };

  const handleBunchChange = (groupId: string, bunchName: string) => {
    let medicines: SubMedicine[] = [];
    if (bunchName === "Main" || bunchName === "Main2") {
      medicines = Array(7).fill(null).map(() => ({ 
        name: '', reason: '', showReason: false, isEditing: true 
      }));
    } else {
      const selectedBunch = bunches.find(b => b.name === bunchName);
      if (selectedBunch?.medicineIds) {
        medicines = selectedBunch.medicineIds.map((m: string | { name: string }) => ({ 
          name: typeof m === 'string' ? m : m.name, 
          reason: '', 
          showReason: false,
          isEditing: false
        }));
      }
    }
    updateGroup(groupId, { mainCategory: bunchName, subMedicines: medicines });
  };

  const handlePastFollowUpChange = (dateValue: string) => {
    setSelectedPastFollowUpDate(dateValue);
    if (dateValue === 'none') {
      setMedicineGroups([]);
      return;
    }
    const pastRecord = dateValue === 'initial' 
        ? undefined 
        : selectedPatient?.followUps?.find((f) => f.date === dateValue);

    if (pastRecord && pastRecord.medicines) {
      setMedicineGroups(pastRecord.medicines.map((m) => ({ 
        ...m, 
        id: Math.random().toString(36).substring(2, 11),
        subMedicines: m.subMedicines.map((sm) => ({ ...sm, isEditing: false })),
        timings: { am: m.timings?.am || '', pm: m.timings?.pm || '', freq: m.timings?.freq || '' }
      })));
    }
  };

  const handleSaveFollowUp = async () => {
    if (!followUpDate) {
      toast.error('Date is required');
      return;
    }

    try {
      const payload = {
        date: new Date(followUpDate).toISOString(),
        notes: followupChange,
        previousAppointment: selectedPastFollowUpDate, 
        pastHistory: pastHistory,
        visitObservation: visitObservation,
        medicines: medicineGroups.map(group => ({
          ...group,
          timings: {
            am: group.timings?.am || "",
            pm: group.timings?.pm || "",
            freq: group.timings?.freq || ""
          }
        })),
        overallSuggestion: overallSuggestion
      };

      if (editingFollowUpId) {
        await patientApi.updateFollowUp(selectedPatientId, editingFollowUpId, payload);
        toast.success('Visit record updated!');
      } else {
        await patientApi.addFollowUp(selectedPatientId, payload);
        toast.success('Follow-up saved successfully!');
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchPatients();
    } catch (error: unknown) {
      console.error("Save Error:", error);
      toast.error("Error saving follow-up.");
    }
  };

  const resetForm = () => {
    setFollowupChange('');
    setPastHistory('');
    setVisitObservation('');
    setOverallSuggestion('');
    setFollowUpDate(format(new Date(), 'yyyy-MM-dd'));
    setMedicineGroups([]);
    setSelectedPastFollowUpDate('none');
    setEditingFollowUpId(null);
  };

  const handleEditVisit = (followUp: FollowUpRecord) => {
    setEditingFollowUpId(followUp._id);
    setFollowupChange(followUp.notes || '');
    setPastHistory(followUp.pastHistory || '');
    setVisitObservation(followUp.visitObservation || '');
    setFollowUpDate(followUp.date ? new Date(followUp.date).toISOString().split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
    setOverallSuggestion(followUp.overallSuggestion || '');
    if (followUp.medicines) {
      setMedicineGroups(followUp.medicines.map((m) => ({ 
        ...m, 
        id: Math.random().toString(36).substring(2, 11) 
      })));
    }
    setIsAddDialogOpen(true);
  };

  const handleDeleteVisit = async (followUpId: string) => {
    if (!confirm("Delete this visit history?")) return;
    try {
      await patientApi.deleteFollowUp(selectedPatientId, followUpId);
      toast.success("Record deleted");
      fetchPatients();
    } catch (error) { toast.error("Delete failed"); }
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = (visit: FollowUpRecord) => {
    setPrintingVisit(visit);
    setTimeout(() => {
        window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* GLOBAL STYLES FOR PRINTING */}
      <style>{`
  @media print {
    /* This specific rule removes browser headers and footers */
    @page {
      margin: 0;
    }
    
    body {
      margin: 1.6cm; /* Adds margin back to the content so it doesn't touch the paper edge */
      visibility: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    #print-section, #print-section * {
      visibility: visible;
    }
    
    #print-section {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      display: block !important;
      background: white;
    }

    .no-print {
      display: none !important;
    }
  }
`}</style>

      {/* --- STANDARD UI (HIDDEN DURING PRINT) --- */}
      <div className="no-print">
        <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => onNavigate('dashboard')} className="rounded-full">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <h1 className="font-extrabold text-2xl text-slate-800 tracking-tight">FOLLOW UP</h1>
            </div>
            </div>
        </div>

        <div className="container mx-auto px-6 py-8">
            <div className="mb-8 max-w-lg text-left">
            <Label className="font-bold mb-2 block text-slate-700 uppercase tracking-widest text-[10px]">Select Patient</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="bg-white border-2 border-blue-50 h-14 rounded-2xl shadow-xs focus:ring-blue-200">
                <SelectValue placeholder={loadingPatients ? "Loading..." : "Search patient..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white">
                {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id} className="py-3 ">{p.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>

            {selectedPatient && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-4 text-left">
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden sticky top-24">
                    <div className="h-2 bg-blue-600" />
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
                        <User className="h-6 w-6" />
                        </div>
                        <div>
                        <CardTitle className="text-xl font-bold">{selectedPatient.name}</CardTitle>
                        <CardDescription className="font-medium">{selectedPatient.age}year • {selectedPatient.gender} • {selectedPatient.pMainDate}  </CardDescription>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <Label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Health Summary</Label>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">{selectedPatient.healthConcerns?.main}</p>
                    </div>
                    
                    <Button variant="outline" className="w-full rounded-xl border-slate-200 h-11 text-slate-600 font-bold hover:bg-slate-50" onClick={() => setViewPatientProfile(selectedPatient)}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                    </Button>

                    <Button className="w-full bg-blue-600 h-12 rounded-xl font-bold shadow-lg shadow-blue-100" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-5 w-5" /> Add New Follow-up
                    </Button>
                    </CardContent>
                </Card>
                </div>

                <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-xs border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-2">
                        <Clock className="h-5 w-5 text-blue-500" /> Timeline
                    </h2>
                    
                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddDialogOpen(open); }}>
                    <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-white p-0 border-none shadow-2xl rounded-3xl">
                        <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100 rounded-t-3xl text-left">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl">
                            <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                            <DialogTitle className="text-2xl font-black text-slate-800">Add New Follow-up</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium italic">Recording details for {selectedPatient.name}</DialogDescription>
                            </div>
                        </div>
                        </DialogHeader>
                        
                        <div className="p-8 space-y-10">
                        <div className="space-y-6 max-w-2xl mx-auto text-left">
                            <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Follow-up Date *</Label>
                            <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="h-12 rounded-xl border-slate-200" />
                            </div>
                            <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Follow-up Change</Label>
                            <Textarea value={followupChange} onChange={(e) => setFollowupChange(e.target.value)} placeholder="Condition improvements or issues..." className="rounded-xl border-slate-200" rows={3} />
                            </div>
                            <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Past History (Optional)</Label>
                            <Textarea value={pastHistory} onChange={(e) => setPastHistory(e.target.value)} placeholder="Any new medical background..." className="rounded-xl border-slate-200" rows={2} />
                            </div>
                            <div className="space-y-2">
                            <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Visit Observation</Label>
                            <Textarea value={visitObservation} onChange={(e) => setVisitObservation(e.target.value)} placeholder="Notes for this visit..." className="rounded-xl border-slate-200" rows={2} />
                            </div>
                        </div>

                        <section className="bg-linear-to-br from-blue-50 to-indigo-50/30 p-6 rounded-4xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs max-w-2xl mx-auto text-left">
                            <div className="space-y-1">
                            <Label className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <History className="h-5 w-5 text-blue-600" /> Repeat Follow-up?
                            </Label>
                            <p className="text-sm text-blue-600/70 font-medium">Auto-fill medicines from a previous date.</p>
                            </div>
                            <Select value={selectedPastFollowUpDate} onValueChange={handlePastFollowUpChange}>
                            <SelectTrigger className="bg-white w-full md:w-64 h-12 rounded-xl border-blue-100">
                                <SelectValue placeholder="-- New Selection --" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="none">-- New Selection --</SelectItem>
                                <SelectItem value="initial">Initial Consultation</SelectItem>
                                {selectedPatient.followUps?.map((f) => (
                                <SelectItem key={f.date} value={f.date}>{format(new Date(f.date), 'dd-MM-yyyy')}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </section>

                        <div className="space-y-6">
                            <Label className="font-black text-slate-700 uppercase tracking-tighter text-lg px-2 block text-left">Prescription Details</Label>
                            {medicineGroups.map((group, gIdx) => (
                            <Card key={group.id} className="border-2 border-slate-100 shadow-xs overflow-hidden rounded-4xl text-left">
                                <div className="bg-slate-50 p-4 flex justify-between items-center border-b">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-600 h-6 w-6 rounded-full p-0 flex items-center justify-center">{gIdx + 1}</Badge>
                                    <span className="font-bold text-slate-700 uppercase text-xs tracking-widest">Bottle Config</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setMedicineGroups(medicineGroups.filter((g) => g.id !== group.id))} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </div>
                                
                                <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Medicine Bunch</Label>
                                    <select className="w-full h-10 border-2 border-slate-50 rounded-xl px-3 bg-white" value={group.mainCategory} onChange={(e) => handleBunchChange(group.id, e.target.value)}>
                                        <option value="">-- Custom --</option>
                                        <option value="Main">Main</option>
                                        <option value="Main2">Main2</option>
                                        {bunches.map((b) => (
                                        <option key={b._id} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                    </div>
                                    <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bottle Type / #</Label>
                                    <div className="space-y-4">
                                        <RadioGroup 
                                        value={group.bottleNumber.toString()} 
                                        onValueChange={(val) => updateGroup(group.id, { bottleNumber: val })} 
                                        className="flex gap-4 pt-1"
                                        >
                                        {[1, 2, 3].map((n) => (
                                            <div key={n} className="flex items-center space-x-1">
                                            <RadioGroupItem value={n.toString()} id={`b-num-${group.id}-${n}`} />
                                            <Label htmlFor={`b-num-${group.id}-${n}`} className="text-sm font-bold">{n}</Label>
                                            </div>
                                        ))}
                                        </RadioGroup>
                                        <RadioGroup 
                                        value={group.bottleSize} 
                                        onValueChange={(val) => updateGroup(group.id, { bottleSize: val })} 
                                        className="flex gap-4"
                                        >
                                        {['15ml', '30ml'].map((vol) => (
                                            <div key={vol} className="flex items-center space-x-1">
                                            <RadioGroupItem value={vol} id={`b-sz-${group.id}-${vol}`} />
                                            <Label htmlFor={`b-sz-${group.id}-${vol}`} className="text-sm font-bold text-blue-600">{vol}</Label>
                                            </div>
                                        ))}
                                        </RadioGroup>
                                    </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/30 p-4 rounded-4xl border border-blue-100 space-y-2">
                                    {group.subMedicines.map((sub: SubMedicine, sIdx: number) => (
                                    <div key={sIdx} className="space-y-2 text-left">
                                        <div className={`bg-white border rounded-xl p-2 flex items-center gap-2 shadow-xs transition-all ${sub.isEditing ? 'border-blue-400 ring-1 ring-blue-50' : 'border-slate-200'}`}>
                                        {sub.isEditing ? (
                                            <Input 
                                            className="flex-1 h-8 text-sm border-none bg-slate-50 focus-visible:ring-0" 
                                            autoFocus 
                                            value={sub.name} 
                                            onChange={(e) => {
                                                const next = [...group.subMedicines];
                                                next[sIdx].name = e.target.value;
                                                updateGroup(group.id, { subMedicines: next });
                                            }} 
                                            />
                                        ) : (
                                            <div className="flex-1 px-2 text-sm font-medium text-slate-700">{sub.name || "---"}</div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                            const next = [...group.subMedicines];
                                            next[sIdx].isEditing = !next[sIdx].isEditing;
                                            updateGroup(group.id, { subMedicines: next });
                                            }}>
                                            {sub.isEditing ? <Check className="h-4 w-4 text-green-600"/> : <Edit2 className="h-3.5 w-3.5 text-slate-400" />}
                                            </Button>
                                            <Button variant="ghost" size="sm" className={`h-7 w-7 p-0 ${sub.showReason ? 'text-orange-500 bg-orange-50' : 'text-slate-300'}`} onClick={() => {
                                            const next = [...group.subMedicines];
                                            next[sIdx].showReason = !next[sIdx].showReason;
                                            updateGroup(group.id, { subMedicines: next });
                                            }}>
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => {
                                            const next = group.subMedicines.filter((_, i) => i !== sIdx);
                                            updateGroup(group.id, { subMedicines: next });
                                            }}>
                                            <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        </div>
                                        {sub.showReason && (
                                        <Input className="h-7 text-xs bg-orange-50 border-orange-100 ml-4 w-[calc(100%-1rem)]" value={sub.reason} placeholder="Add reason..." onChange={(e) => {
                                            const next = [...group.subMedicines];
                                            next[sIdx].reason = e.target.value;
                                            updateGroup(group.id, { subMedicines: next });
                                        }} />
                                        )}
                                    </div>
                                    ))}
                                    <Button variant="ghost" size="sm" className="w-full text-blue-600 border border-dashed border-blue-100 mt-2" onClick={() => {
                                    const next = [...group.subMedicines, { name: '', reason: '', showReason: false, isEditing: true }];
                                    updateGroup(group.id, { subMedicines: next });
                                    }}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-t pt-3">
                                {/* AM Input */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">AM</Label>
                                    <Textarea 
                                    value={group.timings?.am || ""} 
                                    placeholder="1-1-1" 
                                    onChange={(e) => updateGroup(group.id, { 
                                        timings: { ...group.timings, am: e.target.value } 
                                    })} 
                                    rows={1}
                                    className="min-h-[36px] rounded-xl resize-none py-2 text-sm"
                                    />
                                </div>

                                {/* PM Input */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">PM</Label>
                                    <Textarea 
                                    value={group.timings?.pm || ""} 
                                    placeholder="0-0-1" 
                                    onChange={(e) => updateGroup(group.id, { 
                                        timings: { ...group.timings, pm: e.target.value } 
                                    })} 
                                    rows={1}
                                    className="min-h-[36px] rounded-xl resize-none py-2 text-sm"
                                    />
                                </div>

                                {/* Frequency Input */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Times</Label>
                                    <Textarea 
                                    value={group.timings?.freq || ""} 
                                    placeholder="e.g. 3" 
                                    onChange={(e) => updateGroup(group.id, { 
                                        timings: { ...group.timings, freq: e.target.value } 
                                    })} 
                                    rows={1}
                                    className="min-h-[36px] rounded-xl resize-none py-2 text-sm"
                                    />
                                </div>
                                </div>
                                
                                <div className="space-y-2 pt-2">
                                    <Label className="text-[10px] font-bold uppercase text-blue-500 tracking-widest flex items-center gap-1">
                                    <Lightbulb className="h-3 w-3" /> Bottle Suggestion
                                    </Label>
                                    <Textarea 
                                    value={group.suggestion} 
                                    onChange={(e) => updateGroup(group.id, { suggestion: e.target.value })} 
                                    placeholder="Specific instructions for this bottle..." 
                                    rows={2} 
                                    className="rounded-xl border-slate-100 bg-slate-50/50 text-sm"
                                    />
                                </div>
                                </CardContent>
                            </Card>
                            ))}
                            <Button type="button" variant="outline" className="w-full border-dashed border-2 py-8 rounded-4xl text-blue-600 font-bold hover:bg-blue-50" onClick={addMedicineGroup}>
                            <Plus className="mr-2 h-5 w-5" /> ADD NEW BOTTLE
                            </Button>
                        </div>

                        <div className="space-y-3 border-t pt-6 text-left">
                            <Label className="font-bold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Overall Suggestion Overview</Label>
                            <Textarea value={overallSuggestion} onChange={(e) => setOverallSuggestion(e.target.value)} placeholder="General lifestyle or diet advice..." rows={3} className="rounded-2xl bg-slate-50 border-slate-200" />
                        </div>

                        <DialogFooter className="flex gap-3 mt-4">
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl flex-1 h-12 font-bold">CANCEL</Button>
                            <Button onClick={handleSaveFollowUp} className="bg-blue-600 hover:bg-indigo-700 flex-1 h-12 font-bold rounded-xl shadow-lg transition-all text-white">SAVE FOLLOW-UP</Button>
                        </DialogFooter>
                        </div>
                    </DialogContent>
                    </Dialog>
                </div>

                <ScrollArea className="h-[65vh] rounded-3xl">
                    <div className="space-y-4 pr-4 text-left">
                    {!selectedPatient.followUps || selectedPatient.followUps.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No visit history recorded yet.</p>
                        </div>
                    ) : (
                        selectedPatient.followUps.map((f: FollowUpRecord) => (
                        <Card key={f._id || f.date} className="group border-none shadow-xs hover:shadow-md transition-all rounded-3xl bg-white overflow-hidden ring-1 ring-slate-100/50">
                            <CardHeader className="flex flex-row justify-between items-center p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Calendar className="h-6 w-6" />
                                </div>
                                <div>
                                <CardTitle className="text-lg font-bold text-slate-800">{format(new Date(f.date), 'dd-MM-yyyy')}</CardTitle>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {f.medicines?.map((m, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-bold">
                                        {m.mainCategory || "Custom"}
                                    </Badge>
                                    ))}
                                </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setViewVisitDetail(f)} className="rounded-xl h-9 bg-slate-100 text-slate-600">Summary</Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-purple-400 hover:text-purple-600 rounded-xl" onClick={() => handlePrint(f)}>
                                <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-400 hover:text-blue-600 rounded-xl" onClick={() => handleEditVisit(f)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 rounded-xl" onClick={() => handleDeleteVisit(f._id)}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            </CardHeader>
                        </Card>
                        ))
                    )}
                    </div>
                </ScrollArea>
                </div>
            </div>
            )}
        </div>

        {/* MODAL: VIEW VISIT SUMMARY */}
        <Dialog open={!!viewVisitDetail} onOpenChange={() => setViewVisitDetail(null)}>
            <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border-none text-left">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <History className="h-6 w-6 text-blue-600" />
                Visit Detail: {viewVisitDetail && format(new Date(viewVisitDetail.date), 'dd-MM-yyyy')}
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] py-4 pr-2">
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Follow-up Change</Label>
                    <p className="text-sm font-medium text-slate-700">{viewVisitDetail?.notes || "No change noted"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Observation</Label>
                    <p className="text-sm font-medium text-slate-700">{viewVisitDetail?.visitObservation || "N/A"}</p>
                    </div>
                </div>

                {viewVisitDetail?.pastHistory && (
        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <Label className="text-[10px] font-black text-blue-400 uppercase block mb-1">Past History / Background</Label>
            <p className="text-sm font-medium text-slate-700">{viewVisitDetail.pastHistory}</p>
        </div>
        )}

                <div className="space-y-3">
                    <Label className="font-black text-blue-600 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <Pill className="h-4 w-4" /> Prescribed Dosage
                    </Label>
                    <div className="grid grid-cols-1 gap-4">
                    {viewVisitDetail?.medicines?.map((m: MedicineGroup, idx: number) => (
                        <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Bottle {m.bottleNumber} ({m.bottleSize})</span>
                            <span className="font-bold text-slate-800 text-lg uppercase tracking-tight">{m.mainCategory || "Custom Mix"}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {m.subMedicines?.map((sm, i) => (
                                <span key={i} className="text-[11px] text-slate-500 font-medium">{sm.name}{i < m.subMedicines.length - 1 ? ', ' : ''}</span>
                                ))}
                            </div>
                            </div>
                            <div className="text-right flex flex-col gap-1">
                            <Badge className="bg-indigo-600 text-white border-none text-[10px] px-3 py-1">
                                {m.timings?.am || '0'} AM - {m.timings?.pm || '0'} PM
                            </Badge>
                            {m.timings?.freq && (
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Total: {m.timings.freq} Times</span>
                            )}
                            </div>
                        </div>
                        {m.suggestion && (
                            <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-blue-600 italic">Instruction: {m.suggestion}</p>
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                </div>

                {viewVisitDetail?.overallSuggestion && (
                    <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl">
                    <Label className="text-[10px] font-black text-amber-500 uppercase block mb-1">General Instructions</Label>
                    <p className="text-amber-900 font-medium italic">"{viewVisitDetail.overallSuggestion}"</p>
                    </div>
                )}
                </div>
            </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* MODAL FOR VIEWING PATIENT PROFILE DETAILS */}
        <Dialog open={!!viewPatientProfile} onOpenChange={() => setViewPatientProfile(null)}>
            <DialogContent className="max-w-3xl bg-white rounded-3xl p-0 border-none shadow-2xl overflow-hidden">
            <div className="bg-blue-600 p-8 text-white">
                <div className="flex items-center gap-6">
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                    <User className="h-10 w-10 text-white" />
                </div>
                <div className="text-left">
                    <h2 className="text-3xl font-black tracking-tight">{viewPatientProfile?.name}</h2>
                    <p className="text-blue-100 font-medium">{viewPatientProfile?.age} Years Old • {viewPatientProfile?.gender} • {viewPatientProfile?.maritalStatus}</p>
                </div>
                </div>
            </div>

            <ScrollArea className="max-h-[70vh] p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-6">
                    <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest border-b pb-2">Contact & Personal</h3>
                    <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                        <p className="font-bold text-slate-700">{viewPatientProfile?.phoneNumber || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                        <p className="font-bold text-slate-700 leading-tight">{viewPatientProfile?.address || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Occupation</p>
                        <p className="font-bold text-slate-700">{viewPatientProfile?.work || "N/A"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Education</p>
                        <p className="font-bold text-slate-700">{viewPatientProfile?.education || "N/A"}</p>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest border-b pb-2">Medical Overview</h3>
                    <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                        <p className="text-[10px] font-black text-red-400 uppercase mb-1">Main Concern</p>
                        <p className="text-sm font-bold text-red-900 leading-relaxed">{viewPatientProfile?.healthConcerns?.main}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Weight</p>
                        <p className="text-xl font-black text-blue-700">{viewPatientProfile?.weight || "--"} <span className="text-xs font-bold uppercase">kg</span></p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Height</p>
                        <p className="text-xl font-black text-blue-700">{viewPatientProfile?.height || "--"} <span className="text-xs font-bold uppercase">cm</span></p>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </ScrollArea>
            
            <div className="p-6 bg-slate-50 border-t flex justify-end">
                <Button onClick={() => setViewPatientProfile(null)} className="rounded-xl px-8 font-bold">Close Profile</Button>
            </div>
            </DialogContent>
        </Dialog>
      </div>

      {/* --- PRINT TEMPLATE (STRICT IMAGE REPLICA) --- */}
        <div id="print-section" className="hidden bg-white p-4 text-slate-900 font-sans">
  {printingVisit && selectedPatient && (
    <div className="max-w-4xl mx-auto border-[1px] border-slate-300 p-4">
      {/* Header: Name, Contact, Date, ID */}
      <div className="flex justify-between items-start mb-3 border-b-2 border-black pb-1">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase leading-none">{selectedPatient.name}</h2>
          <p className="text-[10px] font-bold mt-1">+{selectedPatient.phoneNumber || '91 9601111615'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold"> FollowUp Date: {format(new Date(printingVisit.date), 'dd/MM/yyyy')}</p>
          {/* <p className="text-[9px] font-bold">id : {selectedPatient._id.substring(0, 4).toUpperCase() || '0001'}</p> */}
        </div>
      </div>

      {/* Top Observations Sections */}
      <div className="space-y-2 mb-6">
        <div className="border-[1.5px] border-black rounded-xl p-2 text-left">
          <p className="text-[10px] font-black underline mb-0.5">follow up change :</p>
          <p className="text-[11px] min-h-[30px] leading-tight">{printingVisit.notes}</p>
        </div>
        <div className="border-[1.5px] border-black rounded-xl p-2 text-left">
          <p className="text-[10px] font-black underline mb-0.5">visit observation</p>
          <p className="text-[11px] min-h-[30px] leading-tight">{printingVisit.visitObservation}</p>
        </div>
        <div className="border-[1.5px] border-black rounded-xl p-2 text-left">
          <p className="text-[10px] font-black underline mb-0.5">past history</p>
          <p className="text-[11px] min-h-[30px] leading-tight">{printingVisit.pastHistory}</p>
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="space-y-4">
        {printingVisit.medicines.map((med, idx) => (
          <div key={idx} className="flex gap-3 items-stretch">
            
            {/* LEFT BOX – Bottle Info */}
            <div className="w-[160px] border-[1.5px] border-black rounded-2xl p-2 text-center flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold text-left mb-0.5">bottle {med.bottleNumber} – {med.bottleSize || "30ml"}</p>
                <div className="border-y-[1.5px] border-black py-1 my-1">
                  <p className="text-sm font-black uppercase underline leading-tight">
                    {med.mainCategory || "PANIC"}
                  </p>
                  <p className="text-[9px] font-black mt-1">
                    {med.timings?.freq || 2}-times
                  </p>
                </div>
                <div className="space-y-2 mt-3 text-[9px] font-black">
                  <div className="flex items-center">
                    <span className="w-6 text-left">am:</span>
                    <div className="flex-1 border-b-[1.5px] border-black h-3 text-center text-[10px]">{med.timings?.am}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-left">pm:</span>
                    <div className="flex-1 border-b-[1.5px] border-black h-3 text-center text-[10px]">{med.timings?.pm}</div>
                  </div>
                </div>
              </div>
              {/* <p className="text-[10px] font-black mt-2 pt-1 border-t border-black">bottles 2</p> */}
            </div>

           
<div className="flex-1 flex flex-col gap-2">
  <div className="border-[1.5px] border-black rounded-2xl p-3 bg-white min-h-[80px]">
    {/* Use flex-wrap to ensure names go to the next line if they don't fit, and add spacing */}
    <div className="flex flex-row flex-wrap gap-x-2 gap-y-1 text-[10px] font-bold uppercase text-left leading-tight">
      {med.subMedicines.map((sub, sIdx) => (
        <span key={sIdx}>
          {sub.name}
          {/* Add a comma separator if it's not the last item, similar to image 426a00.png */}
          {sIdx < med.subMedicines.length - 1 ? "," : ""}
        </span>
      ))}
    </div>
  </div>
  
  <div className="border-[1.5px] border-black rounded-2xl p-2 bg-white min-h-[40px]">
    <div className="flex flex-col gap-0.5 text-[9px] font-bold uppercase text-left leading-none">
      {med.subMedicines.filter(sm => sm.reason).map((sub, rIdx) => (
        <p key={rIdx}>
          • {sub.name}: <span className="italic font-medium normal-case">{sub.reason}</span>
        </p>
      ))}
    </div>
  </div>
</div>

            {/* RIGHT BOX – Bottle Suggestion */}
            <div className="w-[160px] border-[1.5px] border-black rounded-2xl p-2 text-left">
              <p className="text-[9px] font-black text-center border-b-[1.5px] border-black pb-0.5 mb-1">
                bottle suggestion
              </p>
              <p className="text-[10px] leading-snug italic font-medium">
                {med.suggestion}
              </p>
            </div>

          </div>
        ))}
      </div>

      {/* Bottom Suggestions Section */}
      <div className="mt-6">
        <p className="text-[11px] font-black text-left mb-1 underline">suggestions</p>
        <div className="border-[1.5px] border-black rounded-xl p-2 t w-full min-h-[60px] text-[11px] text-left pt-1 leading-normal">
          {printingVisit.overallSuggestion}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <div className="w-[200px] text-center">
          <div className="border-b-[1.5px] border-black mb-1 h-8"></div>
          <p className="text-[9px] font-black uppercase tracking-widest">
            internal record signature
          </p>
        </div>
      </div>
    </div>
  )}
</div>
    </div>
  );
}