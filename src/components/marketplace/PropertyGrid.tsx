import { MapPin, Bed, Bath, Square, ArrowRight } from 'lucide-react';
import { Property } from '@/hooks/useProperties';

interface PropertyGridProps {
  properties: Property[];
  onPropertyClick?: (id: string) => void;
}

const PropertyGrid = ({ properties, onPropertyClick }: PropertyGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div 
          key={property.id} 
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <div className="h-48 w-full bg-gray-200 relative group cursor-pointer" onClick={() => onPropertyClick?.(property.id)}>
            <img 
              src={property.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'} 
              alt={property.title || property.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded">
              FOR RENT
            </span>
          </div>
          
          <div className="p-5">
            <h3 className="text-lg font-bold text-gray-900 truncate">{property.title || property.name}</h3>
            <p className="text-blue-600 font-bold text-2xl mt-2">
              ${(property.price || property.monthly_rent || 0).toLocaleString()}
              <span className="text-sm text-gray-500 font-normal">/mo</span>
            </p>
            
            <div className="flex items-center gap-1 text-gray-600 text-sm mt-3 mb-4">
              <MapPin size={16} className="text-gray-500" />
              <span className="truncate">{property.address || property.city}</span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Bed size={16} /> <span>{property.bedrooms || 0} Beds</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath size={16} /> <span>{property.bathrooms || 0} Baths</span>
              </div>
              <div className="flex items-center gap-1">
                <Square size={16} /> <span>{property.square_feet || 0} sqft</span>
              </div>
            </div>

            <button
              onClick={() => onPropertyClick?.(property.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300"
            >
              View This Listing
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyGrid;