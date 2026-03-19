const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

const regex = /const handleDelete = async \(id: string\) => \{ if \(!confirm\('Are you sure you want to delete this application\?'\)\)[^]+?\} \};/m;

const replacement = \const handleDelete = async (id: string) => { 
    if (!confirm('Are you sure you want to delete this application?')) return; 
    setUpdatingId(id); 
    try { 
      const { data, error } = await supabase.from('lease_applications').delete().eq('id', id).select(); 
      if (error) throw error; 
      if (!data || data.length === 0) {
        toast.error('Deletion failed: Permission denied or record not found.');
        return;
      }
      toast.success('Application deleted successfully'); 
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch (error: any) { 
      console.error('Error:', error); 
      toast.error('Failed to delete application: ' + error.message); 
    } finally { 
      setUpdatingId(null); 
    } 
  };\;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', code);
