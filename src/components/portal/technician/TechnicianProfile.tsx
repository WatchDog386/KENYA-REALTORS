import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { technicianService } from '@/services/technicianService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Phone, MapPin, Wrench } from 'lucide-react';

const TechnicianProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [technician, setTechnician] = useState<any>(null);

    useEffect(() => {
        fetchProfile();
    }, [user?.id]);

    const fetchProfile = async () => {
        try {
            if (!user?.id) return;
            const data = await technicianService.getTechnicianByUserId(user.id);
            setTechnician(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#154279] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">My Profile</h1>
                    <p className="text-slate-500 font-medium">Manage your personal information and expertise.</p>
                </div>
                <Button className="bg-[#154279] hover:bg-[#1e5b9e]">
                    Edit Profile
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Info Card */}
                <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <div className="flex items-center h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                    <User className="mr-2 h-4 w-4 opacity-50" />
                                    {technician?.name || user?.email}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <div className="flex items-center h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                    <User className="mr-2 h-4 w-4 opacity-50" />
                                    {user?.email}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <div className="flex items-center h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                    <Phone className="mr-2 h-4 w-4 opacity-50" />
                                    {technician?.phone || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <div className="flex items-center h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                    <MapPin className="mr-2 h-4 w-4 opacity-50" />
                                    {technician?.address || 'Not provided'}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-sm font-semibold mb-4">Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                                {technician?.skills?.map((skill: string) => (
                                    <span key={skill} className="px-3 py-1 bg-blue-50 text-[#154279] rounded-full text-sm font-medium border border-blue-100">
                                        {skill}
                                    </span>
                                )) || (
                                    <span className="text-slate-500 text-sm italic">No skills listed</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Card */}
                <Card className="col-span-1 border-slate-200 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Status & Availability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-sm text-slate-500 mb-1">Current Status</div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${technician?.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span className="font-bold text-slate-700 capitalize">{technician?.status || 'Active'}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-sm text-slate-500 mb-1">Specialization</div>
                            <div className="flex items-center gap-2 font-medium text-slate-700">
                                <Wrench className="w-4 h-4 text-[#F96302]" />
                                {technician?.specialization || 'General Technician'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TechnicianProfile;
