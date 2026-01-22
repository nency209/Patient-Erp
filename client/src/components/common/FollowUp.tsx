/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
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
  History, ClipboardList, Clock, X, Phone, MapPin, Briefcase, GraduationCap
} from 'lucide-react';
import { patientApi } from '../../api/patientApi';
import { useBunches } from '../../hooks/useBunches';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface FollowUpProps {
  onNavigate: (page: string) => void;
}

export function FollowUp({ onNavigate }: FollowUpProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewVisitDetail, setViewVisitDetail] = useState<any>(null);
  const [viewPatientProfile, setViewPatientProfile] = useState<any>(null);

  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [selectedPastFollowUpDate, setSelectedPastFollowUpDate] = useState<string>('none');
  
  const [followupChange, setFollowupChange] = useState('');
  const [pastHistory, setPastHistory] = useState(''); 
  const [visitObservation, setVisitObservation] = useState('');
  const [overallSuggestion, setOverallSuggestion] = useState('');
  const [followUpDate, setFollowUpDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [medicineGroups, setMedicineGroups] = useState<any[]>([]);
  const { bunches } = useBunches();

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = await patientApi.getAllPatients();
      setPatients(res.data);
    } catch (error) {
      toast.error("Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);

  const updateGroup = (id: string, updates: any) => {
    setMedicineGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const addMedicineGroup = () => {
    const newGroup = {
      id: Math.random().toString(36).substring(2, 11),
      bottleNumber: "1", 
      bottleSize: "30ml", // Default size
      mainCategory: '',
      subMedicines: [],
      suggestion: '',
      showSuggestion: false,
      timings: { am: '', pm: '', freq: '' }
    };
    setMedicineGroups([...medicineGroups, newGroup]);
  };

  const handleBunchChange = (groupId: string, bunchName: string) => {
    let medicines: any[] = [];
    if (bunchName === "Main") {
      medicines = Array(7).fill(null).map(() => ({ 
        name: '', reason: '', showReason: false, isEditing: true 
      }));
    } else {
      const selectedBunch = bunches.find(b => b.name === bunchName);
      if (selectedBunch?.medicineIds) {
        medicines = selectedBunch.medicineIds.map((m: any) => ({ 
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
    const pastRecord = dateValue === 'initial' ? selectedPatient : selectedPatient?.followUps?.find((f: any) => f.date === dateValue);
    if (pastRecord && pastRecord.medicines) {
      setMedicineGroups(pastRecord.medicines.map((m: any) => ({ 
        ...m, 
        id: Math.random().toString(36).substring(2, 11),
        subMedicines: m.subMedicines.map((sm: any) => ({ ...sm, isEditing: false })),
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
    // Construct the payload to match your Backend Schema requirements
    const payload = {
      date: new Date(followUpDate).toISOString(),
      notes: followupChange,
      // Map the 'Repeat Follow-up' selection to the schema field
      previousAppointment: selectedPastFollowUpDate, 
      // Ensure these match your schema (add them to schema if not there)
      pastHistory: pastHistory,
      visitObservation: visitObservation,
      medicines: medicineGroups.map(group => ({
        ...group,
        // Ensure timings are clean before sending
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
  } catch (error: any) {
    // Log the actual error response to help debugging
    console.error("Save Error:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || "Error saving follow-up.";
    toast.error(errorMessage);
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

  const handleEditVisit = (followUp: any) => {
    setEditingFollowUpId(followUp._id);
    setFollowupChange(followUp.notes || '');
    setPastHistory(followUp.pastHistory || '');
    setVisitObservation(followUp.visitObservation || '');
    setFollowUpDate(followUp.date ? new Date(followUp.date).toISOString().split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
    setOverallSuggestion(followUp.overallSuggestion || '');
    if (followUp.medicines) {
      setMedicineGroups(followUp.medicines.map((m: any) => ({ 
        ...m, 
        id: m.id || Math.random().toString(36).substring(2, 11) 
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

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
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
                            {selectedPatient.followUps?.map((f: any) => (
                              <SelectItem key={f.date} value={f.date}>{format(new Date(f.date), 'dd MMM yyyy')}</SelectItem>
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
                                {group.subMedicines.map((sub: any, sIdx: number) => (
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
                                          const next = group.subMedicines.filter((_: any, i: number) => i !== sIdx);
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
  {/* AM Input - Changed to Textarea */}
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

  {/* PM Input - Changed to Textarea */}
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

  {/* Frequency Input - Changed to Textarea */}
  <div className="space-y-1">
    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Times</Label>
    <Textarea 
      value={group.timings?.freq || ""} 
      placeholder="e.g. 3" 
      // Removed type="number" since this is now a textarea
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
                    selectedPatient.followUps.map((f: any) => (
                      <Card key={f._id || f.date} className="group border-none shadow-xs hover:shadow-md transition-all rounded-3xl bg-white overflow-hidden ring-1 ring-slate-100/50">
                        <CardHeader className="flex flex-row justify-between items-center p-6">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                               <Calendar className="h-6 w-6" />
                             </div>
                             <div>
                               <CardTitle className="text-lg font-bold text-slate-800">{format(new Date(f.date), 'MMMM do, yyyy')}</CardTitle>
                               <div className="flex flex-wrap gap-1 mt-1">
                                 {f.medicines?.map((m: any, idx: number) => (
                                   <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-bold">
                                     {m.mainCategory || "Custom"}
                                   </Badge>
                                 ))}
                               </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setViewVisitDetail(f)} className="rounded-xl h-9 bg-slate-100 text-slate-600">Summary</Button>
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
              Visit Detail: {viewVisitDetail && format(new Date(viewVisitDetail.date), 'dd MMM yyyy')}
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

               <div className="space-y-3">
                <Label className="font-black text-blue-600 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <Pill className="h-4 w-4" /> Prescribed Dosage
                </Label>
                <div className="grid grid-cols-1 gap-4">
                  {viewVisitDetail?.medicines?.map((m: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Bottle {m.bottleNumber} ({m.bottleSize})</span>
                          <span className="font-bold text-slate-800 text-lg uppercase tracking-tight">{m.mainCategory || "Custom Mix"}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.subMedicines?.map((sm: any, i: number) => (
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
  );
}