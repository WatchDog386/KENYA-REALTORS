const fs = require('fs');
let content = fs.readFileSync('src/pages/ApplicationForm.tsx', 'utf-8');

content = content.replace(
  'const ApplicationForm = () => {',
  'import { UnitApplicationForm } from "@/components/UnitApplicationForm";\n\nconst ApplicationForm = () => {\n  const unitId = new URLSearchParams(window.location.search).get("unitId");'
);

content = content.replace(
  'const [activeTab, setActiveTab] = useState<"post" | "looking">("post");',
  'const [activeTab, setActiveTab] = useState<"post" | "looking" | "unit">(unitId ? "unit" : "post");'
);

content = content.replace(
  'const [submissionType, setSubmissionType] = useState<"post" | "looking" | null>(null);',
  'const [submissionType, setSubmissionType] = useState<"post" | "looking" | "unit" | null>(null);'
);

content = content.replace(
  '<TabsList className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-xl mb-6">',
  '<TabsList className={`grid ${unitId ? "grid-cols-3" : "grid-cols-2"} bg-slate-100 p-1.5 rounded-xl mb-6`}>\n                {unitId && (\n                  <TabsTrigger\n                    value="unit"\n                    className="rounded-lg data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 font-medium transition-all"\n                  >\n                    <Home className="w-4 h-4 mr-2" />\n                    Apply to Unit\n                  </TabsTrigger>\n                )}'
);

content = content.replace(
  '{/* POST RENTAL TAB */}',
  `{/* UNIT APPLICATION TAB */}\n            {activeTab === "unit" && (\n              <TabsContent value="unit" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">\n                <UnitApplicationForm onSuccess={() => { setSubmissionSuccess(true); setSubmissionType("unit"); }} />\n              </TabsContent>\n            )}\n\n            {/* POST RENTAL TAB */}`
);

content = content.replace(
  'if (submissionSuccess && submissionType === "post") {',
  'if (submissionSuccess && (submissionType === "post" || submissionType === "unit")) {'
);

content = content.replace(
  'Your rental property has been submitted',
  '{submissionType === "unit" ? "Your unit application has been submitted" : "Your rental property has been submitted"}'
);

content = content.replace(
  'Thank you for listing your property! Our team will review your application and get back to you within 48 hours.',
  '{submissionType === "unit" ? "Thank you for applying! The property manager will review your application." : "Thank you for listing your property! Our team will review your application and get back to you within 48 hours."}'
);

content = content.replace(
  /if \(type === "looking"\)/g,
  'if (unitId) { setActiveTab("unit"); } else if (type === "looking")'
);

content = content.replace(
  'onValueChange={(val: string) => { if (val === "post" || val === "looking") setActiveTab(val); }}',
  'onValueChange={(val: string) => { if (val === "post" || val === "looking" || val === "unit") setActiveTab(val as any); }}'
);

fs.writeFileSync('src/pages/ApplicationForm.tsx', content);
