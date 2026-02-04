import React, { useState } from 'react';
import PropertyGrid from '@/components/marketplace/PropertyGrid';
import PropertyFilters, { FilterOptions } from '@/components/marketplace/PropertyFilters';
import { useProperties } from '@/hooks/useProperties';
import { Search, Filter } from 'lucide-react';

const ListingsPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    minPrice: 0,
    maxPrice: 5000,
    bedrooms: null,
    propertyType: 'any',
    amenities: [],
  });

  const { properties, isLoading, error } = useProperties({
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    bedrooms: filters.bedrooms || undefined,
    type: filters.propertyType !== 'any' ? filters.propertyType : undefined,
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handlePropertyClick = (property: any) => {
    window.location.href = `/marketplace/${property.id}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">Error loading properties: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Find Your Perfect Home
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            Browse through our curated selection of premium properties
          </p>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Filter by location, price, and amenities to find exactly what you're looking for
          </p>
        </div>

        {/* Filters */}
        <PropertyFilters onFilterChange={handleFilterChange} />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Available Properties
            </h2>
            <p className="text-gray-600 mt-1">
              Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-gray-600">
            <Filter size={20} />
            <span>Filters: {filters.amenities.length + (filters.bedrooms ? 1 : 0)}</span>
          </div>
        </div>

        {/* Property Grid */}
        {properties.length > 0 ? (
          <PropertyGrid properties={properties} onPropertyClick={handlePropertyClick} />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-16 text-center">
            <Search size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No Properties Found
            </h3>
            <p className="text-gray-600 mb-8">
              Try adjusting your filters or search criteria to find more results.
            </p>
            <button
              onClick={() => setFilters({
                search: '',
                minPrice: 0,
                maxPrice: 5000,
                bedrooms: null,
                propertyType: 'any',
                amenities: [],
              })}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Call to Action */}
        {properties.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">
              Want to List Your Property?
            </h3>
            <p className="mb-8 text-blue-100 text-lg">
              Join thousands of landlords who are successfully renting their properties through our platform.
            </p>
            <a
              href="/post-rental"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              List Your Property
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingsPage;