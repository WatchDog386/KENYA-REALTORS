const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/PropertyManager.tsx', 'utf8');

const stateInjection = \  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [unassignDialog, setUnassignDialog] = useState<{isOpen: boolean, propertyId: string, roleType: 'manager' | 'technician' | 'proprietor' | 'caretaker', recordId: string} | null>(null);\;
code = code.replace('  const [imagePreview, setImagePreview] = useState<string | null>(null);', stateInjection);

const unassignFuncRegex = /  const handleUnassignStaff = async[^]*?catch[^\}]+?\}[^\}]+\};/;

const unassignFuncStr = \  const handleUnassignStaff = async (propertyId: string, roleType: 'manager' | 'technician' | 'proprietor' | 'caretaker', recordId: string) => {
      setUnassignDialog({ isOpen: true, propertyId, roleType, recordId });
  };

  const confirmUnassignStaff = async () => {
      if (!unassignDialog) return;
      const { propertyId, roleType, recordId } = unassignDialog;
      setUnassignDialog({ ...unassignDialog, isOpen: false });
      
      try {
          if (roleType === 'manager') {
              const { error } = await supabase.from('property_manager_assignments').delete().eq('property_id', propertyId).eq('property_manager_id', recordId);
              if (error) throw error;
          } else if (roleType === 'technician') {
              const { error } = await supabase.from('technician_property_assignments').delete().eq('property_id', propertyId).eq('technician_id', recordId);
              if (error) throw error;
          } else if (roleType === 'proprietor') {
              const { error } = await supabase.from('proprietor_properties').delete().eq('property_id', propertyId).eq('proprietor_id', recordId);
              if (error) throw error;
          } else if (roleType === 'caretaker') {
              const { error } = await supabase.from('caretakers').update({ status: 'inactive' }).eq('property_id', propertyId).eq('user_id', recordId);
              if (error) throw error;
          }
          toast.success('Staff unassigned successfully');
          fetchAssignedStaff();
          setTimeout(() => setUnassignDialog(null), 300);
      } catch (err: any) {
          console.error('Error unassigning staff:', err);
          toast.error(err.message || 'Failed to unassign staff');
          setTimeout(() => setUnassignDialog(null), 300);
      }
  };\;

code = code.replace(unassignFuncRegex, unassignFuncStr);

fs.writeFileSync('src/components/portal/super-admin/PropertyManager.tsx', code);
console.log('Done!');

