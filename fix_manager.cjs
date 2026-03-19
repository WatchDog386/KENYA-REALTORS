const fs = require('fs');
let code = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

const regex = /const handleStatusChange = async[^{]+{([^]+?)} catch/s;

const replacement = \const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const { error } = await supabase
        .from('lease_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      if (newStatus === 'manager_approved') {
        const app = applications.find(a => a.id === applicationId);
        if (app && app.applicant_id && app.unit_id && app.property_id) {        
            toast.success('Application approved by manager. Pending Superadmin approval.');
        } else {
            toast.error('Application data missing. Cannot process.');
        }
      } else {
        toast.success(\\\Application marked as \\\\);
      }

      setApplications(
        applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );
    } catch\;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', code);
