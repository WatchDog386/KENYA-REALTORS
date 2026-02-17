// src/components/portal/super-admin/TechnicianManagement.tsx
import React, { useEffect, useState } from 'react';
import { technicianService } from '@/services/technicianService';
import { TechnicianCategory } from '@/types/newRoles';
import { Wrench, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';

const TechnicianManagement = () => {
  const [categories, setCategories] = useState<TechnicianCategory[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'technicians'>('categories');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cats = await technicianService.getCategories();
      setCategories(cats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Technician Management
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'technicians'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Technicians
        </button>
      </div>

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
                  <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-1 text-sm">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technicians Tab */}
      {activeTab === 'technicians' && (
        <div className="p-6">
          <p className="text-slate-600 text-center py-12">
            Technician list functionality coming soon.
            <br />
            Users can register as technicians via role selection.
          </p>
        </div>
      )}
    </div>
  );
};

export default TechnicianManagement;
