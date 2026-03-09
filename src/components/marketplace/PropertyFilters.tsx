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
    'Swimming Pool',
    'Gym Access',
    'High-Speed Wifi',
    'Smart Home',
    'Panoramic View',
    'Parking',
    'Pet Friendly',
    'Furnished',
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
        <h3 className="text-lg font-semibold text-gray-900">Quick Search Filters</h3>
        <span className="text-sm text-gray-600">Find your perfect property in seconds</span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={filters.search}
          onChange={handleSearch}
          placeholder="Search by location, property name..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Price Range
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', parseInt(e.target.value) || 0)}
              placeholder="Min"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', parseInt(e.target.value) || 0)}
              placeholder="Max"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Bedrooms */}
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

        {/* Property Type */}
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

      {/* Amenities Section */}
      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-900 mb-4">Select Amenities</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {amenitiesList.map(amenity => (
            <label key={amenity} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;