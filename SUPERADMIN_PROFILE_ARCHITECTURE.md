# SuperAdmin Profile Component - Architecture & Technical Details

## 📐 Component Architecture

### Component Hierarchy
```
SuperAdminDashboard
├── Profile Modal Overlay
│   └── SuperAdminProfile
│       ├── Profile Header (Hero Section)
│       ├── Avatar Section
│       ├── Profile Information
│       │   ├── Contact Information
│       │   └── Professional Information
│       ├── Account Dates
│       ├── Action Buttons
│       └── Additional Info Cards
```

## 🔄 State Management

### Local States
```typescript
const [profileData, setProfileData] = useState<ProfileData | null>(null);
const [editFormData, setEditFormData] = useState<EditFormData>({...});
const [isEditing, setIsEditing] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [isUploadingImage, setIsUploadingImage] = useState(false);
const [imagePreview, setImagePreview] = useState<string | null>(null);
```

### Context Usage
```typescript
const { user } = useAuth();  // Get current authenticated user
const navigate = useNavigate();  // From react-router
```

### External Refs
```typescript
const fileInputRef = useRef<HTMLInputElement>(null);  // For file input element
```

## 🔗 API Integration Points

### 1. Fetch Profile Data
**Endpoint**: `POST` to Supabase
```typescript
supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single()
```
**Triggers**: Component mount (useEffect)
**Loading State**: `isLoading`

### 2. Update Profile Information
**Endpoint**: `PATCH` to Supabase
```typescript
supabase
  .from("profiles")
  .update({...fields})
  .eq("id", user.id)
```
**Triggers**: Save button click
**Loading State**: `isSaving`

### 3. Upload Profile Image
**Endpoint**: `POST` to Supabase Storage
```typescript
supabase.storage
  .from("avatars")
  .upload(filePath, file, { upsert: true })
```
**Triggers**: Image file selected
**Loading State**: `isUploadingImage`

### 4. Get Public Image URL
**Endpoint**: `GET` from Supabase Storage
```typescript
supabase.storage
  .from("avatars")
  .getPublicUrl(filePath)
```
**Returns**: Public URL for avatar

### 5. Delete Old Avatar
**Endpoint**: `DELETE` to Supabase Storage
```typescript
supabase.storage
  .from("avatars")
  .remove([filePath])
```
**Triggers**: When uploading new image

## 📊 Component Sections

### Section 1: Header
- Title: "Super Admin Profile"
- Subtitle: "Manage your profile information and settings"
- Edit Profile button (view mode only)

### Section 2: Profile Hero
- Gradient background (`from-[#00356B] to-blue-600`)
- Decorative blur effects

### Section 3: Avatar & Basic Info
- Avatar image display/upload
- First and last name (editable)
- Role badge (Super Admin)
- Status badge (Active/Inactive)

### Section 4: Contact Information
- Email (read-only)
- Phone number (editable)
- Location (editable)

### Section 5: Professional Information
- Department (editable)
- Bio (editable textarea)

### Section 6: Account Dates
- Member since date (formatted)
- Last updated date (formatted)

### Section 7: Additional Info Cards
- Security status card
- Account status card
- Verification status card

## 🎯 User Interactions

### View Mode Flow
```
Page Load
  ↓
Fetch Profile Data (isLoading = true)
  ↓
Display Profile (isLoading = false)
  ↓
[User clicks "Edit Profile"]
  ↓
Switch to Edit Mode
```

### Edit Mode Flow
```
Edit Mode Activated
  ↓
User modifies fields / uploads image
  ↓
[User clicks "Save Changes"]
  ↓
Validate inputs
  ↓
Save to database (isSaving = true)
  ↓
Show success toast
  ↓
Switch to View Mode (isSaving = false)
```

### Image Upload Flow
```
[User clicks on avatar in edit mode]
  ↓
File input dialog opens
  ↓
[User selects image file]
  ↓
Validate (type & size)
  ↓
Show preview (imagePreview state)
  ↓
Upload to storage (isUploadingImage = true)
  ↓
Delete old image (async)
  ↓
Get public URL
  ↓
Update profile record
  ↓
Show success toast
  ↓
Update avatar display
```

## 🎨 Styling System

### Color Palette
```typescript
Primary: #00356B (Dark Navy Blue)
Secondary: Blue family (blue-400 to blue-600)
Success: Green family (emerald/green)
Status: Gray family for neutral
Background: slate-50, white
Borders: gray-100, gray-200
Text: gray-900 (primary), gray-600 (secondary)
```

### Responsive Breakpoints
```typescript
sm:     640px
md:     768px
lg:    1024px
xl:   1280px
2xl:  1536px
```

### Spacing Scale
```typescript
Used consistently: px-6, py-8, gap-6, gap-8
Padding: 4px to 32px
Margins: Same as padding
```

## 🔐 Type Safety

### TypeScript Interfaces

#### ProfileData
```typescript
interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
  location?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}
```

#### EditFormData
```typescript
interface EditFormData {
  first_name: string;
  last_name: string;
  phone: string;
  bio: string;
  department: string;
  location: string;
}
```

## 🚀 Performance Optimizations

### 1. Use of useRef for File Input
```typescript
const fileInputRef = useRef<HTMLInputElement>(null);
// Avoids re-renders, direct DOM access
```

### 2. Conditional Rendering
```typescript
{isLoading && <Spinner />}
{!isLoading && profileData && <ProfileContent />}
```

### 3. State Updates
- Batched updates to minimize re-renders
- Separate loading states for different operations

### 4. Image Preview
- Local FileReader for instant preview
- No network round-trip until save

## 🔄 Data Synchronization

### On Component Mount
```typescript
useEffect(() => {
  fetchProfileData();
}, [user?.id]);
```

### On Save
```typescript
// Immediate UI update
setProfileData({...profileData!, ...editFormData});

// Form state reset
setIsEditing(false);
```

### Image Upload
- Image uploaded to storage
- URL returned and stored in DB
- Preview updates immediately
- Profile state updated

## 🛡️ Error Handling Strategy

### Try-Catch Blocks
```typescript
try {
  // Database/API operation
} catch (error) {
  console.error("Detailed error message", error);
  toast.error("User-friendly error message");
} finally {
  setIsLoading(false);
}
```

### Error States
```typescript
If fetchProfileData fails:
  → Show AlertCircle icon
  → Display "Failed to load profile"
  → Don't show edit button

If image upload fails:
  → Show toast: "Failed to upload image"
  → Keep isUploadingImage = false
  → Revert imagePreview state

If profile save fails:
  → Show toast: "Failed to update profile"
  → Keep data unchanged
  → Stay in edit mode
```

## 📱 Responsive Behavior

### Desktop (md and above)
```typescript
grid grid-cols-1 md:grid-cols-2  // Two columns for sections
md:flex-row                       // Horizontal layout for avatar
```

### Mobile (below md)
```typescript
grid grid-cols-1                  // Single column
flex-col                          // Vertical layout
```

### Modal Overlay
```typescript
fixed inset-0                     // Full screen overlay
overflow-y-auto                   // Scrollable on mobile
m-4                               // Margin for mobile devices
max-w-4xl                         // Max width constraint
```

## 🎬 Animation Details

### Entry Animation (Framer Motion)
```typescript
initial={{ opacity: 0, y: -20 }}      // Start state
animate={{ opacity: 1, y: 0 }}        // End state
transition={{ duration: 0.4 }}        // Duration

// Staggered animation for multiple sections
transition={{ delay: index * 0.1 }}
```

### Hover Effects
```typescript
// Avatar hover (shows camera icon)
group-hover:opacity-100
transition-opacity

// Links hover
hover:bg-white/20
transition-all duration-200
```

## 📊 File Organization

```
src/
├── components/
│   └── portal/
│       └── super-admin/
│           ├── SuperAdminProfile.tsx      (NEW)
│           ├── AnalyticsDashboard.tsx
│           ├── ApprovalQueue.tsx
│           ├── PropertyManager.tsx
│           ├── Reports.tsx
│           ├── SystemSettings.tsx
│           └── UserManagement.tsx
└── pages/
    └── portal/
        └── SuperAdminDashboard.tsx        (UPDATED)
```

## 🧪 Testing Considerations

### Unit Test Areas
- Profile data fetching
- Form state management
- Image upload validation
- Data update logic
- Error handling
- Date formatting

### Integration Test Areas
- Profile modal open/close
- Edit mode toggle
- Full save flow with image
- API integration
- Error scenarios

### E2E Test Scenarios
1. Load profile → Display data
2. Edit field → Save → Verify database
3. Upload image → Verify storage + URL
4. Cancel editing → Verify revert
5. Error handling → Verify user feedback

## 🔍 Debugging Helpers

### Console Logs in Component
```typescript
console.error("Error loading profile:", error);
console.error("Error updating profile:", error);
console.error("Error uploading image:", error);
```

### Development Tips
1. Check network tab for API calls
2. Check "profiles" table in Supabase
3. Check "avatars" bucket in Supabase Storage
4. Monitor state changes in React DevTools
5. Check browser console for errors

## 🚀 Deployment Checklist

- [ ] Database table "profiles" exists
- [ ] All required columns in profiles table
- [ ] Storage bucket "avatars" is public
- [ ] Supabase configuration is correct
- [ ] Authentication context working
- [ ] Icons from lucide-react are available
- [ ] UI components properly exported
- [ ] Framer Motion installed
- [ ] Sonner toast library installed
- [ ] TailwindCSS configured
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Images upload correctly
- [ ] Profile saves correctly
- [ ] Modal opens/closes properly

## 📚 Related Files

- Authentication: `src/contexts/AuthContext.tsx`
- Supabase Client: `src/integrations/supabase/client.ts`
- Dashboard: `src/pages/portal/SuperAdminDashboard.tsx`
- UI Components: `src/components/ui/`

## 🔗 External Dependencies

```json
{
  "react": ">=18.0.0",
  "react-router-dom": ">=6.0.0",
  "framer-motion": ">=10.0.0",
  "lucide-react": "latest",
  "@supabase/supabase-js": ">=2.0.0",
  "sonner": ">=1.0.0",
  "tailwindcss": ">=3.0.0"
}
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready
