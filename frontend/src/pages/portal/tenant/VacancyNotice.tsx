// src/pages/portal/tenant/VacancyNotice.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Send, FileText, CheckCircle, Clock, MessageCircle, Home, MapPin, User, Info, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VacancyNoticePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingNotice, setExistingNotice] = useState<any>(null);

  // Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Tenant Details
  const [tenantDetails, setTenantDetails] = useState<{
    firstName: string;
    lastName: string;
    propertyId: string;
    propertyName: string;
    unitId: string;
    unitNumber: string;
  } | null>(null);

  // Form State
  const [moveOutDate, setMoveOutDate] = useState('');
  const [reason, setReason] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (user?.id) fetchTenantDetails();
  }, [user?.id]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user!.id)
        .single();

      // 2. Fetch Active Lease to get Property/Unit
      const { data: lease } = await supabase
        .from('tenant_leases')
        .select(`
          units (
            id,
            unit_number,
            properties (
                id,
                name
            )
          )
        `)
        .eq('tenant_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();

      if (lease && lease.units && lease.units.properties) {
        setTenantDetails({
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          propertyId: lease.units.properties.id,
          propertyName: lease.units.properties.name,
          unitId: lease.units.id,
          unitNumber: lease.units.unit_number,
        });
      }

      // 3. Check if already submitted
      const { data: notices } = await supabase
        .from('vacancy_notices')
        .select('*')
        .eq('tenant_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (notices && notices.length > 0) {
        setExistingNotice(notices[0]);
        // If notice exists, fetch messages
        // fetchMessages is called by the effect below now
      }

    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!existingNotice) return;
    
    // Initial fetch
    fetchMessages(existingNotice.id);

    // Subscribe to new messages
    const channel = supabase
      .channel(`vacancy_messages_${existingNotice.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vacancy_notice_messages',
          filter: `vacancy_notice_id=eq.${existingNotice.id}`
        },
        async (payload) => {
          // Verify if the message is already in state (prevent duplicates from optimistic updates or double firing)
          const newMessage = payload.new;
          setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              
              // We need to fetch the sender name since the real-time payload doesn't have joined data
              // But for simplicity/speed, we can just fetch all again or try to append if we know who sent it
              // A full fetch is safer to get the relation
              fetchMessages(existingNotice.id);
              return prev; 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [existingNotice?.id]);

  const fetchMessages = async (noticeId: string) => {
    try {
      setMessagesLoading(true);
      // 1. Fetch messages (No joins to avoid RLS issues)
      const { data: msgs, error } = await supabase
        .from('vacancy_notice_messages')
        .select('*')
        .eq('vacancy_notice_id', noticeId)
        .order('created_at', { ascending: true });
        
      if (error) {
         console.warn("Could not fetch messages:", error);
         return;
      }
      
      const rawMessages = msgs || [];

      // 2. Fetch sender profiles manually
      if (rawMessages.length > 0) {
          const senderIds = [...new Set(rawMessages.map(m => m.sender_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', senderIds);
          
          // Merge
          const mergedMessages = rawMessages.map(m => ({
              ...m,
              sender: profiles?.find(p => p.id === m.sender_id) || { first_name: 'User', last_name: '' }
          }));
          setMessages(mergedMessages);
      } else {
          setMessages([]);
      }

    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const notifyManagers = async (noticeId: string, message?: string) => {
    if (!tenantDetails?.propertyId) return;
    try {
        const { data: managers } = await supabase
            .from('property_manager_assignments')
            .select('manager_id')
            .eq('property_id', tenantDetails.propertyId);
        
        if (managers && managers.length > 0) {
            const notifications = managers.map(m => ({
                recipient_id: m.manager_id,
                sender_id: user!.id,
                type: 'vacancy_update',
                title: message ? 'New Vacancy Message' : 'New Vacancy Notice',
                message: message 
                    ? `New message from ${tenantDetails.firstName} ${tenantDetails.lastName}` 
                    : `${tenantDetails.firstName} ${tenantDetails.lastName} submitted a notice to vacate Unit ${tenantDetails.unitNumber}`,
                related_entity_type: 'vacancy_notice',
                related_entity_id: noticeId,
                read: false
            }));
            await supabase.from('notifications').insert(notifications);
        }
    } catch (e) { console.error("Notify error:", e); }
  };
  
  const handleSendMessage = async () => {
     if (!newMessage.trim() || !existingNotice) return;
     
     try {
       const { error } = await supabase.from('vacancy_notice_messages').insert({
         vacancy_notice_id: existingNotice.id,
         sender_id: user!.id,
         message: newMessage.trim()
       });
       
       if (error) throw error;
       
       setNewMessage('');
       // fetchMessages(existingNotice.id); // Handled by subscription now
       // But keeping it doesn't hurt for immediate feedback if sub is slow
       
       // Optimistic Update
       const optimisticMsg = {
           id: 'temp-' + Date.now(),
           vacancy_notice_id: existingNotice.id,
           sender_id: user!.id,
           message: newMessage.trim(),
           created_at: new Date().toISOString(),
           sender: { first_name: 'Me', last_name: '' }
       };
       setMessages(prev => [...prev, optimisticMsg]);

       toast.success('Message sent');
       
       // Notify Manager
       notifyManagers(existingNotice.id, newMessage.trim());
     } catch (error: any) {
        toast.error("Failed to send message: " + error.message);
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantDetails || !moveOutDate || !reason) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('vacancy_notices').insert({
        tenant_id: user!.id,
        property_id: tenantDetails.propertyId,
        unit_id: tenantDetails.unitId,
        move_out_date: moveOutDate,
        reason: reason,
        status: 'pending'
      }).select();

      if (error) throw error;

      toast.success('Vacancy notice sent successfully!');
      
      if (data && data[0]) {
          notifyManagers(data[0].id);
      }
      
      fetchTenantDetails(); // Refresh
      setIsCreatingNew(false); // Switch to history view
    } catch (error: any) {
      toast.error('Failed to send notice: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (!tenantDetails) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-medium">No Active Lease Found</h3>
            <p className="text-gray-500">You must have an active lease to submit a vacancy notice.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inspection_scheduled': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // View Submitted Notice
  if (existingNotice && !isCreatingNew) {
     return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-light text-[#00356B] tracking-tight mb-2 flex items-center gap-2">
                         <FileText className="h-8 w-8 text-[#00356B]" /> Notice Submitted
                    </h1>
                    <p className="text-gray-600">Track the status of your move-out request and communicate with management.</p>
                </div>
                <div className="text-right hidden md:block space-y-2">
                     <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Submitted On</p>
                        <p className="font-medium text-gray-900">{new Date(existingNotice.created_at).toLocaleDateString()}</p>
                     </div>
                     {(existingNotice.status === 'rejected' || existingNotice.status === 'completed' || existingNotice.status === 'cancelled') && (
                        <Button 
                            onClick={() => setIsCreatingNew(true)} 
                            size="sm" 
                            variant="outline"
                            className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Plus className="h-4 w-4 mr-1" /> New Notice
                        </Button>
                     )}
                </div>
            </div>

            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`p-3 rounded-full ${getStatusColor(existingNotice.status).replace('text-', 'bg-').replace('100', '100')} ${getStatusColor(existingNotice.status).replace('bg-', 'text-').replace('100', '600')}`}>
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Status</p>
                            <p className="text-xl font-medium capitalize text-gray-900">{existingNotice.status.replace('_', ' ')}</p>
                        </div>
                </div>
                
                {existingNotice.status === 'inspection_scheduled' && existingNotice.inspection_date && (
                    <div className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100 w-full md:w-auto">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                             <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Inspection Date</p>
                             <p className="font-bold text-blue-900">{new Date(existingNotice.inspection_date).toLocaleString()}</p>
                        </div>
                    </div>
                )}
                
                <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Move Out Date</p>
                        <p className="text-xl font-medium text-[#00356B]">{new Date(existingNotice.move_out_date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                
                {/* Left Column: Details */}
                <div className="space-y-6 md:col-span-1">
                     <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                         <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">
                            <Home className="h-4 w-4" /> Property Details
                         </h4>
                         <div className="space-y-3">
                             <div>
                                 <p className="text-xs text-gray-400 uppercase">Property</p>
                                 <p className="font-semibold text-gray-900">{tenantDetails.propertyName}</p>
                             </div>
                             <div>
                                 <p className="text-xs text-gray-400 uppercase">Unit Number</p>
                                 <p className="font-semibold text-gray-900">{tenantDetails.unitNumber}</p>
                             </div>
                             <div>
                                 <p className="text-xs text-gray-400 uppercase">Tenant</p>
                                 <p className="font-medium text-gray-900">{tenantDetails.firstName} {tenantDetails.lastName}</p>
                             </div>
                         </div>
                     </div>
                </div>

                {/* Right Column: Chat */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <MessageCircle className="h-4 w-4 text-blue-700" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#00356B]">Communication History</h4>
                                    <p className="text-xs text-gray-500">Direct line to property management</p>
                                </div>
                            </div>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium border border-gray-200">
                                {messages.length + 1} item{messages.length !== 0 ? 's' : ''}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                            {/* Original Request Bubble */}
                            <div className="flex flex-col items-end max-w-[85%] ml-auto">
                                <div className="bg-[#00356B] text-white rounded-2xl rounded-tr-none p-4 shadow-sm relative group">
                                    <p className="text-[10px] font-bold text-blue-200 uppercase mb-1 tracking-wider border-b border-blue-400/30 pb-1">Original Request</p>
                                    <p className="text-sm leading-relaxed">{existingNotice.reason}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 mr-1 flex items-center gap-1">
                                    You • {new Date(existingNotice.created_at).toLocaleString()}
                                </span>
                            </div>
                            
                            {messages.map((msg) => {
                            const isMe = user?.id && msg.sender_id === user.id;
                            return (
                                <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end ml-auto' : 'items-start'}`}>
                                    <div className={`rounded-2xl p-4 text-sm shadow-sm leading-relaxed ${
                                    isMe 
                                        ? 'bg-[#00356B] text-white rounded-tr-none' 
                                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                    }`}>
                                        {!isMe && (
                                            <p className="font-bold text-[10px] mb-1 opacity-50 uppercase tracking-widest text-blue-900/70 border-b border-gray-100 pb-1">
                                                {msg.sender?.first_name || 'Manager'}
                                            </p>
                                        )}
                                        {msg.message}
                                    </div>
                                    <span className={`text-[10px] text-gray-400 mt-1 flex items-center gap-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                        {isMe ? 'You' : 'Manager'} • {new Date(msg.created_at).toLocaleString()}
                                    </span>
                                </div>
                            )
                            })}
                        </div>
                        
                        <div className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <Input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message to the manager..." 
                                    className="border-gray-200 focus:border-[#00356B] focus:ring-[#00356B] bg-gray-50/50 h-10"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button 
                                    size="icon"
                                    className="bg-[#00356B] hover:bg-[#002a55] h-10 w-10 shrink-0"
                                    disabled={!newMessage.trim()}
                                    onClick={handleSendMessage}
                                    title="Send Message"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
     )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-light text-[#00356B] tracking-tight mb-2">Notice to Vacate</h1>
            <p className="text-gray-600">Submit your official notice to vacate the property.</p>
        </div>
        {existingNotice && (
             <Button variant="outline" onClick={() => setIsCreatingNew(false)} className="w-full md:w-auto">
                 Cancel & View History
             </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Please provide your move-out details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant Name</Label>
                <Input value={`${tenantDetails.firstName} ${tenantDetails.lastName}`} disabled className="bg-gray-100" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Property</Label>
                    <Input value={tenantDetails.propertyName} disabled className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input value={tenantDetails.unitNumber} disabled className="bg-gray-100" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveOutDate">Proposed Move-out Date</Label>
                <Input 
                   id="moveOutDate"
                   type="date" 
                   value={moveOutDate}
                   onChange={(e) => setMoveOutDate(e.target.value)}
                   required
                   min={new Date().toISOString().split('T')[0]} // Cannot be in past
                   className="bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Moving</Label>
                <Textarea 
                   id="reason"
                   value={reason}
                   onChange={(e) => setReason(e.target.value)}
                   placeholder="e.g. Relocating for work, buying a house..."
                   required
                   className="bg-white text-gray-900 border-gray-300 min-h-[100px]"
                />
              </div>

              <Button type="submit" className="w-full bg-[#154279] hover:bg-[#154279]/90" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Official Notice'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="space-y-4">
           <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
             <FileText className="h-5 w-5" /> Generated Notice Preview
           </h3>
           
           <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 font-serif leading-relaxed text-gray-800 text-sm md:text-base relative">
             {/* Paper styling */}
             <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h2 className="text-2xl font-bold uppercase text-center">Official Notice to Vacate</h2>
             </div>

             <p className="mb-4">
                <strong>Date:</strong> {new Date().toLocaleDateString()}
             </p>

             <p className="mb-4">
                <strong>To:</strong> Property Management<br/>
                <strong>Re:</strong> Notice of Intent to Vacate Unit {tenantDetails.unitNumber}
             </p>

             <p className="mb-4">
                Dear Property Manager,
             </p>

             <p className="mb-4">
                This letter serves as my formal written notice to vacate the residence located at 
                <strong> {tenantDetails.propertyName}, Unit {tenantDetails.unitNumber}</strong>. 
             </p>

             <p className="mb-4">
                I intend to vacate the premises on 
                <strong className="text-blue-700 underline decoration-dotted ml-1 mr-1">
                    {moveOutDate ? new Date(moveOutDate).toLocaleDateString() : '[Select Date]'}
                </strong>.
             </p>

             {reason && (
                 <p className="mb-4">
                    <strong>Reason:</strong> {reason}
                 </p>
             )}

             <p className="mb-8">
                I understand that I am responsible for rent payment until the end of my lease or notice period, 
                and that a move-out inspection will be conducted to determine the return of my security deposit.
             </p>

             <div className="mt-8 pt-8 border-t border-gray-300">
                <p className="font-signature text-xl mb-1">{tenantDetails.firstName} {tenantDetails.lastName}</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Tenant Signature (Digital)</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VacancyNoticePage;
