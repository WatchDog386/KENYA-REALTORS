const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

const regex = /const handleDelete = async \(id: string\) => \{ if \(!confirm\('Are you sure you want to delete this application\?'\)\)[^]+?\} \};/m;

const replacement = "const handleDelete = async (id: string) => { \n" +
"    if (!confirm('Are you sure you want to delete this application?')) return; \n" +
"    setUpdatingId(id); \n" +
"    try { \n" +
"      const { data, error } = await supabase.from('lease_applications').delete().eq('id', id).select(); \n" +
"      if (error) throw error; \n" +
"      if (!data || data.length === 0) {\n" +
"        toast.error('Deletion failed: Permission denied or record not found.');\n" +
"        return;\n" +
"      }\n" +
"      toast.success('Application deleted successfully'); \n" +
"      setApplications(prev => prev.filter(a => a.id !== id));\n" +
"    } catch (error: any) { \n" +
"      console.error('Error:', error); \n" +
"      toast.error('Failed to delete application: ' + error.message); \n" +
"    } finally { \n" +
"      setUpdatingId(null); \n" +
"    } \n" +
"  };";

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', code);
