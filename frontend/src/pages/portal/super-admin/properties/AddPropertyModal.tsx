import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Home, Calculator, Loader2, Building, ImageIcon, MapPin, Grid } from 'lucide-react';
import { CreatePropertyDTO } from '@/services/propertyService';
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from 'framer-motion';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: CreatePropertyDTO) => Promise<void>;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePropertyDTO>({
    name: '',
    location: '',
    image_url: '',
    units: [{ name: '', units_count: 0, price_per_unit: 0 }]
  });

  const handleAddUnit = () => {
    setFormData({
      ...formData,
      units: [...formData.units, { name: '', units_count: 0, price_per_unit: 0 }]
    });
  };

  const handleRemoveUnit = (index: number) => {
    const newUnits = [...formData.units];
    newUnits.splice(index, 1);
    setFormData({ ...formData, units: newUnits });
  };

  const handleUnitChange = (index: number, field: keyof typeof formData.units[0], value: any) => {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setFormData({ ...formData, units: newUnits });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        location: '',
        image_url: '',
        units: [{ name: '', units_count: 0, price_per_unit: 0 }]
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = formData.units.reduce((sum, u) => sum + Number(u.units_count || 0), 0);
  const expectedIncome = formData.units.reduce((sum, u) => sum + (Number(u.units_count || 0) * Number(u.price_per_unit || 0)), 0);

  const unitTypeOptions = [
    "Bedsitter", 
    "Studio", 
    "One Bedroom", 
    "Two Bedroom", 
    "Three Bedroom", 
    "Shop", 
    "Office", 
    "Penthouse",
    "Maisonette",
    "Villa",
    "Other"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-white shadow-xl rounded-xl border border-slate-200">
        {/* Header - Clean White */}
        <div className="bg-white border-b border-slate-100 p-6">
          <DialogHeader className="p-0 space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Building className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Add New Property</DialogTitle>
                <p className="text-slate-500 text-sm font-medium">
                  Enter property details and unit breakdown below.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8 bg-white">
          {/* Section 1: Property Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              Property Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Property Name</Label>
                <div className="relative">
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Sunrise Apartments"
                    className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Location</Label>
                <div className="relative">
                  <Input 
                    value={formData.location} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Westlands, Nairobi"
                    className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-sm">Cover Image URL</Label>
                <div className="relative">
                  <Input 
                    value={formData.image_url} 
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Section 2: Unit Configuration */}
          <div className="space-y-5">
             <div className="flex justify-between items-end">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  Unit Configuration
                </h3>
                <Button size="sm" variant="outline" onClick={handleAddUnit} className="h-8 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg gap-1.5 text-xs font-bold transition-all">
                   <Plus className="w-3.5 h-3.5" /> Add Unit Type
                </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {formData.units.map((unit, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group relative grid grid-cols-12 gap-3 items-end bg-slate-50/50 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">Unit Type</Label>
                      {/* Using a datalist or simpler Input with suggestions for unit types */}
                      <div className="relative">
                         <Input 
                            list={`unit-types-${index}`}
                            placeholder="Select or type..." 
                            value={unit.name}
                            onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                            className="h-9 border-slate-200 bg-white text-sm font-medium focus:border-slate-400 focus:ring-slate-400 rounded-md shadow-sm" 
                         />
                         <datalist id={`unit-types-${index}`}>
                            {unitTypeOptions.map(opt => <option key={opt} value={opt} />)}
                         </datalist>
                      </div>
                    </div>
                    
                    <div className="col-span-4 md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">Count</Label>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="0" 
                        value={unit.units_count}
                        onChange={(e) => handleUnitChange(index, 'units_count', Number(e.target.value))}
                        className="h-9 border-slate-200 bg-white text-sm font-medium text-center focus:border-slate-400 focus:ring-slate-400 rounded-md shadow-sm"
                      />
                    </div>
                    
                    <div className="col-span-7 md:col-span-4 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">Rent (KES)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold z-10">KES</span>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0" 
                          value={unit.price_per_unit}
                          onChange={(e) => handleUnitChange(index, 'price_per_unit', Number(e.target.value))}
                          className="pl-10 h-9 border-slate-200 bg-white text-sm font-medium text-right focus:border-slate-400 focus:ring-slate-400 rounded-md shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-1 flex justify-center pb-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveUnit(index)} 
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        disabled={formData.units.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {formData.units.length === 0 && (
                <div onClick={handleAddUnit} className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                    <Home className="w-8 h-8 mb-2 opacity-50" />
                    <p className="font-semibold text-sm">Add your first unit type</p>
                </div>
              )}
            </div>
          </div>

           {/* Financial Summary Card - Clean & Minimal */}
           <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-5 mt-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white border border-slate-100 rounded-full shadow-sm">
                     <Calculator className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Projected Monthly Income</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                       <span className="text-sm text-slate-500 mr-1 font-medium">KES</span>
                       {expectedIncome.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                 <div className="flex gap-6 text-sm">
                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-slate-500 text-xs font-semibold uppercase mr-2">Units:</span>
                        <span className="font-bold text-slate-900">{totalUnits}</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-slate-500 text-xs font-semibold uppercase mr-2">Types:</span>
                        <span className="font-bold text-slate-900">{formData.units.length}</span>
                    </div>
                </div>
             </div>
           </div>

        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-white">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg">
             Cancel
          </Button>
          <Button 
             onClick={handleSubmit} 
             disabled={loading || !formData.name || totalUnits === 0} 
             className="bg-slate-900 hover:bg-slate-800 text-white px-6 font-bold rounded-lg shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyModal;
