import * as React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Plus, X, Pencil } from 'lucide-react';
import  type  { PatientMedicine } from '../../types/index';
import { toast } from 'sonner';

interface MedicineFieldData {
  originalName: string;
  editedName: string;
  isEditing: boolean;
  timings: { am?: string; pm?: string };
  bottleNumber: 1 | 2 | 3;
}

interface Medicine {
  id: string;
  name: string;
  category: string;
}

interface NewCaseFormMedicinesProps {
  medicines: PatientMedicine[];
  setMedicines: (medicines: PatientMedicine[]) => void;
  categories: string[];
  getMedicinesForCategory: (category: string) => Medicine[];
  editMedicine: (index: number) => void;
  removeMedicine: (index: number) => void;
}

export function NewCaseFormMedicines({
  medicines,
  setMedicines,
  categories,
  getMedicinesForCategory,
  editMedicine,
  removeMedicine
}: NewCaseFormMedicinesProps) {
  const [isAddingMedicine, setIsAddingMedicine] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [categoryMedicineFields, setCategoryMedicineFields] = React.useState<{
    [key: string]: MedicineFieldData;
  }>({});

  const startAddingMedicine = () => {
    setIsAddingMedicine(true);
    setSelectedCategory('');
    setCategoryMedicineFields({});
  };

  const cancelAddingMedicine = () => {
    setIsAddingMedicine(false);
    setSelectedCategory('');
    setCategoryMedicineFields({});
  };

  return (
    <div className="space-y-6">
      {!isAddingMedicine && (
        <Button 
          onClick={startAddingMedicine} 
          className="w-full bg-linear-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Medicine
        </Button>
      )}

      {isAddingMedicine && (
        <div className="space-y-6">
          <Card className="border-3 border-blue-500 shadow-xl">
            <CardHeader className="bg-linear-to-br from-blue-50 to-indigo-50 border-b-2 border-blue-300">
              <CardTitle className="text-blue-900">Select Medicine Category</CardTitle>
              <CardDescription className="text-blue-700">
                Choose a category to see all available medicines with editable fields
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-slate-800">Category</Label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    const categoryMedicines = getMedicinesForCategory(value);
                    
                    // Initialize all medicines from the category
                    const newFields: typeof categoryMedicineFields = {};
                    categoryMedicines.forEach(med => {
                      newFields[med.id] = {
                        originalName: med.name,
                        editedName: med.name,
                        isEditing: false,
                        timings: {},
                        bottleNumber: 1
                      };
                    });
                    setCategoryMedicineFields(newFields);
                  }}
                >
                  <SelectTrigger className="border-2 border-slate-300 h-12 text-base">
                    <SelectValue placeholder="Choose medicine category (GUT-4, COLD-8, PAIN-8, FEVER-8)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-base py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{category}</span>
                          <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">
                            {getMedicinesForCategory(category).length} medicines
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategory && (
                <div className="mt-4 p-4 bg-linear-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                  <p className="text-sm font-semibold text-green-800">
                    ✓ Selected: {selectedCategory} ({getMedicinesForCategory(selectedCategory).length} medicines below)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show all medicines from selected category */}
          {selectedCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-linear-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-purple-400">
                <h3 className="text-lg font-bold text-purple-900">
                  {selectedCategory} - All Medicines
                </h3>
                <p className="text-sm text-purple-700 font-semibold">
                  {getMedicinesForCategory(selectedCategory).length} available • All fields editable
                </p>
              </div>

              {getMedicinesForCategory(selectedCategory).map((medicine, idx) => {
                const field = categoryMedicineFields[medicine.id] || {
                  originalName: medicine.name,
                  editedName: medicine.name,
                  isEditing: false,
                  timings: {},
                  bottleNumber: 1
                };

                return (
                  <Card 
                    key={medicine.id} 
                    className="border-3 border-purple-300 hover:border-purple-500 transition-all shadow-md hover:shadow-lg"
                  >
                    <CardHeader className="bg-linear-to-br from-purple-50 to-pink-50 pb-4 border-b-2 border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-linear-to-br from-purple-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md">
                            {idx + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-purple-900">
                              {medicine.name}
                            </CardTitle>
                            <p className="text-xs text-purple-600 mt-1">
                              Original name - edit below if needed
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCategoryMedicineFields({
                              ...categoryMedicineFields,
                              [medicine.id]: {
                                ...field,
                                isEditing: !field.isEditing
                              }
                            });
                          }}
                          className={`border-2 ${field.isEditing ? 'border-green-500 bg-green-50' : 'border-purple-300'}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {field.isEditing ? 'Lock' : 'Edit Name'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                      {/* Medicine Name - Editable Field */}
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">MEDICINE NAME</span>
                        </Label>
                        <Input
                          value={field.editedName}
                          onChange={(e) => {
                            setCategoryMedicineFields({
                              ...categoryMedicineFields,
                              [medicine.id]: {
                                ...field,
                                editedName: e.target.value
                              }
                            });
                          }}
                          disabled={!field.isEditing}
                          className={`border-3 h-12 text-base ${
                            field.isEditing 
                              ? 'border-green-400 bg-white shadow-md' 
                              : 'border-slate-300 bg-slate-50'
                          }`}
                          placeholder="Edit medicine name"
                        />
                        {field.isEditing && (
                          <p className="text-xs text-green-600 font-semibold">
                            ✓ Editing enabled - you can change the name
                          </p>
                        )}
                      </div>

                      {/* Timing Section */}
                      <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">TIMING</span>
                        </Label>
                        
                        {/* AM Checkbox and Input */}
                        <div className="space-y-2 p-4 bg-linear-to-br from-amber-50 to-yellow-50 rounded-lg border-2 border-amber-300 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`${medicine.id}-am`}
                              checked={field.timings.am !== undefined}
                              onCheckedChange={(checked) => {
                                setCategoryMedicineFields({
                                  ...categoryMedicineFields,
                                  [medicine.id]: {
                                    ...field,
                                    timings: {
                                      ...field.timings,
                                      am: checked ? '' : undefined
                                    }
                                  }
                                });
                              }}
                              className="w-5 h-5"
                            />
                            <Label htmlFor={`${medicine.id}-am`} className="cursor-pointer font-bold text-amber-900 text-base">
                              ☀️ Morning (AM)
                            </Label>
                          </div>
                          {field.timings.am !== undefined && (
                            <Input
                              type="text"
                              value={field.timings.am}
                              onChange={(e) => {
                                setCategoryMedicineFields({
                                  ...categoryMedicineFields,
                                  [medicine.id]: {
                                    ...field,
                                    timings: {
                                      ...field.timings,
                                      am: e.target.value
                                    }
                                  }
                                });
                              }}
                              placeholder="e.g., 8:00, 9:30, 10"
                              className="border-2 border-amber-400 h-11 ml-8 text-base"
                            />
                          )}
                        </div>

                        {/* PM Checkbox and Input */}
                        <div className="space-y-2 p-4 bg-linear-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-300 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`${medicine.id}-pm`}
                              checked={field.timings.pm !== undefined}
                              onCheckedChange={(checked) => {
                                setCategoryMedicineFields({
                                  ...categoryMedicineFields,
                                  [medicine.id]: {
                                    ...field,
                                    timings: {
                                      ...field.timings,
                                      pm: checked ? '' : undefined
                                    }
                                  }
                                });
                              }}
                              className="w-5 h-5"
                            />
                            <Label htmlFor={`${medicine.id}-pm`} className="cursor-pointer font-bold text-indigo-900 text-base">
                              🌙 Evening (PM)
                            </Label>
                          </div>
                          {field.timings.pm !== undefined && (
                            <Input
                              type="text"
                              value={field.timings.pm}
                              onChange={(e) => {
                                setCategoryMedicineFields({
                                  ...categoryMedicineFields,
                                  [medicine.id]: {
                                    ...field,
                                    timings: {
                                      ...field.timings,
                                      pm: e.target.value
                                    }
                                  }
                                });
                              }}
                              placeholder="e.g., 6:00, 8:30, 9"
                              className="border-2 border-indigo-400 h-11 ml-8 text-base"
                            />
                          )}
                        </div>
                      </div>

                      {/* Bottle Number */}
                      <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">BOTTLE NUMBER</span>
                        </Label>
                        <RadioGroup 
                          value={field.bottleNumber.toString()} 
                          onValueChange={(value) => {
                            setCategoryMedicineFields({
                              ...categoryMedicineFields,
                              [medicine.id]: {
                                ...field,
                                bottleNumber: parseInt(value) as 1 | 2 | 3
                              }
                            });
                          }}
                          className="grid grid-cols-3 gap-3"
                        >
                          <div className="flex items-center space-x-2 p-3 bg-linear-to-br from-green-50 to-emerald-50 rounded-lg border-3 border-green-400 hover:border-green-500 transition-all cursor-pointer">
                            <RadioGroupItem value="1" id={`${medicine.id}-bottle1`} className="w-5 h-5" />
                            <Label htmlFor={`${medicine.id}-bottle1`} className="cursor-pointer font-bold text-green-800">Bottle 1</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 bg-linear-to-br from-blue-50 to-cyan-50 rounded-lg border-3 border-blue-400 hover:border-blue-500 transition-all cursor-pointer">
                            <RadioGroupItem value="2" id={`${medicine.id}-bottle2`} className="w-5 h-5" />
                            <Label htmlFor={`${medicine.id}-bottle2`} className="cursor-pointer font-bold text-blue-800">Bottle 2</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 bg-linear-to-br from-orange-50 to-amber-50 rounded-lg border-3 border-orange-400 hover:border-orange-500 transition-all cursor-pointer">
                            <RadioGroupItem value="3" id={`${medicine.id}-bottle3`} className="w-5 h-5" />
                            <Label htmlFor={`${medicine.id}-bottle3`} className="cursor-pointer font-bold text-orange-800">Bottle 3</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Add This Medicine Button */}
                      {(field.timings.am || field.timings.pm) && (
                        <div className="pt-2">
                          <Button 
                            onClick={() => {
                              // Add this specific medicine
                              const newMedicine: PatientMedicine = {
                                medicineName: field.editedName,
                                category: selectedCategory,
                                timings: field.timings,
                                bottleNumber: field.bottleNumber
                              };
                              setMedicines([...medicines, newMedicine]);
                              toast.success(`${field.editedName} added successfully!`);
                              
                              // Reset this field
                              setCategoryMedicineFields({
                                ...categoryMedicineFields,
                                [medicine.id]: {
                                  originalName: medicine.name,
                                  editedName: medicine.name,
                                  isEditing: false,
                                  timings: {},
                                  bottleNumber: 1
                                }
                              });
                            }}
                            className="w-full h-12 bg-linear-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg font-bold text-base"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Add {field.editedName} to Patient
                          </Button>
                        </div>
                      )}

                      {/* Warning if no timing selected */}
                      {!field.timings.am && !field.timings.pm && (
                        <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Please select at least AM or PM timing to add this medicine
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Done Button */}
              <Button 
                variant="outline" 
                onClick={cancelAddingMedicine}
                className="w-full border-3 border-slate-400 hover:bg-slate-100 py-6 text-base font-semibold"
              >
                Done Adding Medicines from {selectedCategory}
              </Button>
            </div>
          )}
        </div>
      )}

      {medicines.length > 0 && (
        <Card className="border-3 border-green-400 shadow-xl">
          <CardHeader className="bg-linear-to-br from-green-50 to-emerald-50 border-b-2 border-green-300">
            <CardTitle className="text-green-900 text-xl">✓ Added Medicines ({medicines.length})</CardTitle>
            <CardDescription className="text-green-700 font-semibold">
              These medicines will be prescribed to the patient
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {medicines.map((med, index) => (
              <div key={index} className="flex items-center justify-between p-4 border-3 border-slate-300 rounded-lg bg-linear-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all shadow-md">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {index + 1}
                    </div>
                    <p className="font-bold text-slate-900 text-base">{med.medicineName}</p>
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border-2 border-blue-300">
                      {med.category}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mt-2 ml-11 flex items-center gap-3 flex-wrap">
                    {med.timings.am && (
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg border-2 border-amber-300 font-semibold">
                        ☀️ AM: {med.timings.am}
                      </span>
                    )}
                    {med.timings.pm && (
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg border-2 border-indigo-300 font-semibold">
                        🌙 PM: {med.timings.pm}
                      </span>
                    )}
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg border-2 border-green-300 font-semibold">
                      📦 Bottle {med.bottleNumber}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => editMedicine(index)}
                    className="hover:bg-blue-100 border-2 border-transparent hover:border-blue-300"
                  >
                    <Pencil className="h-5 w-5 text-blue-600" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => removeMedicine(index)}
                    className="bg-red-500 hover:bg-red-600 border-2 border-red-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
