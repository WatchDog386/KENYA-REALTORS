import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { technicianService } from '@/services/technicianService';
import { maintenanceService } from '@/services/maintenanceService';
import { Technician, MaintenanceRequestEnhanced } from '@/types/newRoles';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Wrench,
  UploadCloud,
  DollarSign,
} from 'lucide-react';

interface CategoryPortalProps {
  category?: string;
}

export const CategoryPortal = ({ category }: CategoryPortalProps) => {
  const { user } = useAuth();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [jobs, setJobs] = useState<MaintenanceRequestEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'in-progress' | 'completed'>('assigned');
  const [selectedJob, setSelectedJob] = useState<MaintenanceRequestEnhanced | null>(null);

  useEffect(() => {
    loadPortalData();
  }, [user?.id]);

  const loadPortalData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get technician profile
      const techData = await technicianService.getTechnicianByUserId(user.id);
      if (techData) {
        setTechnician(techData);

        // Get technician's assigned jobs
        const jobsData = await technicianService.getTechnicianJobs(techData.id);
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error loading portal data:', error);
    }
    setLoading(false);
  };

  const getCategoryIcon = (categoryName: string): string => {
    const icons: { [key: string]: string } = {
      plumbing: '🔧',
      electrical: '⚡',
      painting: '🎨',
      carpentry: '🪵',
      glazing: '🪟',
      welding: '🔥',
      tiling: '🧱',
      lift_maintenance: '🛗',
    };
    return icons[categoryName?.toLowerCase()] || '🔧';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'emergency':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      case 'low':
        return 'border-l-4 border-green-500';
      default:
        return 'border-l-4 border-gray-500';
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === 'assigned') return job.status === 'pending';
    if (activeTab === 'in-progress') return job.status === 'in_progress';
    if (activeTab === 'completed') return job.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-slate-600 font-medium">Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-nunito">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] py-10 shadow-lg mb-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-4xl shadow-inner">
                  {getCategoryIcon(technician?.category?.name || '')}
               </div>
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-[#F96302] text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full">
                      Technician Portal
                    </span>
                    <span className="text-blue-200 text-xs font-semibold">
                      {technician?.experience_years} Years Exp.
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {technician?.category?.name ? technician.category.name.toUpperCase() : 'TECHNICIAN'} <span className="text-[#F96302]">DASHBOARD</span>
                  </h1>
                  <p className="text-blue-100 font-medium">
                    Welcome back, {technician?.profile?.first_name} {technician?.profile?.last_name}
                  </p>
               </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-6">
               <div className="text-right">
                  <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Assigned Jobs</p>
                  <p className="text-2xl font-bold text-white">{jobs.length}</p>
               </div>
               <div className="h-10 w-px bg-white/20"></div>
               <div className="text-right">
                   <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">Rating</p>
                   <div className="flex items-center gap-1 justify-end">
                      <span className="text-yellow-400">★</span>
                      <span className="text-2xl font-bold text-white">{technician?.average_rating?.toFixed(1) || 'N/A'}</span>
                   </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending Jobs"
            value={jobs.filter((j) => j.status === 'pending').length}
            color="bg-amber-50 text-amber-700 border-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            icon={<Wrench className="w-5 h-5" />}
            label="In Progress"
            value={jobs.filter((j) => j.status === 'in_progress').length}
            color="bg-blue-50 text-blue-700 border-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Completed"
            value={jobs.filter((j) => j.status === 'completed').length}
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
            iconColor="text-emerald-600"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200">
            {['assigned', 'in-progress', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#154279] text-white shadow-md transform scale-[1.02]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Jobs Cards */}
          <div className="space-y-4">

            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-5 border border-slate-100 group ${getPriorityColor(job.priority)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#154279] transition-colors">{job.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{job.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{job.property?.name || 'Property'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        {job.tenant?.first_name} {job.tenant?.last_name}
                      </span>
                    </div>
                  </div>

                  {job.work_start_photo && (
                    <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Photos uploaded
                      </p>
                    </div>
                  )}

                  {job.estimated_cost && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">Est: KES {job.estimated_cost.toLocaleString()}</span>
                      {job.actual_cost && (
                        <span className="text-sm text-green-600 ml-2">
                          Actual: KES {job.actual_cost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No {activeTab.replace('-', ' ')} jobs</p>
              </div>
            )}
          </div>
        </div>

        {/* Job Details Sidebar */}
        {selectedJob && (
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6 h-fit">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Tenant Info */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-gray-700 mb-2">Tenant</h3>
                <p className="text-sm">
                  {selectedJob.tenant?.first_name} {selectedJob.tenant?.last_name}
                </p>
                {selectedJob.tenant?.phone && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600 mt-1">
                    <Phone className="w-4 h-4" />
                    {selectedJob.tenant.phone}
                  </div>
                )}
              </div>

              {/* Property Info */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-gray-700 mb-2">Property</h3>
                <p className="text-sm">{selectedJob.property?.name}</p>
                {selectedJob.property?.location && (
                  <p className="text-sm text-gray-600">{selectedJob.property.location}</p>
                )}
              </div>

              {/* Priority */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-gray-700 mb-2">Priority</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedJob.priority)}`}>
                  {selectedJob.priority.toUpperCase()}
                </span>
              </div>

              {/* Work Documentation */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Work Documentation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${selectedJob.work_start_photo ? 'bg-green-50' : 'bg-gray-50'}`}>
                    ✓ Start Photo {selectedJob.work_start_photo ? '✓' : '○'}
                  </div>
                  <div className={`p-2 rounded ${selectedJob.work_progress_photos?.length ? 'bg-green-50' : 'bg-gray-50'}`}>
                    Progress Photos ({selectedJob.work_progress_photos?.length || 0})
                  </div>
                  <div className={`p-2 rounded ${selectedJob.work_completion_photo ? 'bg-green-50' : 'bg-gray-50'}`}>
                    ✓ Completion Photo {selectedJob.work_completion_photo ? '✓' : '○'}
                  </div>
                </div>
              </div>

              {/* Cost */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-gray-700 mb-2">Cost Estimate</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  KES {selectedJob.estimated_cost?.toLocaleString() || '—'}
                </p>
                {selectedJob.actual_cost && (
                  <p className="text-sm text-gray-600 mt-1">
                    Actual: KES {selectedJob.actual_cost.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium">
                View Full Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color, iconColor }: any) => (
  <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center bg-white shadow-sm hover:shadow-md transition-all ${color} bg-white`}>
    <div className={`p-3 rounded-full mb-3 bg-white shadow-sm ${iconColor} bg-opacity-20`}>{icon}</div>
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  </div>
);

export default CategoryPortal;
