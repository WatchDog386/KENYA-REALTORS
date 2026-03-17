const fs = require('fs');
let content = fs.readFileSync('src/pages/ApplicationForm.tsx', 'utf-8');
content = content.replace('const ApplicationForm = () => {', 'import { UnitApplicationForm } from \"@/components/UnitApplicationForm\";

const ApplicationForm = () => {
  const unitId = new URLSearchParams(window.location.search).get(\"unitId\");');
content = content.replace('const [activeTab, setActiveTab] = useState<"post" | "looking">("post");', 'const [activeTab, setActiveTab] = useState<"post" | "looking" | "unit">(unitId ? "unit" : "post");');
content = content.replace('const [submissionType, setSubmissionType] = useState<"post" | "looking" | null>(null);', 'const [submissionType, setSubmissionType] = useState<"post" | "looking" | "unit" | null>(null);');
content = content.replace('<TabsList className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-xl mb-6">', '<TabsList className={\"grid \ bg-slate-100 p-1.5 rounded-xl mb-6\"}>
                {unitId && (
                  <TabsTrigger
                    value=\"unit\"
                    className=\"rounded-lg data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 font-medium transition-all\"
                  >
                    <Home className=\"w-4 h-4 mr-2\" />
                    Apply to Unit
                  </TabsTrigger>
                )}');
content = content.replace('{/* POST RENTAL TAB */}', '{/* UNIT APPLICATION TAB */}
            {activeTab === "unit" && (
              <TabsContent value=\"unit\" className=\"space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500\">
                <UnitApplicationForm onSuccess={() => { setSubmissionSuccess(true); setSubmissionType("unit\"); }} />
              </TabsContent>
            )}

            {/* POST RENTAL TAB */}');
content = content.replace('{ submissionSuccess && submissionType === "post" }', '{ submissionSuccess && (submissionType === "post" || submissionType === "unit") }');
fs.writeFileSync('src/pages/ApplicationForm.tsx', content);
