/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Pencil, Trash2, Plus, X, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Medicine {
  id?: string;
  _id?: string; 
  name: string;
  category: string;
  oneLiner: string;
  shortDescription?: string;
  longDescription?: string;
  images?: string[];
}

const CATEGORIES = ['Uncertainty', 'Oversensitive', 'Fear', 'Loneliness', 'Overcare', 'Lack of interest', 'Despair','Emergency'];

interface MedicineManagerProps {
  medicines: Medicine[];
  onNavigate: (page: string) => void;
  onSave: (medicine: any) => Promise<boolean | void>;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export function MedicineManager({ medicines, onNavigate, onSave, onDelete, onRefresh }: MedicineManagerProps) {
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Medicine>>({
    category: '',
    name: '',
    oneLiner: '', 
    shortDescription: '',
    longDescription: '',
    images: []
  });

  // FIX: Robust ID Normalization
  const safeMedicines = useMemo(() => {
    if (!Array.isArray(medicines)) return [];
    return medicines.map((m, index) => ({
      ...m,
      id: m._id || m.id || `temp-${index}`, // Prioritize MongoDB _id
      category: m.category?.trim() || 'Uncategorized'
    }));
  }, [medicines]);

  useEffect(() => {
    if (selectedMedicine) {
      const updated = safeMedicines.find(m => m.id === selectedMedicine.id);
      if (updated) setSelectedMedicine(updated);
    }
  }, [safeMedicines, selectedMedicine]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const openAddForm = () => {
    setFormData({ category: '', name: '', oneLiner: '', shortDescription: '', longDescription: '', images: [] });
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEdit = (med: Medicine, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ ...med });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSaveInternal = async () => {
    if (isSaving) return;
    if (!formData.category || !formData.name?.trim() || !formData.oneLiner?.trim()) {
      toast.error("Please fill in Name, Category, and One-Liner.");
      return;
    }

    try {
      setIsSaving(true);
      const success = await onSave(formData);
      if (success) {
        setIsFormOpen(false);
        // If we were in detail view, stay there, otherwise dashboard
        toast.success(isEditing ? "Entry Updated!" : "Medicine Added Successfully!");
      }
    } catch (error) {
      toast.error("Error: Could not save data.");
    } finally {
      setIsSaving(false);
    }
  };

  const uncategorized = safeMedicines.filter(m => 
    !CATEGORIES.some(cat => cat.toLowerCase() === m.category?.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex gap-2">
            {view === 'detail' && (
              <Button variant="ghost" onClick={() => setView('dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={() => onNavigate('home')}>Admin Home</Button>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} className={isSaving ? "animate-spin" : ""}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={openAddForm} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="mr-2 h-4 w-4" /> Add Medicine
          </Button>
        </div>

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {CATEGORIES.map((cat) => {
                const filteredMedicines = safeMedicines.filter(
                  (m) => m.category.toLowerCase() === cat.toLowerCase()
                );

                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h2 className="text-2xl font-bold text-slate-800">{cat}</h2>
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                        {filteredMedicines.length}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((med) => (
                          <Card
                            key={med.id}
                            className="group cursor-pointer hover:border-blue-500 hover:shadow-md transition-all bg-white"
                            onClick={() => {
                              setSelectedMedicine(med);
                              setView('detail');
                            }}
                          >
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600">
                                  {med.name}
                                </h4>
                                <p className="text-sm text-slate-500 italic truncate">
                                  {med.oneLiner || "View details..."}
                                </p>
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(med, e)}>
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete this medicine?")) onDelete(med.id!);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="py-6 text-center border-2 border-dashed rounded-xl text-slate-400 text-sm bg-white/50">
                          No entries in {cat}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UNCATEGORIZED/DEBUG SECTION */}
            {uncategorized.length > 0 && (
              <div className="mt-8 p-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-700 mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-bold">Uncategorized Data ({uncategorized.length})</h3>
                </div>
                <p className="text-sm text-amber-600 mb-4">These items have categories that don't match the main list or are missing categories.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {uncategorized.map(m => (
                    <div key={m.id} className="bg-white p-3 rounded shadow-sm border text-xs flex justify-between items-center">
                      <div className="truncate mr-2">
                        <span className="font-bold">{m.name}</span>
                        <code className="ml-2 bg-slate-100 px-1 rounded text-red-500">"{m.category}"</code>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={(e) => handleEdit(m, e as any)}>Fix</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selectedMedicine && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
             <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-8 rounded-2xl shadow-sm border">
                 <div className="flex justify-between items-start mb-4">
                   <Badge className="bg-blue-100 text-blue-700 px-3 py-1 border-none">
                     {selectedMedicine.category}
                   </Badge>
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={(e) => handleEdit(selectedMedicine, e as any)}>
                       <Pencil className="h-4 w-4 mr-2" /> Edit
                     </Button>
                     <Button variant="destructive" size="sm" onClick={() => { 
                       if(confirm("Delete this entry?")) {
                         onDelete(selectedMedicine.id!); 
                         setView('dashboard'); 
                       }
                     }}>
                       <Trash2 className="h-4 w-4 mr-2" /> Delete
                     </Button>
                   </div>
                 </div>
                 <h1 className="text-5xl font-black text-slate-900 mb-2">{selectedMedicine.name}</h1>
                 <p className="text-xl font-semibold text-blue-600 italic mb-8">"{selectedMedicine.oneLiner}"</p>
                 <div className="space-y-8">
                   <div>
                     <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-3">Description</h4>
                     <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-line">
                       {selectedMedicine.longDescription || "No detailed description provided."}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <ImageIcon className="mr-2 h-4 w-4 text-blue-500" /> Reference Gallery
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedMedicine.images && selectedMedicine.images.length > 0 ? (
                    selectedMedicine.images.map((img, i) => (
                      <img key={i} src={img} alt="Remedy" className="w-full h-64 object-cover rounded-xl border shadow-sm" />
                    ))
                  ) : (
                    <div className="h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center border-dashed border-2 text-slate-400">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-xs">No images uploaded</p>
                    </div>
                  )}
                </div>
             </div>
           </div>
        )}
      </div>

      {/* FORM MODAL */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? `Edit: ${formData.name}` : 'Create New Medicine Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="border-slate-200 bg-white"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Medicine Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">One-Liner Hook *</Label>
              <Input value={formData.oneLiner} onChange={e => setFormData({...formData, oneLiner: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Detailed Description</Label>
              <Textarea rows={6} value={formData.longDescription} onChange={e => setFormData({...formData, longDescription: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-3">
              <Label className="font-bold text-slate-700">Visual References</Label>
              <div className="grid grid-cols-4 gap-4">
                {formData.images?.map((img, idx) => (
                  <div key={idx} className="relative h-24 border rounded-lg overflow-hidden group shadow-sm">
                    <img src={img} alt="Preview" className="h-full w-full object-cover" />
                    <button onClick={() => setFormData(p => ({...p, images: p.images?.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-24 border-dashed border-2 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 bg-slate-50"><Plus className="h-6 w-6" /></button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveInternal} className="bg-blue-600 text-white px-8 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? "Processing..." : isEditing ? "Update Remedy" : "Save to Dashboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}