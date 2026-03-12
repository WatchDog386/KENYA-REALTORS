const fs = require('fs');
let code = fs.readFileSync('src/pages/portal/SuperAdminUtilitiesManager.tsx', 'utf8');

const regex = /\/\/ 1\. Fetch all tenants with their units and properties[\s\S]*?eq\('status', 'active'\);/m;

const replacement = `// 1. Fetch all tenants with their units
      const { data: allTenants, error: tenantsError } = await supabase
        .from('tenants')
        .select(\`
          id,
          user_id,
          unit_id,
          status,
          units:unit_id(unit_number, price, property_id, properties:property_id(name))
        \`)
        .eq('status', 'active');
        
      // Also fetch profiles manually since foreign key from tenants to profiles might not exist directly
      let profilesMap = new Map();
      if (allTenants && allTenants.length > 0) {
        const userIds = [...new Set(allTenants.map(t => t.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .in('id', userIds);
          (profiles || []).forEach(p => profilesMap.set(p.id, p));
        }
      }`;

const mapInitRegex = /\/\/ Initialize all active tenants in the map first[\s\S]*?if \(!tenant\.units \|\| !tenant\.profiles\) continue;\s*const profile = Array\.isArray\(tenant\.profiles\)[^;]*;/m;
const mapInitReplacement = `// Initialize all active tenants in the map first
      if (allTenants) {
        for (const tenant of allTenants) {
          if (!tenant.units) continue;
          
          const profile = profilesMap.get(tenant.user_id) || {};`;

code = code.replace(regex, replacement).replace(mapInitRegex, mapInitReplacement);
code = code.replace(/tenant\.profile_id/g, "tenant.user_id");
code = code.replace(/profile_id,/g, "user_id,");

fs.writeFileSync('src/pages/portal/SuperAdminUtilitiesManager.tsx', code);
console.log('Fixed tenant fetch profiles logic!');
