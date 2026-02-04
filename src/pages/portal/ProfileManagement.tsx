// src/pages/portal/ProfileManagement.tsx
import React from 'react';
import { User, Mail, Phone, Camera } from 'lucide-react';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProfileManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Profile Management</h1>
              <p className="text-lg text-blue-100 max-w-2xl font-light">
                Manage your personal information and account settings
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
        <Card className="border-2 border-slate-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                <CardTitle className="text-[#154279] flex items-center gap-2 text-xl font-bold">
                    <User className="h-5 w-5" /> Personal Information
                </CardTitle>
                <CardDescription>Update your profile details.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                                <AvatarImage src="/placeholder-avatar.jpg" />
                                <AvatarFallback className="text-3xl bg-[#154279] text-white">AU</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500">Allowed *.jpeg, *.jpg, *.png, *.gif</p>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="fullName" defaultValue="Admin User" className="pl-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="email" defaultValue="admin@example.com" className="pl-10" disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input id="phone" defaultValue="(123) 456-7890" className="pl-10" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button className="bg-[#154279] hover:bg-[#0f325e]">Save Changes</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileManagement;