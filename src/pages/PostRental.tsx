// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Upload, MapPin, DollarSign, Home, Bed, Bath, Square, Image, Check } from "lucide-react";

const PostRental = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    amenities: [] as string[],
    images: [] as File[],
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    isAvailable: true
  });

  const amenitiesList = [
    "WiFi",
    "Parking",
    "Pool",
    "Gym",
    "Security",
    "Laundry",
    "AC",
    "Furnished",
    "Pet Friendly",
    "Balcony",
    "Garden",
    "Elevator"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...Array.from(files)]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // In production, this would submit to your backend
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Property Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Modern 2-Bedroom Apartment in Westlands"
            required
          />
        </div>
        <div>
          <Label htmlFor="propertyType">Property Type *</Label>
          <Select onValueChange={(value) => handleSelectChange("propertyType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="commercial">Commercial Space</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your property in detail..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="price">Monthly Rent (Ksh) *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="45000"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="location">Location *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="Westlands, Nairobi"
              required
            />
          </div>
        </div>
        <div>
          <Label>Availability</Label>
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={formData.isAvailable}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
            />
            <span className="text-sm">{formData.isAvailable ? "Available Now" : "Not Available"}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertyDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <div className="relative">
            <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="2"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <div className="relative">
            <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="2"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="squareFeet">Square Feet</Label>
          <div className="relative">
            <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="squareFeet"
              name="squareFeet"
              type="number"
              value={formData.squareFeet}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="1200"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
          >
            <Home className="w-4 h-4 mr-2" />
            Furnished: {formData.isAvailable ? "Yes" : "No"}
          </Button>
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Amenities</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {amenitiesList.map((amenity) => (
            <Button
              key={amenity}
              type="button"
              variant={formData.amenities.includes(amenity) ? "default" : "outline"}
              className="justify-start"
              onClick={() => handleAmenityToggle(amenity)}
            >
              {formData.amenities.includes(amenity) && <Check className="w-4 h-4 mr-2" />}
              {amenity}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderImages = () => (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block">Upload Property Images</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Drag & drop images here, or click to browse</p>
          <p className="text-sm text-gray-500 mb-4">Recommended: At least 3 high-quality images (max 10MB each)</p>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="image-upload" className="cursor-pointer">
              <Image className="w-4 h-4 mr-2" />
              Select Images
            </label>
          </Button>
        </div>
      </div>

      {formData.images.length > 0 && (
        <div>
          <Label className="mb-3 block">Selected Images ({formData.images.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Property ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 w-6 h-6 p-0"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }));
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="contactName">Contact Name *</Label>
          <Input
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPhone">Contact Phone *</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            placeholder="+254 711 000 000"
            required
          />
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact Email *</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleInputChange}
            placeholder="john@example.com"
            required
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This contact information will be visible to potential tenants.
          Make sure it's up-to-date and accurate.
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Rental</h1>
        <p className="text-gray-600">List your property for rent on Realtors Kenya</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Property Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Fill in all required fields (*) to list your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="basic" className="space-y-6">
                {renderBasicInfo()}
              </TabsContent>
              <TabsContent value="details" className="space-y-6">
                {renderPropertyDetails()}
              </TabsContent>
              <TabsContent value="images" className="space-y-6">
                {renderImages()}
              </TabsContent>
              <TabsContent value="contact" className="space-y-6">
                {renderContactInfo()}
              </TabsContent>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "details", "images", "contact"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                  }}
                  disabled={activeTab === "basic"}
                >
                  Previous
                </Button>
                
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["basic", "details", "images", "contact"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  className={activeTab === "contact" ? "hidden" : ""}
                >
                  Next Step
                </Button>

                {activeTab === "contact" && (
                  <Button type="submit" className="bg-[#5BB539] hover:bg-[#4a942e]">
                    Publish Listing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </Tabs>

        {/* Preview Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your listing will appear to tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  {formData.images.length > 0 ? (
                    <img
                      src={URL.createObjectURL(formData.images[0])}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Image className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  {formData.title || "Your property title will appear here"}
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  {formData.location && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {formData.location}
                    </span>
                  )}
                  {formData.price && (
                    <span className="flex items-center gap-1 font-bold text-green-600">
                      <DollarSign className="w-4 h-4" />
                      Ksh {formData.price}/month
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">
                  {formData.description || "Property description will appear here..."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.bedrooms && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {formData.bedrooms} Beds
                    </span>
                  )}
                  {formData.bathrooms && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {formData.bathrooms} Baths
                    </span>
                  )}
                  {formData.squareFeet && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {formData.squareFeet} sq ft
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default PostRental;