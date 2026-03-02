// src/components/portal/super-admin/TechnicianManagement.tsx
import React, { useEffect, useState } from 'react';
import { technicianService } from '@/services/technicianService';
import { TechnicianCategory, Technician } from '@/types/newRoles';
import { Wrench, Plus, Edit2, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';

const TechnicianManagement = () => {
  const [categories, setCategories] = useState<TechnicianCategory[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'technicians'>('technicians');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Category assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, techs] = await Promise.all([
        technicianService.getCategories(),
        technicianService.getAllTechnicians(),
      ]);
      setCategories(cats);
      setTechnicians(techs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unassigned';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'bg-red-100 text-red-800';
    
    const colors: { [key: string]: string } = {
      'Plumbing': 'bg-blue-100 text-blue-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'HVAC': 'bg-cyan-100 text-cyan-800',
      'Carpentry': 'bg-orange-100 text-orange-800',
      'Painting': 'bg-pink-100 text-pink-800',
      'Roofing': 'bg-slate-100 text-slate-800',
    };
    return colors[category.name] || 'bg-purple-100 text-purple-800';
  };

  const filteredTechnicians = technicians.filter(tech =>
    (tech.profile?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (tech.profile?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (tech.category?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const techniciansByCategory = categories.reduce((acc: any, cat) => {
    acc[cat.id] = technicians.filter(t => t.category_id === cat.id).length;
    return acc;
  }, {});

  const uncategorizedTechnicians = technicians.filter(t => !t.category_id).length;

  const handleOpenAssignModal = (tech: Technician) => {
    setSelectedTechnician(tech);
    setSelectedCategory(tech.category_id || '');
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedTechnician(null);
    setSelectedCategory('');
  };

  const handleAssignCategory = async () => {
    if (!selectedTechnician || !selectedCategory) return;

    setAssigning(true);
    try {
      await technicianService.assignTechnicianCategory(selectedTechnician.id, selectedCategory);
      
      // Update local state
      setTechnicians(technicians.map(t =>
        t.id === selectedTechnician.id
          ? {
              ...t,
              category_id: selectedCategory,
              category: categories.find(c => c.id === selectedCategory),
            }
          : t
      ));

      handleCloseAssignModal();
    } catch (error) {
      console.error('Error assigning category:', error);
      alert('Failed to assign category. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Technician Management System
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          All technicians must be assigned to a specific category (plumber, electrician, etc.). No general technicians.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'technicians'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Technicians ({technicians.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {/* Technicians Tab */}
      {activeTab === 'technicians' && (
        <div className="p-6">
          {/* Uncategorized Warning */}
          {uncategorizedTechnicians > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Action Required</p>
                <p className="text-sm text-red-800">{uncategorizedTechnicians} technician(s) without assigned categories. Please assign them to a category.</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Summary */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className={`p-3 rounded-lg ${getCategoryColor(cat.id)}`}>
                <p className="font-semibold text-sm">{cat.name}</p>
                <p className="text-lg font-bold">{techniciansByCategory[cat.id] || 0}</p>
              </div>
            ))}
          </div>

          {/* Technician Table */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading technicians...</div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {technicians.length === 0 ? 'No technicians yet.' : 'No results found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Jobs Done</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTechnicians.map((tech) => (
                    <tr key={tech.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {tech.profile?.first_name} {tech.profile?.last_name}
                      </td>
                      <td className="px-4 py-3">
                        {tech.category_id ? (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(tech.category_id)}`}>
                            {getCategoryName(tech.category_id)}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            No Category Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{tech.profile?.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          tech.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {tech.status === 'active' && <CheckCircle className="w-3 h-3" />}
                          {tech.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{tech.total_jobs_completed || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {tech.average_rating ? tech.average_rating.toFixed(1) + '⭐' : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenAssignModal(tech)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition flex items-center gap-1 text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Assign Category
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="p-6">
          <div className="mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="grid gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{cat.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{cat.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Technicians in this category: <span className="font-semibold">{techniciansByCategory[cat.id] || 0}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {cat.is_active && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition flex items-center gap-1 text-sm">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-1 text-sm" disabled={techniciansByCategory[cat.id] > 0}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Assignment Modal */}
      {showAssignModal && selectedTechnician && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Assign Category to Technician
              </h3>
              <button
                onClick={handleCloseAssignModal}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-3">
                <strong>{selectedTechnician.profile?.first_name} {selectedTechnician.profile?.last_name}</strong>
                <br />
                Current: <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-2 ${
                  selectedTechnician.category_id 
                    ? getCategoryColor(selectedTechnician.category_id)
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedTechnician.category_id 
                    ? getCategoryName(selectedTechnician.category_id) 
                    : 'No Category'}
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Select New Category:
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedCategory === cat.id
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                        : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{cat.name}</p>
                    <p className="text-xs text-slate-600">{cat.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {techniciansByCategory[cat.id] || 0} technicians in this category
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseAssignModal}
                disabled={assigning}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCategory}
                disabled={!selectedCategory || assigning || selectedCategory === selectedTechnician.category_id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? 'Assigning...' : 'Assign Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianManagement;
