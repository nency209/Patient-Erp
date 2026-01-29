// src/components/common/NewCaseForm.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

import { Plus, X, ArrowLeft, Trash2, MessageSquare, Lightbulb, Loader2, Pill, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Medicine } from '../../types/index';
import { toast } from 'sonner';
import { usePatients } from '../../hooks/usePatients';
import { useBunches } from '../../hooks/useBunches';

interface NewCaseFormProps {
  onNavigate: (page: string) => void;
  medicinesBunch: Medicine[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any; // Added for Edit functionality
}

interface MedicineItem {
  name: string;
  reason: string;
  showReason: boolean;
  isEditing?: boolean; //
}

interface MedicineGroup {
  id: string;
  mainCategory: string; 
  subMedicines: MedicineItem[];
  // Update this line to include freq
  timings: { am: string; pm: string; freq: string }; 
  bottleNumber: 1 | 2 | 3;
  bottleSize: '15ml' | '30ml';
  suggestion: string;
  showSuggestion: boolean;
}

export function NewCaseForm({ onNavigate,  initialData }: NewCaseFormProps) {
  const [activeTab, setActiveTab] = useState<string>('personal');
  const { savePatient, isSubmitting } = usePatients();
  const { bunches, loading: loadingBunches } = useBunches();

  // --- PERSONAL INFORMATION ---
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [gender, setGender] = useState<string>(initialData?.gender || '');
  const [weight, setWeight] = useState(initialData?.weight || '');
  const [height, setHeight] = useState(initialData?.height || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [birthDate, setBirthDate] = useState<string>(initialData?.birthDate || '');
  const [education, setEducation] = useState(initialData?.education || '');
  const [maritalStatus, setMaritalStatus] = useState<string>(initialData?.maritalStatus || 'Unmarried');
  
  // NEW: Patient Main Date
  const [patientMainDate, setPatientMainDate] = useState<string>(initialData?.patientMainDate || format(new Date(), 'yyyy-MM-dd'));

  // --- MARITAL & FAMILY INFORMATION ---
  const [husbandName, setHusbandName] = useState(initialData?.husbandName || '');
  const [husbandAge, setHusbandAge] = useState(initialData?.husbandAge?.toString() || '');
  const [hasChildren, setHasChildren] = useState<string>(initialData?.hasChildren ? 'Yes' : 'No');
  const [childName, setChildName] = useState(initialData?.childName || '');
  const [childAge, setChildAge] = useState(initialData?.childAge?.toString() || '');
  const [childStudy, setChildStudy] = useState(initialData?.childStudy || '');

  // --- WORK Detail ---
  const [workDetail, setWorkDetail] = useState(initialData?.work || '');

  // --- HEALTH CONCERNS ---
  const [mainConcern, setMainConcern] = useState(initialData?.healthConcerns?.main || '');
  const [physicalConcern, setPhysicalConcern] = useState(initialData?.healthConcerns?.physical || '');
  const [emotionalConcern, setEmotionalConcern] = useState(initialData?.healthConcerns?.emotional || '');
  const [pastHistory, setPastHistory] = useState(initialData?.healthConcerns?.pastHistory || '');
  const [additionalConcerns, setAdditionalConcerns] = useState<string[]>(initialData?.healthConcerns?.additional || ['']);

  // --- MEDICINE LOGIC ---
  const [medicineGroups, setMedicineGroups] = useState<MedicineGroup[]>(initialData?.medicines || []);
  const [overallSuggestion, setOverallSuggestion] = useState(initialData?.overallSuggestion || '');

  // Helper to calculate age from birthdate
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

  const handleBunchChange = (groupId: string, bunchName: string) => {
    let medicines: MedicineItem[] = [];
    if (bunchName === "Main" || bunchName === "Main2") {
      medicines = Array(7).fill(null).map(() => ({ name: '', reason: '', showReason: false }));
    } else {
      const selectedBunch = bunches.find(b => b.name === bunchName);
      if (selectedBunch && selectedBunch.medicineIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        medicines = selectedBunch.medicineIds.map((m: any) => ({
          name: typeof m === 'string' ? m : m.name,
          reason: '',
          showReason: false
        }));
      }
    }
    setMedicineGroups(prev =>
      prev.map((g) => g.id === groupId ? { ...g, mainCategory: bunchName, subMedicines: medicines } : g)
    );
  };

  const addMedicineGroup = () => {
  const newGroup: MedicineGroup = {
    id: Math.random().toString(36).substring(2, 11),
    mainCategory: '',
    subMedicines: [],
    // Update timings to include freq
    timings: { am: '', pm: '', freq: '' }, 
    bottleNumber: 1,
    bottleSize: '15ml',
    suggestion: '',
    showSuggestion: false,
  };
  setMedicineGroups([...medicineGroups, newGroup]);
};

  const updateGroup = (id: string, updates: Partial<MedicineGroup>) => {
    setMedicineGroups(prev => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const handleSubmit = async () => {
    if (!name || !age || !phoneNumber || !gender || !mainConcern) {
      toast.error('Required: Name, Age, Phone, Gender, and Main Health Concern');
      return;
    }

    const patientData = {
      name, age: parseInt(age), gender, weight, height, address, phoneNumber,
      birthDate, education, maritalStatus, pMainDate: patientMainDate,
      work: workDetail || undefined,
      husbandName: maritalStatus === 'Married' ? husbandName : undefined,
      husbandAge: (maritalStatus === 'Married' && husbandAge) ? parseInt(husbandAge) : undefined,
      hasChildren: hasChildren === 'Yes',
      childName: hasChildren === 'Yes' ? childName : undefined,
      childAge: (hasChildren === 'Yes' && childAge) ? parseInt(childAge) : undefined,
      childStudy: hasChildren === 'Yes' ? childStudy : undefined,
      healthConcerns: {
        main: mainConcern, physical: physicalConcern || undefined,
        emotional: emotionalConcern || undefined, pastHistory: pastHistory || undefined,
        additional: additionalConcerns.filter((c) => c.trim() !== ''),
      },
      medicines: medicineGroups,
      overallSuggestion: overallSuggestion || undefined,
    };

    await savePatient(patientData, () => onNavigate('dashboard'));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="hover:bg-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {initialData && (
             <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1 px-3">
               <Edit2 className="h-3 w-3 mr-2" /> Editing Profile
             </Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-2xl text-slate-900">{initialData ? 'Edit Patient Case' : 'New Case Registration'}</CardTitle>
            <CardDescription className="text-slate-600">Complete required sections (*) to register/update the patient</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 h-auto mb-6">
                <TabsTrigger value="personal" className="py-2.5">Personal Info</TabsTrigger>
                <TabsTrigger value="work" className="py-2.5">Work</TabsTrigger>
                <TabsTrigger value="health" className="py-2.5">Health Concerns</TabsTrigger>
                <TabsTrigger value="medicines" className="py-2.5">Medicines</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pMainDate">Patient Main Date *</Label>
                    <Input id="pMainDate" type="date" value={patientMainDate} onChange={(e) => setPatientMainDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input 
                      id="birthDate" 
                      type="date" 
                      value={birthDate} 
                      onChange={(e) => {
                        const dob = e.target.value;
                        setBirthDate(dob);
                        setAge(calculateAge(dob));
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age in years" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input id="education" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. Graduate" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4 pt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><Label htmlFor="male">Male</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><Label htmlFor="female">Female</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Contact number" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Weight</Label><Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg" /></div>
                    <div className="space-y-2"><Label>Height</Label><Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="cm" /></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Residential address" rows={2} />
                </div>

                <div className="space-y-3">
                  <Label>Marital Status</Label>
                  <RadioGroup value={maritalStatus} onValueChange={setMaritalStatus} className="flex gap-6">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Unmarried" id="unmarried" /><Label htmlFor="unmarried">Unmarried</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Married" id="married" /><Label htmlFor="married">Married</Label></div>
                  </RadioGroup>
                </div>

                {maritalStatus === 'Married' && (
                  <Card className="border-slate-200 bg-slate-50">
                    <CardHeader><CardTitle className="text-lg">Family Info</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Spouse Name</Label><Input value={husbandName} onChange={(e) => setHusbandName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Spouse Age</Label><Input type="number" value={husbandAge} onChange={(e) => setHusbandAge(e.target.value)} /></div>
                      </div>
                      <div className="space-y-3">
                        <Label>Has Children</Label>
                        <RadioGroup value={hasChildren} onValueChange={setHasChildren} className="flex gap-6">
                           <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="childNo" /><Label htmlFor="childNo">No</Label></div>
                           <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="childYes" /><Label htmlFor="childYes">Yes</Label></div>
                        </RadioGroup>
                      </div>
                      {hasChildren === 'Yes' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="space-y-2"><Label>Child Name</Label><Input value={childName} onChange={(e) => setChildName(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Child Age</Label><Input type="number" value={childAge} onChange={(e) => setChildAge(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Study</Label><Input value={childStudy} onChange={(e) => setChildStudy(e.target.value)} /></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-end pt-4"><Button onClick={() => setActiveTab('work')} className="bg-blue-600 px-8">Next</Button></div>
              </TabsContent>

              {/* Work and Health tabs same as previous version... */}

              <TabsContent value="work" className="space-y-6">
                <div className="space-y-2">
                  <Label>Work Details / Occupation</Label>
                  <Textarea value={workDetail} onChange={(e) => setWorkDetail(e.target.value)} placeholder="Type of work etc..." rows={4} className="bg-white" />
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('personal')}>Previous</Button>
                  <Button onClick={() => setActiveTab('health')} className="bg-blue-600 px-8">Next</Button>
                </div>
              </TabsContent>

              <TabsContent value="health" className="space-y-6">
                <div className="space-y-2">
                  <Label>Main Health Concern *</Label>
                  <Textarea value={mainConcern} onChange={(e) => setMainConcern(e.target.value)} rows={3} placeholder="Primary reason for visit..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Physical Concern</Label><Textarea value={physicalConcern} onChange={(e) => setPhysicalConcern(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Emotional Concern</Label><Textarea value={emotionalConcern} onChange={(e) => setEmotionalConcern(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Past Medical History</Label><Textarea value={pastHistory} onChange={(e) => setPastHistory(e.target.value)} /></div>
                <div className="space-y-4">
                  <Label>Additional Concerns</Label>
                  {additionalConcerns.map((concern, index) => (
                    <div key={index} className="flex gap-3">
                      <Input value={concern} placeholder="Add concern..." className="flex-1" onChange={(e) => {
                         const newConcerns = [...additionalConcerns];
                         newConcerns[index] = e.target.value;
                         setAdditionalConcerns(newConcerns);
                      }} />
                      {additionalConcerns.length > 1 && <Button variant="destructive" size="icon" onClick={() => setAdditionalConcerns(additionalConcerns.filter((_, i) => i !== index))}><X className="h-4 w-4" /></Button>}
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setAdditionalConcerns([...additionalConcerns, ''])} className="w-full border-dashed"><Plus className="h-4 w-4 mr-2" />Add Field</Button>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('work')}>Previous</Button>
                  <Button onClick={() => setActiveTab('medicines')} className="bg-blue-600 px-8">Next</Button>
                </div>
              </TabsContent>

              <TabsContent value="medicines" className="space-y-6">
                <div className="space-y-6">
                  {medicineGroups.map((group, gIdx) => (
                    <Card key={group.id} className="border-2 border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50 p-3 flex justify-between items-center border-b">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-blue-600" />
                          <span className="font-bold text-slate-700 uppercase text-xs">Bottle {gIdx + 1}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setMedicineGroups(medicineGroups.filter((g) => g.id !== group.id))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                      
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Select Bunch {loadingBunches && <Loader2 className="h-3 w-3 animate-spin" />}</Label>
                            <select className="w-full h-10 border rounded-md px-3 bg-white text-sm" value={group.mainCategory} onChange={(e) => handleBunchChange(group.id, e.target.value)}>
                              <option value="">-- Select --</option>
                              <option value="Main">Main</option>
                               <option value="Main2">Main2</option>
                              {bunches.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
                            </select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Bottle #</Label>
                              <RadioGroup value={group.bottleNumber.toString()} onValueChange={(val) => updateGroup(group.id, { bottleNumber: parseInt(val) as 1 | 2 | 3 })} className="flex gap-4 pt-2">
                                {[1, 2, 3].map(n => (
                                  <div key={n} className="flex items-center space-x-1">
                                    <RadioGroupItem value={n.toString()} id={`bn-${group.id}-${n}`} />
                                    <Label htmlFor={`bn-${group.id}-${n}`}>{n}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                            <div className="space-y-2">
                              <Label>Size</Label>
                              <RadioGroup value={group.bottleSize} onValueChange={(val) => updateGroup(group.id, { bottleSize: val as '15ml' | '30ml' })} className="flex gap-4 pt-2">
                                <div className="flex items-center space-x-1"><RadioGroupItem value="15ml" id={`s15-${group.id}`} /><Label htmlFor={`s15-${group.id}`}>15ml</Label></div>
                                <div className="flex items-center space-x-1"><RadioGroupItem value="30ml" id={`s30-${group.id}`} /><Label htmlFor={`s30-${group.id}`}>30ml</Label></div>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                         {group.subMedicines.map((sub, sIdx) => (
  <div key={sIdx} className="space-y-2">
    <div className={`bg-white border rounded-lg p-2 flex items-center gap-2 shadow-sm transition-all ${sub.isEditing ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200'}`}>
      
      {sub.isEditing ? (
        // EDIT MODE: Input field
        <Input 
          className="flex-1 h-9 text-sm border-none focus-visible:ring-0 bg-slate-50"
          placeholder="Medicine Name..."
          autoFocus
          value={sub.name}
          onChange={(e) => {
            const newSubs = [...group.subMedicines];
            newSubs[sIdx].name = e.target.value;
            updateGroup(group.id, { subMedicines: newSubs });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newSubs = [...group.subMedicines];
              newSubs[sIdx].isEditing = false;
              updateGroup(group.id, { subMedicines: newSubs });
            }
          }}
        />
      ) : (
        // VIEW MODE: Just text
        <div className="flex-1 px-3 py-1 text-sm text-slate-700 font-medium">
          {sub.name || <span className="text-slate-400 italic">Empty medicine name</span>}
        </div>
      )}

      {/* EDIT/SAVE TOGGLE BUTTON */}
      <Button 
        variant="ghost" 
        size="sm" 
        className={sub.isEditing ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:text-blue-600"}
        onClick={() => {
          const newSubs = [...group.subMedicines];
          newSubs[sIdx].isEditing = !newSubs[sIdx].isEditing;
          updateGroup(group.id, { subMedicines: newSubs });
        }}
      >
        {sub.isEditing ? <Plus className="h-4 w-4 rotate-45" /> : <Edit2 className="h-3.5 w-3.5" />}
      </Button>

      {/* REASON TOGGLE */}
      <Button 
        variant="ghost" 
        size="sm" 
        className={sub.showReason ? 'text-orange-600 bg-orange-50' : 'text-slate-400'} 
        onClick={() => {
          const newSubs = [...group.subMedicines];
          newSubs[sIdx].showReason = !newSubs[sIdx].showReason;
          updateGroup(group.id, { subMedicines: newSubs });
        }}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      {/* DELETE BUTTON */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-red-400 hover:text-red-600 hover:bg-red-50" 
        onClick={() => {
          const newSubs = group.subMedicines.filter((_, i) => i !== sIdx);
          updateGroup(group.id, { subMedicines: newSubs });
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>

    {sub.showReason && (
      <Input 
        className="h-8 text-xs bg-orange-50 border-orange-100 ml-4 w-[calc(100%-1rem)]" 
        placeholder="Reason for this medicine..." 
        value={sub.reason} 
        onChange={(e) => {
          const newSubs = [...group.subMedicines];
          newSubs[sIdx].reason = e.target.value;
          updateGroup(group.id, { subMedicines: newSubs });
        }} 
      />
    )}
  </div>
))}
                          <Button variant="ghost" size="sm" className="w-full text-blue-600 border border-dashed border-blue-200 mt-2" onClick={() => {
                             const newSubs = [...group.subMedicines, { name: '', reason: '', showReason: false }];
                             updateGroup(group.id, { subMedicines: newSubs });
                          }}><Plus className="h-3 w-3 mr-2" />Add row</Button>
                        </div>

                      <div className="grid grid-cols-3 gap-4 border-t pt-3">
  <div className="space-y-1">
    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">AM</Label>
    <Input 
      value={group.timings.am} 
      placeholder="1-1-1" 
      onChange={(e) => updateGroup(group.id, { timings: { ...group.timings, am: e.target.value } })} 
      className="h-9 rounded-xl border-slate-200"
    />
  </div>
  <div className="space-y-1">
    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">PM</Label>
    <Input 
      value={group.timings.pm} 
      placeholder="0-0-1" 
      onChange={(e) => updateGroup(group.id, { timings: { ...group.timings, pm: e.target.value } })} 
      className="h-9 rounded-xl border-slate-200"
    />
  </div>
  <div className="space-y-1">
    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Times</Label>
    <Input 
      value={group.timings.freq} 
      placeholder="e.g. 3" 
      type="number"
      onChange={(e) => updateGroup(group.id, { timings: { ...group.timings, freq: e.target.value } })} 
      className="h-9 rounded-xl border-slate-200"
    />
  </div>
</div>
                        
                        <div className="pt-2">
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => updateGroup(group.id, { showSuggestion: !group.showSuggestion })}>
                            <Lightbulb className="h-3 w-3 mr-2" /> {group.showSuggestion ? 'Hide Suggestion' : 'Add Bottle Suggestion'}
                          </Button>
                          {group.showSuggestion && <Textarea className="mt-2 text-sm bg-white" placeholder="Specific instructions..." value={group.suggestion} onChange={(e) => updateGroup(group.id, { suggestion: e.target.value })} />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" className="w-full border-dashed border-2 py-8 text-blue-600 font-bold" onClick={addMedicineGroup}><Plus className="mr-2 h-5 w-5" /> ADD NEW BOTTLE</Button>
                </div>

                <div className="mt-8 space-y-2 border-t pt-6">
                  <Label className="font-bold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Overall Suggestions</Label>
                  <Textarea value={overallSuggestion} onChange={(e) => setOverallSuggestion(e.target.value)} placeholder="Dietary or general instructions..." rows={3} />
                </div>

                <div className="flex justify-between pt-6 border-t mt-8">
                  <Button variant="outline" onClick={() => setActiveTab('health')}>Previous</Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white px-10 shadow-lg font-bold">
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Registration' : 'Complete Registration'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}