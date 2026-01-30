import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  search: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number | null;
  propertyType: string;
  amenities: string[];
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    minPrice: 0,
    maxPrice: 5000,
    bedrooms: null,
    propertyType: 'any',
    amenities: [],
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const propertyTypes = [
    { value: 'any', label: 'Any Type' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
  ];

  const amenitiesList = [
    'Parking',
    'Pool',
    'Gym',
    'Laundry',
    'Pet Friendly',
    'Furnished',
    'Air Conditioning',
    'Balcony',
  ];

  const handleChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    handleChange('amenities', newAmenities);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('search', e.target.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Properties</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <Filter size={20} />
          <span>{isExpanded ? 'Show Less' : 'More Filters'}</span>
          <ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={filters.search}
          onChange={handleSearch}
          placeholder="Search by location, property name, or amenities..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Price Range: ${filters.minPrice} - ${filters.maxPrice}
        </label>
        <div className="flex gap-4">
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', parseInt(e.target.value))}
            className="flex-1"
          />
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', parseInt(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms
          </label>
          <select
            value={filters.bedrooms || ''}
            onChange={(e) => handleChange('bedrooms', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {propertyTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Amenities</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {amenitiesList.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  filters.amenities.includes(amenity)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyFilters;