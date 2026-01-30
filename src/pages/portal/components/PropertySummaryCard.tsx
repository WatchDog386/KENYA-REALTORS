// src/pages/portal/components/PropertySummaryCard.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  DollarSign, 
  Home, 
  MapPin,
  TrendingUp,
  Wrench,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertySummaryCardProps {
  property?: {
    id: string;
    name: string;
    address: string;
    type: string;
    totalUnits: number;
    occupiedUnits: number;
    monthlyRevenue: number;
    manager?: string;
    status: string;
    lastInspection?: string;
    maintenanceRequests?: number;
  };
}

const PropertySummaryCard = ({ property }: PropertySummaryCardProps) => {
  // Default property data if none provided
  const prop = property || {
    id: 'PROP-001',
    name: 'Sunset Apartments',
    address: '123 Sunset Blvd, Los Angeles, CA 90001',
    type: 'Apartment Building',
    totalUnits: 15,
    occupiedUnits: 14,
    monthlyRevenue: 45000,
    manager: 'Sarah Johnson',
    status: 'active',
    lastInspection: '2024-01-10',
    maintenanceRequests: 2
  };

  const occupancyRate = Math.round((prop.occupiedUnits / prop.totalUnits) * 100);
  const vacantUnits = prop.totalUnits - prop.occupiedUnits;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              {prop.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3" />
              {prop.address}
            </CardDescription>
          </div>
          {getStatusBadge(prop.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Units</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{prop.occupiedUnits}</span>
                <span className="text-gray-600">/ {prop.totalUnits}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {vacantUnits} vacant • {occupancyRate}% occupied
              </div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Monthly Revenue</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(prop.monthlyRevenue)}</div>
              <div className="text-xs text-gray-600 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +8% from last month
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Property Type</span>
              <span className="font-medium">{prop.type}</span>
            </div>
            
            {prop.manager && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Property Manager</span>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">{prop.manager}</span>
                </div>
              </div>
            )}

            {prop.lastInspection && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Inspection</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium">{prop.lastInspection}</span>
                </div>
              </div>
            )}

            {prop.maintenanceRequests !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Maintenance</span>
                <div className="flex items-center gap-2">
                  <Wrench className="w-3 h-3" />
                  <span className={`font-medium ${prop.maintenanceRequests > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {prop.maintenanceRequests} request{prop.maintenanceRequests !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t">
            <button className="py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
              View Details
            </button>
            <button className="py-2 px-3 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 font-medium">
              Manage Units
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertySummaryCard;