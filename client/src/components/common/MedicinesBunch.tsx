/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useReducer, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Plus, Pencil, Trash2, Check, Loader2, Search, Package, RotateCcw, LayoutGrid, } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';

const initialState = { name: '', selectedMedicineIds: [] as string[] };

function formReducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case 'SET_NAME': return { ...state, name: action.payload };
    case 'TOGGLE_MEDICINE': {
      const isSelected = state.selectedMedicineIds.includes(action.payload);
      return {
        ...state,
        selectedMedicineIds: isSelected
          ? state.selectedMedicineIds.filter(id => id !== action.payload)
          : [...state.selectedMedicineIds, action.payload],
      };
    }
    case 'LOAD_BUNCH':
      return {
        name: action.payload.name,
        // Map to IDs even if populated objects are returned from backend
        selectedMedicineIds: action.payload.medicineIds.map((m: any) => m._id || m),
      };
    case 'CLEAR_ALL': return { ...state, selectedMedicineIds: [] };
    case 'RESET': return initialState;
    default: return state;
  }
}

export function MedicinesBunch({ onNavigate, medicines, onAddBunch, onDeleteBunch, bunches, isLoading }: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, dispatch] = useReducer(formReducer, initialState);

  const filteredMedicines = useMemo(() => 
    medicines.filter((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase())),
  [medicines, searchTerm]);

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Bunch name is required");
    if (formData.selectedMedicineIds.length === 0) return toast.error("Select at least one medicine");

    const success = await onAddBunch({ 
      id: editingId, 
      name: formData.name, 
      selectedMedicineIds: formData.selectedMedicineIds 
    });

    if (success) { 
      setIsDialogOpen(false); 
      setEditingId(null);
      dispatch({ type: 'RESET' }); 
    }
  };

  const openEdit = (bunch: any) => {
    setEditingId(bunch._id || bunch.id);
    dispatch({ type: 'LOAD_BUNCH', payload: bunch });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button variant="outline" size="icon" onClick={() => onNavigate('dashboard')} className="rounded-xl border-slate-200 shadow-sm">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-600" /> Prescription Bunches
              </h1>
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 px-6 h-11 transition-all active:scale-95 font-semibold"
            onClick={() => { setEditingId(null); dispatch({ type: 'RESET' }); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4 stroke-3" /> Create New Bunch
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        {isLoading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin h-10 w-10 text-indigo-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bunches?.map((bunch: any) => (
              <Card key={bunch._id} className="group border-none bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="h-1.5 bg-indigo-500 w-full" />
                <CardHeader className="p-6 pb-0 flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{bunch.name}</CardTitle>
                    <div className="flex items-center text-[11px] text-indigo-500 font-bold tracking-widest uppercase">
                      <Package className="h-3 w-3 mr-1" /> {bunch.medicineIds?.length || 0} ITEMS
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Medicine Names Display Section with Medium Weight */}
                  <div className="flex flex-wrap gap-2 mb-8 h-25 content-start overflow-y-auto custom-scrollbar pr-1">
                    {bunch.medicineIds?.map((med: any) => (
                      <Badge key={med._id || med} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-[12px] font-medium transition-colors hover:bg-indigo-50 hover:border-indigo-100 shadow-sm">
                        {med.name || "Medicine"}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-5 border-t border-slate-100 mt-auto">
                    <Button variant="secondary" size="sm" className="flex-1 bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl font-bold transition-all" onClick={() => openEdit(bunch)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl px-3 transition-colors" onClick={() => onDeleteBunch(bunch._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-[#F8FAFC]">
          <DialogHeader className="bg-indigo-600 p-8 text-white relative">
            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Package className="h-6 w-6" /> {editingId ? 'Refine Bunch Details' : 'Design New Bunch'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <Label className="text-xs uppercase font-extrabold text-slate-500 tracking-widest">1. Label Your Bunch</Label>
              <Input className="text-lg py-7 px-5 border-slate-200 rounded-2xl bg-white shadow-sm transition-all focus:border-indigo-500" placeholder="e.g., Post-Surgery Care Unit" value={formData.name} onChange={e => dispatch({ type: 'SET_NAME', payload: e.target.value })} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><Label className="text-xs uppercase font-extrabold text-slate-500 tracking-widest">2. Select Components</Label>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-400 hover:text-red-500" onClick={() => dispatch({ type: 'CLEAR_ALL' })}><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Selection</Button>
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 px-3 py-1 font-bold">{formData.selectedMedicineIds.length} Selected</Badge>
                </div>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500" />
                <Input placeholder="Search medicines in inventory..." className="pl-11 h-12 bg-white border-slate-200 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-85 overflow-y-auto pr-2 custom-scrollbar p-1">
                {filteredMedicines.map((med: any) => {
                  const medId = med._id || med.id;
                  const isSelected = formData.selectedMedicineIds.includes(medId);
                  return (
                    <div key={medId} onClick={() => dispatch({ type: 'TOGGLE_MEDICINE', payload: medId })} className={`group/item p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 flex justify-between items-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md text-slate-700'}`}>
                      <span className="text-sm font-bold truncate max-w-35">{med.name}</span>
                      {isSelected ? <div className="bg-white rounded-full p-0.5 shadow-sm"><Check className="h-3 w-3 text-indigo-600 stroke-4" /></div> : <div className="h-5 w-5 border-2 rounded-full border-slate-200 group-hover/item:border-indigo-300 transition-colors" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-slate-200 px-8 h-12 font-bold text-slate-600">Discard</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 px-10 h-12 rounded-xl shadow-lg font-bold text-white transition-all active:scale-95">
              {editingId ? 'Update Configuration' : 'Confirm & Save Bunch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}