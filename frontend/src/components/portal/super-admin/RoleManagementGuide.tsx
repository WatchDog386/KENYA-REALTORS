// src/components/portal/super-admin/RoleManagementGuide.tsx
/**
 * Super Admin Role Management Guide
 * 
 * This file provides templates and guidance for Super Admin pages
 * needed to manage the new roles: Technician, Proprietor, and Caretaker
 */

// ============================================================================
// TECHNICIAN ASSIGNMENT WORKFLOW
// ============================================================================

export const TechnicianAssignmentWorkflow = `
1. CREATE TECHNICIAN ROLE
   - User registers with role = "technician"
   - Selects technician category (plumbing, electrical, etc.)
   - Optionally adds certifications

2. SUPER ADMIN ASSIGNS TO PROPERTIES
   - Navigate to: Super Admin > Role Management > Technicians
   - Find technician
   - Add properties they'll serve
   
3. TECHNICIAN RECEIVES JOBS
   - Maintenance requests route automatically
   - Based on category and property assignment
   - Technician dashboard shows assigned jobs

4. JOB MANAGEMENT
   - Technician accepts/rejects
   - Updates status
   - Uploads completion photos
   - System rates technician

EXAMPLE CODE:
  const assignTech = async (technicianId: string, propertyId: string) => {
    await technicianService.assignTechnicianToProperty(technicianId, propertyId)
    toast.success('Technician assigned to property')
  }
`

// ============================================================================
// PROPRIETOR ASSIGNMENT WORKFLOW
// ============================================================================

export const ProprietorAssignmentWorkflow = `
1. CREATE PROPRIETOR ROLE
   - User registers with role = "proprietor"
   - Provides business details
   - Provides bank account info

2. SUPER ADMIN ASSIGNS PROPERTIES
   - Navigate to: Super Admin > Role Management > Proprietors
   - Find proprietor
   - Assign owned properties
   - Set ownership percentage (default 100%)

3. PROPRIETOR VIEWS DASHBOARD
   - Sees all assigned properties
   - Reads reports from Super Admin
   - Receives messages
   - (No modification rights)

4. SUPER ADMIN SENDS REPORTS
   - Create report for proprietor
   - Choose property
   - Set report type (monthly, quarterly, etc.)
   - Send to proprietor
   - Proprietor receives notification

EXAMPLE CODE:
  const assignProperty = async (
    proprietorId: string, 
    propertyId: string, 
    ownershipPercentage: number
  ) => {
    await proprietorService.assignPropertyToProprietor(
      proprietorId,
      propertyId,
      ownershipPercentage
    )
  }

  const sendReport = async (
    proprietorId: string,
    propertyId: string,
    reportData: any
  ) => {
    const report = await proprietorService.createReport(
      proprietorId,
      propertyId,
      'monthly',
      'Property Performance Report',
      'Your monthly report',
      reportData
    )
    await proprietorService.approveAndSendReport(report.id)
  }
`

// ============================================================================
// CARETAKER ASSIGNMENT WORKFLOW
// ============================================================================

export const CaretakerAssignmentWorkflow = `
1. CREATE CARETAKER ROLE
   - User registers with role = "caretaker"
   - Select role during registration

2. SUPER ADMIN ASSIGNS TO PROPERTY & MANAGER
   - Navigate to: Super Admin > Role Management > Caretakers
   - Create new caretaker assignment
   - Select: Caretaker user → Property → Property Manager
   - Set hire date
   - Activate

3. CARETAKER WORKS UNDER PROPERTY MANAGER
   - Property Manager supervises
   - Assigns daily tasks
   - Rates performance
   - Can suspend/reactivate
   - Views caretaker details in their dashboard

4. CARETAKER DASHBOARD
   - Sees assigned property only
   - Tracks property maintenance
   - Reports issues
   - Works with technicians
   - Performance rating visible

IMPORTANT: Caretaker can only work at ONE property
IMPORTANT: Caretaker reports to ONE property manager

EXAMPLE CODE:
  const assignCaretaker = async (
    userId: string,
    propertyId: string,
    propertyManagerId: string,
    hireDate: string
  ) => {
    await caretakerService.createCaretaker(
      userId,
      propertyId,
      propertyManagerId,
      hireDate
    )
  }

  const updateRating = async (caretakerId: string, rating: number) => {
    await caretakerService.updatePerformanceRating(caretakerId, rating)
  }
`

// ============================================================================
// SUPER ADMIN PAGES TO CREATE
// ============================================================================

export const SuperAdminPagesToCreate = `
REQUIRED PAGES:

1. /super-admin/technicians
   - List all technicians
   - Create technician role
   - Assign to properties
   - View job history
   - Manage categories
   - Update availability

2. /super-admin/proprietors
   - List all proprietors
   - Assign properties
   - Create/send reports
   - Send messages
   - View property ownership %
   - Manage business info

3. /super-admin/caretakers
   - List all caretakers
   - Create assignments
   - Select property & manager
   - Rate performance
   - Suspend/reactivate
   - View daily tasks

4. /super-admin/roles
   - Manage role assignments
   - Bulk role changes
   - Approval workflow
   - User status management
   - Activity logs

5. /super-admin/reports
   - Create reports
   - Select proprietor & property
   - Choose report type
   - Attach data
   - Send to proprietor
   - View sent reports

6. /super-admin/maintenance
   - Monitor all requests
   - View escalated requests
   - Assign manual handling
   - Track technician performance
   - View completion stats
`

// ============================================================================
// KEY SUPER ADMIN FUNCTIONS NEEDED
// ============================================================================

export const KeySuperAdminFunctions = `
TECHNICIAN MANAGEMENT:
- Created user with technician role ✓
- Selected category (plumbing, electrical, etc.) ✓
- Assigned to properties ✓
- View assigned jobs
- Update availability
- Manage categories ✓

PROPRIETOR MANAGEMENT:
- Created user with proprietor role ✓
- Assigned properties ✓
- Create & send reports ✓
- Send messages ✓
- View property assignments ✓

CARETAKER MANAGEMENT:
- Created user with caretaker role ✓
- Selected property & manager ✓
- Set hire date
- Rate performance
- Suspend/reactivate

MAINTENANCE MONITORING:
- View all requests
- View escalated requests
- Manually assign to technician
- View technician performance
- Generate maintenance stats

DASHBOARDS TO VIEW:
- Technician activity dashboard
- Proprietor property performance
- Caretaker assignments
- Maintenance request status
- System-wide analytics
`

// ============================================================================
// DATABASE QUERIES FOR SUPER ADMIN
// ============================================================================

export const SuperAdminDatabaseQueries = `
Get all technicians in a category:
  const technicians = await technicianService.getTechniciansByCategory(categoryId)

Get technicians assigned to property:
  const technicians = await technicianService.getTechniciansForProperty(propertyId)

Get proprietor's properties:
  const props = await proprietorService.getProprietorProperties(proprietorId)

Get caretakers under manager:
  const caretakers = await caretakerService.getCaretakersUnderManager(managerId)

Get escalated maintenance requests:
  const escalated = await maintenanceService.getEscalatedRequests(propertyId)

Get technician job history:
  const jobs = await technicianService.getTechnicianJobs(technicianId)

Get proprietor unread messages:
  const count = await proprietorService.getUnreadMessageCount(proprietorId)

Get technician performance:
  const technician = await technicianService.getTechnicianById(technicianId)
  // access: average_rating, total_jobs_completed
`

// ============================================================================
// TEMPLATE SUPER ADMIN PAGE STRUCTURE
// ============================================================================

export const SuperAdminPageTemplate = `
<SuperAdminPage title="Technician Management">
  <Tabs>
    <Tab name="Technicians">
      <SearchAndFilter />
      <TechniciansList>
        {technicians.map(tech => (
          <TechnicianCard 
            tech={tech}
            onViewJobs={() => { ... }}
            onAssignProperty={() => { ... }}
            onUpdateAvailability={() => { ... }}
          />
        ))}
      </TechniciansList>
    </Tab>
    
    <Tab name="Categories">
      <CategoryManagement >
        {categories.map(cat => (
          <CategoryCard cat={cat} onEdit onDelete />
        ))}
      </CategoryManagement>
    </Tab>
    
    <Tab name="Property Assignments">
      <PropertyAssignmentMatrix 
        technicians={technicians}
        properties={properties}
        assignments={assignments}
        onAssign={(tech, prop) => { ... }}
        onRemove={(assignment) => { ... }}
      />
    </Tab>
  </Tabs>
</SuperAdminPage>
`

// ============================================================================
// TEMPLATE PROPRIETOR MANAGEMENT PAGE
// ============================================================================

export const ProprietorManagementTemplate = `
<SuperAdminPage title="Proprietor Management">
  <Tabs>
    <Tab name="Proprietors">
      <ProprietorsList>
        {proprietors.map(prop => (
          <ProprietorCard
            proprietor={prop}
            onViewProperties={() => { ... }}
            onAssignProperty={() => { ... }}
            onSendReport={() => { ... }}
            onSendMessage={() => { ... }}
          />
        ))}
      </ProprietorsList>
    </Tab>
    
    <Tab name="Property Assignments">
      <PropertyAssignmentMatrix
        proprietors={proprietors}
        properties={properties}
        assignments={proprietorProperties}
        onAssign={(prop, prop_id, %) => { ... }}
        onRemove={(assignment) => { ... }}
      />
    </Tab>
    
    <Tab name="Reports">
      <ReportCreator>
        <Select label="Proprietor" options={proprietors} />
        <Select label="Property" options={properties} />
        <Select type="report_type" options={REPORT_TYPES} />
        <Button onClick={createAndSendReport}>Send Report</Button>
      </ReportCreator>
      
      <ReportHistory>
        {reports.map(report => (
          <ReportCard report={report} />
        ))}
      </ReportHistory>
    </Tab>
    
    <Tab name="Messages">
      <MessageComposer>
        <Select label="Proprietor" options={proprietors} />
        <TextArea label="Message" />
        <Select label="Type" options={MESSAGE_TYPES} />
        <Button onClick={sendMessage}>Send</Button>
      </MessageComposer>
    </Tab>
  </Tabs>
</SuperAdminPage>
`

// ============================================================================
// TEMPLATE CARETAKER MANAGEMENT PAGE
// ============================================================================

export const CaretakerManagementTemplate = `
<SuperAdminPage title="Caretaker Management">
  <Tabs>
    <Tab name="Caretakers">
      <CaretakersList>
        {caretakers.map(caretaker => (
          <CaretakerCard
            caretaker={caretaker}
            onViewProperty={() => { ... }}
            onUpdateRating={() => { ... }}
            onSuspend={() => { ... }}
            onReactivate={() => { ... }}
          />
        ))}
      </CaretakersList>
    </Tab>
    
    <Tab name="New Assignment">
      <Form>
        <Select 
          label="User (with caretaker role)"
          options={caretakerUsers}
        />
        <Select 
          label="Property"
          options={properties}
        />
        <Select
          label="Property Manager"
          options={propertyManagers}
        />
        <DateInput 
          label="Hire Date"
        />
        <Button onClick={createAssignment}>Create Assignment</Button>
      </Form>
    </Tab>
    
    <Tab name="By Property Manager">
      <PropertyManagerTabs>
        {propertyManagers.map(manager => (
          <Tab name={manager.name}>
            <CaretakersList
              caretakers={getCaretakersUnderManager(manager.id)}
            />
          </Tab>
        ))}
      </PropertyManagerTabs>
    </Tab>
  </Tabs>
</SuperAdminPage>
`

// ============================================================================
// ROLE PERMISSIONS & RESTRICTIONS
// ============================================================================

export const RolePermissionsMatrix = `
┌─────────────────┬──────────┬─────────┬──────────┬────────────┬──────────┐
│ Action          │ Tenant   │ Manager │ Tech     │ Proprietor │ Caretaker│
├─────────────────┼──────────┼─────────┼──────────┼────────────┼──────────┤
│ Create Request  │ ✅ Own   │ ❌      │ ❌       │ ❌         │ ❌       │
│ View Requests   │ ✅ Own   │ ✅ All  │ ✅ Own   │ ❌         │ ✅ Own   │
│ Assign Tech     │ ❌       │ ❌      │ ❌       │ ❌         │ ❌       │
│ View Props      │ ❌       │ ✅      │ ❌       │ ✅ Own     │ ✅ One   │
│ View Caretakers │ ❌       │ ✅      │ ❌       │ ❌         │ ❌       │
│ Rate Caretaker  │ ❌       │ ✅      │ ❌       │ ❌         │ ❌       │
│ View Reports    │ ❌       │ ❌      │ ❌       │ ✅ Own     │ ❌       │
│ Create Report   │ ❌       │ ❌      │ ❌       │ ❌         │ ❌       │
│ Modify Anything │ ✅ Own   │ ✅      │ ✅ Own   │ ❌         │ ❌       │
└─────────────────┴──────────┴─────────┴──────────┴────────────┴──────────┘

✅ = Allowed   |   ❌ = Blocked   |   Own = Own records only
`

// ============================================================================
// COMMON SUPER ADMIN TASKS
// ============================================================================

export const SuperAdminCommonTasks = `
DAILY TASKS:
□ Monitor escalated maintenance requests
□ Assign caretakers to properties
□ Rate caretaker performance
□ Review technician ratings
□ Send proprietor updates/alerts

WEEKLY TASKS:
□ Generate reports for proprietors
□ Review technician job completion rates
□ Check maintenance request response times
□ Update technician availability
□ Manage technician categories

MONTHLY TASKS:
□ Send monthly reports to all proprietors
□ Review technician performance
□ Update property manager assignments
□ Generate system-wide analytics
□ Review escalation logs

ADMINISTRATIVE TASKS:
□ Create new technician roles
□ Assign technicians to properties
□ Create proprietor profiles
□ Assign proprietor properties
□ Create caretaker assignments
□ Manage technician categories
□ Handle disputes/escalations
`

export default {
  TechnicianAssignmentWorkflow,
  ProprietorAssignmentWorkflow,
  CaretakerAssignmentWorkflow,
  SuperAdminPagesToCreate,
  KeySuperAdminFunctions,
  SuperAdminDatabaseQueries,
  SuperAdminPageTemplate,
  ProprietorManagementTemplate,
  CaretakerManagementTemplate,
  RolePermissionsMatrix,
  SuperAdminCommonTasks
}
