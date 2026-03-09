import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProperty } from '@/hooks/useProperties';
import { ArrowLeft, MapPin, Bed, Bath, Square, Star, Share2, Heart, Check } from 'lucide-react';

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { property, isLoading, error } = useProperty(id || '');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Property Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Listings
        </button>

        {/* Property Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin size={18} />
              <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
            </div>
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Bed size={20} className="text-gray-500" />
                <span className="font-medium">{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath size={20} className="text-gray-500" />
                <span className="font-medium">{property.bathrooms} baths</span>
              </div>
              <div className="flex items-center gap-2">
                <Square size={20} className="text-gray-500" />
                <span className="font-medium">{property.square_feet} sqft</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {formatPrice(property.price)}
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              {property.status === 'occupied' && (
                <div className="text-sm text-gray-600">Available from next month</div>
              )}
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
              <img
                src={property.images?.[selectedImage] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {property.images?.slice(0, 4).map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden ${
                  selectedImage === index ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={img}
                  alt={`${property.title} ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Amenities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check size={20} className="text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Schedule a Tour
              </h3>
              <div className="space-y-4">
                <button className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Request Viewing
                </button>
                <button className="w-full border border-primary text-primary py-3 px-4 rounded-lg font-medium hover:bg-primary/10 transition-colors">
                  Contact Agent
                </button>
              </div>
            </div>

            {/* Agent Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Property Manager</h4>
                  <p className="text-sm text-gray-600">Available 9AM-5PM</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Properties Managed</span>
                  <span className="font-medium">24+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;