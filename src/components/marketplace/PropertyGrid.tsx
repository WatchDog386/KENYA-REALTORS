import { MapPin, Bed, Bath, Square } from 'lucide-react';

// Define a basic interface for now
interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
}

const PropertyGrid = ({ properties }: { properties: Property[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-48 w-full bg-gray-200 relative">
            <img 
              src={property.imageUrl} 
              alt={property.title} 
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
              FOR RENT
            </span>
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
            <p className="text-blue-600 font-bold text-xl mt-1">${property.price.toLocaleString()}<span className="text-sm text-gray-500 font-normal">/mo</span></p>
            
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-2 mb-4">
              <MapPin size={16} />
              <span className="truncate">{property.location}</span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Bed size={16} /> <span>{property.beds} Beds</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath size={16} /> <span>{property.baths} Baths</span>
              </div>
              <div className="flex items-center gap-1">
                <Square size={16} /> <span>{property.sqft} sqft</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyGrid;