// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MapPin, DollarSign, Users, Star, Edit, Trash2, Eye, Plus } from "lucide-react";

const Properties = () => {
  // Mock data for properties
  const properties = [
    {
      id: 1,
      name: "Modern Apartment - Westlands",
      type: "apartment",
      status: "rented",
      location: "Westlands, Nairobi",
      price: "45,000",
      tenants: 2,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"
    },
    {
      id: 2,
      name: "Luxury Villa - Karen",
      type: "house",
      status: "available",
      location: "Karen, Nairobi",
      price: "250,000",
      tenants: 0,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w-400&h=300&fit=crop"
    },
    {
      id: 3,
      name: "Studio Unit - Kilimani",
      type: "studio",
      status: "maintenance",
      location: "Kilimani, Nairobi",
      price: "32,000",
      tenants: 1,
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
    },
    {
      id: 4,
      name: "Commercial Space - CBD",
      type: "commercial",
      status: "available",
      location: "CBD, Nairobi",
      price: "120,000",
      tenants: 0,
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "rented":
        return "bg-green-100 text-green-800";
      case "available":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "apartment":
        return <Home className="w-4 h-4" />;
      case "house":
        return <Home className="w-4 h-4" />;
      case "studio":
        return <Home className="w-4 h-4" />;
      case "commercial":
        return <Home className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Properties</h1>
          <p className="text-gray-600">Manage your rental properties and listings</p>
        </div>
        <Button className="bg-[#5BB539] hover:bg-[#4a942e]">
          <Plus className="w-4 h-4 mr-2" />
          Add New Property
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Properties</TabsTrigger>
          <TabsTrigger value="rented">Rented</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className={getStatusColor(property.status)}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTypeIcon(property.type)}
                      {property.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="font-bold">Ksh {property.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Tenants</p>
                        <p className="font-bold">{property.tenants}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{property.rating}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" variant="default">
                    Manage Property
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rented">
          <div className="text-center py-12">
            <Home className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rented Properties</h3>
            <p className="text-gray-500">Properties that are currently rented will appear here.</p>
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.filter(p => p.status === 'available').map((property) => (
              <Card key={property.id}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{property.name}</h3>
                  <p className="text-gray-600 mb-4">{property.location}</p>
                  <Button className="w-full">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="text-center py-12">
            <Home className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Maintenance Required</h3>
            <p className="text-gray-500">Properties requiring maintenance will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
              <p className="text-sm text-gray-600">Total Properties</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1</div>
              <p className="text-sm text-gray-600">Rented</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <p className="text-sm text-gray-600">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <p className="text-sm text-gray-600">Maintenance</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Properties;