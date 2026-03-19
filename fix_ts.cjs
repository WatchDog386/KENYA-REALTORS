const fs = require('fs');

const files = ['src/components/portal/manager/ManagerTenants.tsx', 'frontend/src/components/portal/manager/ManagerTenants.tsx'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    // Remove the bad line
    txt = txt.replace(
        "const propertyName = properties.find(p => p.id === tenant.property_id)?.name || 'Unknown Property';",
        ""
    );

    fs.writeFileSync(file, txt);
    console.log("Updated", file);
});
