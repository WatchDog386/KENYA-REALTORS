const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

const replacement = \              // Create lease
              const rentAmount = app.units?.price || 0;
              const { error: leaseError } = await supabase.from('tenant_leases').insert({
                  unit_id: app.unit_id,
                  tenant_id: app.applicant_id,
                  start_date: now,
                  rent_amount: rentAmount,
                  status: 'active'
              });

              if (leaseError) throw leaseError;

              // Update user role to tenant
              const { error: userRoleError } = await supabase.from('user_roles').insert({
                  user_id: app.applicant_id,
                  role: 'tenant'
              });
              
              if (userRoleError && userRoleError.code !== '23505') { // Ignore unique violation if already tenant
                  console.warn('Could not add tenant role:', userRoleError);
              }

              // Update unit status to 'occupied'\;

code = code.replace(/              \/\/ Create lease([^]+?)              \/\/ Update unit status to 'occupied'/s, replacement);
fs.writeFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', code);
