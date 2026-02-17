// src/components/portal/manager/ManagerVacancyNotices.tsx
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle, Clock, Eye, MessageCircle, Send, FileText, User, Home } from 'lucide-react';

const ManagerVacancyNotices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Action State
  const [response, setResponse] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) fetchNotices();
  }, [user?.id]);
  
  // Fetch messages when selectedNotice changes
  useEffect(() => {
      if (selectedNotice) {
          fetchMessages(selectedNotice.id);

          // Subscribe to new messages
          const channel = supabase
            .channel(`manager_vacancy_messages_${selectedNotice.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'vacancy_notice_messages',
                filter: `vacancy_notice_id=eq.${selectedNotice.id}`
              },
              (payload) => {
                 // Check if it's our own message (we already optimistic updated)
                 // Or just re-fetch to be safe and get sender names
                 fetchMessages(selectedNotice.id);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
      } else {
          setMessages([]);
      }
  }, [selectedNotice]);

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
              sender: profiles?.find(p => p.id === m.sender_id) || { first_name: 'Unknown', last_name: '' }
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

  const fetchNotices = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch notices with property and unit details
      // Note: We avoid joining 'profiles' directly here because the FK points to auth.users, 
      // not public.profiles, which often causes PostgREST to fail finding the relationship.
      const { data: noticesData, error: noticesError } = await supabase
        .from('vacancy_notices')
        .select(`
          *,
          properties (name),
          units (unit_number)
        `)
        .order('created_at', { ascending: false });

      if (noticesError) throw noticesError;

      if (!noticesData || noticesData.length === 0) {
          setNotices([]);
          return;
      }

      // 2. Fetch tenant profiles manually (Client-side join)
      // This is more robust than relying on complex SQL joins for profiles
      const tenantIds = [...new Set(noticesData.map(n => n.tenant_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', tenantIds);
        
      if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          // Continue without profiles if this fails, rather than breaking the whole page
      }

      // 3. Merge data
      const combinedNotices = noticesData.map(notice => {
          const profile = profilesData?.find(p => p.id === notice.tenant_id);
          return {
              ...notice,
              profiles: profile || { first_name: 'Unknown', last_name: 'Tenant' }
          };
      });

      setNotices(combinedNotices);
      
    } catch (error: any) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load vacancy notices: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessNotice = async (status: string) => {
    if (!selectedNotice) return;
    
    // Validation
    if (status === 'inspection_scheduled' && !inspectionDate) {
        toast.error('Please select an inspection date');
        return;
    }

    setActionSubmitting(true);
    try {
      // 1. If there is a response text, add it as a message
      if (response && response.trim()) {
           // Optimistic update
           const tempMessage = {
               id: 'temp-' + Date.now(),
               vacancy_notice_id: selectedNotice.id,
               sender_id: user!.id,
               message: response.trim(),
               created_at: new Date().toISOString(),
               sender: { first_name: 'Me', last_name: '' }
           };
           setMessages(prev => [...prev, tempMessage]);

           const { error: msgError } = await supabase.from('vacancy_notice_messages').insert({
               vacancy_notice_id: selectedNotice.id,
               sender_id: user!.id,
               message: response.trim()
           });
           if (msgError) {
               console.error("Failed to add message:", msgError);
               // We don't stop the whole process, but we warn
               toast.error("Could not save message: " + msgError.message);
               // Revert optimistic update?
               setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
           }
      }

      // 2. Update status if it changed (or always update updated_at)
      const updates: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only change status if it's different from current
      if (status !== selectedNotice.status) {
          updates.status = status;
      }

      if (status === 'inspection_scheduled') {
        updates.inspection_date = inspectionDate;
      }
      // Note: We are no longer depending on 'manager_response' column in the parent table for history.
      // But we can update it with the latest message for backward compat if needed.
      if (response && response.trim()) {
          updates.manager_response = response;
      }

      const { error } = await supabase
        .from('vacancy_notices')
        .update(updates)
        .eq('id', selectedNotice.id);

      if (error) throw error;

      // 3. Send Notification to Tenant
      if (status !== selectedNotice.status || (response && response.trim())) {
         let notifTitle = "Vacancy Notice Update";
         let notifMessage = "Your vacancy notice has been updated.";
         
         if (status === 'inspection_scheduled') {
             notifTitle = "Inspection Scheduled";
             notifMessage = `An inspection has been scheduled for ${new Date(inspectionDate).toLocaleString()}.`;
         } else if (status === 'approved') {
             notifTitle = "Vacancy Notice Approved";
             notifMessage = "Your notice to vacate has been approved.";
         } else if (status === 'rejected') {
             notifTitle = "Vacancy Notice Rejected";
             notifMessage = "Your notice to vacate has been rejected. Please check for details.";
         } else if (response && response.trim()) {
             notifTitle = "New Message from Manager";
             notifMessage = "You have a new message regarding your vacancy notice.";
         }

         // Insert Notification
         await supabase.from('notifications').insert({
             recipient_id: selectedNotice.tenant_id,
             sender_id: user!.id,
             type: 'vacancy_update',
             title: notifTitle,
             message: notifMessage,
             related_entity_type: 'vacancy_notice',
             related_entity_id: selectedNotice.id,
             read: false
         });
      }

      if (status !== selectedNotice.status) {
         toast.success(`Notice updated to ${status.replace('_', ' ')}`);
      } else {
         toast.success('Reply sent successfully');
      }
      
      setResponse(''); // Clear input
      fetchMessages(selectedNotice.id); // Refresh chat
      
      // If we just replied (Save Reply Only), we might not want to close the dialog
      // But usually 'status' implies an action.
      // If the passed status is the current status, we keep dialog open?
      // For now, let's keep it open if it's just a reply, close if it's a status change.
      if (status === selectedNotice.status) {
           // stay open, refresh messages
      } else {
           setIsDialogOpen(false);
           fetchNotices(); // Refresh list only on status change actions
      }
      
    } catch (error: any) {
       toast.error('Failed to update: ' + error.message);
    } finally {
        setActionSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vacancy Notices</h2>
          <p className="text-muted-foreground">Manage move-out requests from tenants</p>
        </div>
        <Button variant="outline" onClick={fetchNotices} disabled={loading}>
            {loading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
            Refresh List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Received Notices</CardTitle>
          <CardDescription>
            {notices.length} active notice{notices.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="text-center p-4">Loading notices...</div>
          ) : notices.length === 0 ? (
             <div className="text-center p-8 text-muted-foreground">No vacancy notices found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Move Out Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell className="font-medium">
                      {notice.profiles?.first_name} {notice.profiles?.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{notice.properties?.name}</div>
                      <div className="text-xs text-muted-foreground">Unit {notice.units?.unit_number}</div>
                    </TableCell>
                    <TableCell>
                      {new Date(notice.move_out_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={notice.reason}>
                      {notice.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(notice.status)}>
                        {notice.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(notice.created_at).toLocaleDateString()}
                    </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedNotice(notice);
                              setResponse(''); // Start fresh for new messages
                              setInspectionDate(notice.inspection_date ? new Date(notice.inspection_date).toISOString().slice(0, 16) : '');
                              setIsDialogOpen(true);
                            }}
                          >
                              <Eye className="h-4 w-4 mr-1" /> View / Chat
                          </Button>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gray-50/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light text-[#00356B] tracking-tight flex items-center gap-2">
                 <FileText className="h-6 w-6" /> Review Vacancy Notice
            </DialogTitle>
            <DialogDescription>
               Manage the move-out process and communicate with the tenant.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotice && (
            <div className="space-y-6 mt-2">
                
                {/* Status Card */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${getStatusColor(selectedNotice.status).replace('text-', 'bg-').replace('100', '100')} ${getStatusColor(selectedNotice.status).replace('bg-', 'text-').replace('100', '600')}`}>
                             <Clock className="h-5 w-5" />
                         </div>
                         <div>
                             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Status</p>
                             <p className="text-lg font-medium capitalize text-gray-900">{selectedNotice.status.replace('_', ' ')}</p>
                         </div>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Move Out Date</p>
                         <p className="text-lg font-medium text-[#00356B]">{new Date(selectedNotice.move_out_date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase mb-3 text-[10px] tracking-wider">
                            <User className="h-3 w-3" /> Tenant Details
                         </h4>
                         <div className="space-y-1">
                             <p className="font-semibold text-gray-900 text-lg">{selectedNotice.profiles?.first_name} {selectedNotice.profiles?.last_name}</p>
                             <p className="text-sm text-gray-500">{selectedNotice.profiles?.email}</p>
                         </div>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase mb-3 text-[10px] tracking-wider">
                            <Home className="h-3 w-3" /> Property Details
                         </h4>
                         <div className="space-y-1">
                             <p className="font-semibold text-gray-900">{selectedNotice.properties?.name}</p>
                             <p className="text-sm text-gray-500">Unit {selectedNotice.units?.unit_number}</p>
                         </div>
                     </div>
                </div>

                {/* Conversation Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                     <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
                         <h4 className="flex items-center gap-2 text-sm font-bold text-[#00356B]">
                            <MessageCircle className="h-4 w-4" /> Communication History
                         </h4>
                         <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {messages.length} Messages
                         </span>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                        {/* Initial Request Bubble */}
                        <div className="flex flex-col items-start max-w-[85%]">
                            <div className="bg-white border border-gray-200 text-gray-600 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Original Request Reason</p>
                                <p className="text-sm leading-relaxed">{selectedNotice.reason}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 ml-1">
                                {new Date(selectedNotice.created_at).toLocaleString()}
                            </span>
                        </div>
                        
                        {messages.map((msg) => {
                           const isMe = user?.id && msg.sender_id === user.id;
                           return (
                             <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end ml-auto' : 'items-start'}`}>
                                <div className={`rounded-2xl p-3 text-sm shadow-sm leading-relaxed ${
                                   isMe 
                                     ? 'bg-[#00356B] text-white rounded-tr-none' 
                                     : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                }`}>
                                     {!isMe && (
                                         <p className="font-bold text-[10px] mb-1 opacity-50 uppercase tracking-widest text-blue-900/70">
                                            {msg.sender?.first_name || 'Tenant'}
                                         </p>
                                     )}
                                     {msg.message}
                                </div>
                                <span className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                    {new Date(msg.created_at).toLocaleString()}
                                </span>
                             </div>
                           )
                        })}
                     </div>
                     
                     <div className="p-3 bg-white border-t">
                        <div className="flex gap-2">
                             <Input 
                                value={response} 
                                onChange={(e) => setResponse(e.target.value)} 
                                placeholder="Type a message to the tenant..." 
                                className="border-gray-200 focus:border-[#00356B] focus:ring-[#00356B] bg-gray-50/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        // Save reply only on Enter
                                        handleProcessNotice(selectedNotice.status);
                                    }
                                }}
                             />
                             <Button 
                                size="icon"
                                className="bg-[#00356B] hover:bg-[#002a55]"
                                disabled={actionSubmitting || !response.trim()}
                                onClick={() => handleProcessNotice(selectedNotice.status)}
                                title="Send Message"
                             >
                                 <Send className="h-4 w-4" />
                             </Button>
                        </div>
                     </div>
                </div>

                {/* Control Panel */}
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="w-full md:w-auto">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Inspection Date</label>
                        <Input 
                           type="datetime-local" 
                           value={inspectionDate}
                           onChange={(e) => setInspectionDate(e.target.value)}
                           className="bg-white border-gray-300"
                        />
                     </div>
                     
                     <div className="flex gap-2 w-full md:w-auto justify-end">
                      {selectedNotice.status === 'pending' && (
                         <>
                           <Button 
                              variant="destructive" 
                              onClick={() => handleProcessNotice('rejected')}
                              disabled={actionSubmitting}
                              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300 shadow-sm"
                            >
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                           </Button>
                           <Button 
                              onClick={() => handleProcessNotice('inspection_scheduled')}
                              disabled={actionSubmitting}
                              className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-sm"
                           >
                                <Clock className="h-4 w-4 mr-1" /> Schedule Inspection
                           </Button>
                         </>
                      )}
                      
                      {selectedNotice.status === 'inspection_scheduled' && (
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm" 
                            onClick={() => handleProcessNotice('completed')}
                            disabled={actionSubmitting}
                          >
                               <CheckCircle className="h-4 w-4 mr-1" /> Complete / Approve
                          </Button>
                      )}

                      <Button 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerVacancyNotices;
