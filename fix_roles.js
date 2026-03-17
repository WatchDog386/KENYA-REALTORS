
const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/PropertyManager.tsx', 'utf8');

code = code.replace(/await\s+supabase\.from\('technician_property_assignments'\)\.select\('property_id,\s*technician_id'\)/, wait supabase.from('technician_property_assignments').select('property_id, technician_id').eq('is_active', true));

code = code.replace(/await\s+supabase\.from\('proprietor_properties'\)\.select\('property_id,\s*proprietor_id'\)/, wait supabase.from('proprietor_properties').select('property_id, proprietor_id').eq('is_active', true));

fs.writeFileSync('src/components/portal/super-admin/PropertyManager.tsx', code);
console.log('done');

