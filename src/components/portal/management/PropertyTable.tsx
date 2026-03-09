import React from 'react';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Property } from '../../../services/api/properties';

interface PropertyTableProps {
  properties: Property[];
  onEdit?: (property: Property) => void;
  onDelete?: (propertyId: string) => void;
  onView?: (property: Property) => void;
}

const PropertyTable: React.FC<PropertyTableProps> = ({ 
  properties, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {properties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-lg object-cover"
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994'}
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {property.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{property.address}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 capitalize">{property.type}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(property.price)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(property.status)}`}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView?.(property)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye size={18} className="text-gray-600" />
                    </button>
                    <button
                      onClick={() => onEdit?.(property)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => onDelete?.(property.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyTable;