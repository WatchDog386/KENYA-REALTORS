// src/components/portal/manager/ManagerMaintenance.tsx
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, AlertCircle, Clock, CheckCircle, MessageCircle, Send, User, Home, Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const ManagerMaintenance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Update State
  const [scheduleDate, setScheduleDate] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadMaintenanceRequests();
  }, [user?.id]);
  
  useEffect(() => {
     if (selectedRequest) {
         fetchMessages(selectedRequest.id);
         
         // Realtime Chat
         const channel = supabase
            .channel(`manager_maintenance_chat_${selectedRequest.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'maintenance_request_messages',
                    filter: `maintenance_request_id=eq.${selectedRequest.id}`
                },
                (payload) => {
                    fetchMessages(selectedRequest.id);
                }
            )
            .subscribe();
            
         return () => { supabase.removeChannel(channel); };
     } else {
         setMessages([]);
     }
  }, [selectedRequest]);

  const loadMaintenanceRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Get all requests for properties managed by this user
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
          console.warn("Error loading requests:", error);
          setRequests([]);
          return;
      }

      if (data) {
          // Manually enrich data to avoid 400 errors from missing relationships
          const propertyIds = [...new Set(data.map(r => r.property_id).filter(Boolean))];
          const unitIds = [...new Set(data.map(r => r.unit_id).filter(Boolean))];
          const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];

          const { data: properties } = await supabase.from('properties').select('id, name').in('id', propertyIds);
          const { data: units } = await supabase.from('units').select('id, unit_number').in('id', unitIds);
          const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds);

          const enrichedData = data.map(r => ({
              ...r,
              properties: properties?.find(p => p.id === r.property_id) || { name: 'Unknown' },
              units: units?.find(u => u.id === r.unit_id) || { unit_number: 'N/A' },
              profiles: profiles?.find(p => p.id === r.user_id) || { first_name: 'Unknown', last_name: '', email: '' }
          }));
          
          setRequests(enrichedData);
      } else {
          setRequests([]);
      }
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async (requestId: string) => {
      try {
          setMessagesLoading(true);
          const { data, error } = await supabase
            .from('maintenance_request_messages')
            .select('*')
            .eq('maintenance_request_id', requestId)
            .order('created_at', { ascending: true });
            
          if (error) throw error;
          
          const rawMsgs = data || [];
          
          if (rawMsgs.length > 0) {
              const senderIds = [...new Set(rawMsgs.map(m => m.sender_id))];
              const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', senderIds);
              
              const merged = rawMsgs.map(m => ({
                  ...m,
                  sender: profiles?.find(p => p.id === m.sender_id) || { first_name: 'Unknown', last_name: '' }
              }));
              setMessages(merged);
          } else {
              setMessages([]);
          }
      } catch (e) {
          console.error("Fetch msg error", e);
      } finally {
          setMessagesLoading(false);
      }
  };

  const handleSendMessage = async () => {
      if (!newMessage.trim() || !selectedRequest) return;
      
      const content = newMessage.trim();
      
      // Optimistic
      const tempMsg = {
          id: 'temp-' + Date.now(),
          maintenance_request_id: selectedRequest.id,
          sender_id: user!.id,
          message: content,
          created_at: new Date().toISOString(),
          sender: { first_name: 'Me', last_name: '' }
      };
      setMessages(prev => [...prev, tempMsg]);
      setNewMessage("");
      
      try {
          const { error } = await supabase.from('maintenance_request_messages').insert({
              maintenance_request_id: selectedRequest.id,
              sender_id: user!.id,
              message: content
          });
          
          if (error) throw error;
          
          // Notify Tenant
          await supabase.from('notifications').insert({
              recipient_id: selectedRequest.tenant_id,
              sender_id: user!.id,
              type: 'maintenance',
              title: 'Maintenance Update',
              message: `New message regarding your maintenance request: ${selectedRequest.title}`,
              related_entity_id: selectedRequest.id,
              read: false
          });
          
      } catch (e) {
          console.error("Send error", e);
          toast.error("Failed to send message");
          setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      }
  };

  const handleUpdateStatus = async (status: string) => {
      if (!selectedRequest) return;
      setUpdating(true);
      try {
          const updates: any = { status, updated_at: new Date().toISOString() };
          if (status === 'in_progress' && scheduleDate) {
              updates.scheduled_date = scheduleDate;
          }
          
          const { error } = await supabase
            .from('maintenance_requests')
            .update(updates)
            .eq('id', selectedRequest.id);
            
          if (error) throw error;
          
          toast.success(`Request marked as ${status.replace('_', ' ')}`);
          
          // Notify Tenant
          await supabase.from('notifications').insert({
              recipient_id: selectedRequest.tenant_id,
              sender_id: user!.id,
              type: 'maintenance',
              title: `Maintenance Request ${status === 'in_progress' ? 'Scheduled' : 'Updated'}`,
              message: `Your request "${selectedRequest.title}" is now ${status.replace('_', ' ')}. ${status === 'in_progress' && scheduleDate ? `Scheduled for ${new Date(scheduleDate).toLocaleString()}` : ''}`,
              related_entity_id: selectedRequest.id,
              read: false
          });
          
          // Update local state
          setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, ...updates } : r));
          setSelectedRequest(prev => ({ ...prev, ...updates }));
          
          if (status === 'completed' || status === 'cancelled') {
              setIsDialogOpen(false);
          }
          
      } catch (e: any) {
          toast.error("Failed to update: " + e.message);
      } finally {
          setUpdating(false);
      }
  };

  const getPriorityBadge = (priority: string) => {
      const colors = {
          emergency: 'bg-red-100 text-red-800',
          high: 'bg-orange-100 text-orange-800',
          medium: 'bg-yellow-100 text-yellow-800',
          low: 'bg-blue-100 text-blue-800'
      };
      return <Badge variant="outline" className={colors[priority as keyof typeof colors]}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
      const colors = {
          completed: 'bg-green-100 text-green-800',
          in_progress: 'bg-blue-100 text-blue-800',
          pending: 'bg-yellow-100 text-yellow-800',
          cancelled: 'bg-gray-100 text-gray-800'
      };
      return <Badge variant="outline" className={colors[status as keyof typeof colors]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-4xl font-light text-[#00356B] tracking-tight flex items-center gap-2">
             <Wrench className="h-8 w-8" /> Maintenance
           </h1>
           <p className="text-gray-600">Manage repair requests and work orders</p>
        </div>
        <Button onClick={loadMaintenanceRequests} variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Requests</CardTitle>
          <CardDescription>Overview of all maintenance tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-lg border border-dashed border-gray-200">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No maintenance requests found.</p>
            </div>
          ) : (
             <Table>
                 <TableHeader>
                     <TableRow>
                         <TableHead>Priority</TableHead>
                         <TableHead>Issue / Property</TableHead>
                         <TableHead>Tenant</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Requested</TableHead>
                         <TableHead></TableHead>
                     </TableRow>
                 </TableHeader>
                 <TableBody>
                     {requests.map(req => (
                         <TableRow key={req.id} className="cursor-pointer hover:bg-slate-50" onClick={() => {
                             setSelectedRequest(req);
                             setScheduleDate(req.scheduled_date ? new Date(req.scheduled_date).toISOString().slice(0, 16) : "");
                             setIsDialogOpen(true);
                         }}>
                             <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                             <TableCell>
                                 <div className="font-medium text-gray-900">{req.title}</div>
                                 <div className="text-xs text-gray-500">{req.properties?.name} {req.units?.unit_number ? ` • Unit ${req.units.unit_number}` : ''}</div>
                             </TableCell>
                             <TableCell>
                                 <div className="text-sm">{req.profiles?.first_name} {req.profiles?.last_name}</div>
                             </TableCell>
                             <TableCell>{getStatusBadge(req.status)}</TableCell>
                             <TableCell className="text-gray-500 text-xs">
                                 {new Date(req.created_at).toLocaleDateString()}
                             </TableCell>
                             <TableCell>
                                 <Button variant="ghost" size="sm">View</Button>
                             </TableCell>
                         </TableRow>
                     ))}
                 </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>

      {/* Main Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-gray-50">
              {selectedRequest && (
                  <div className="flex flex-col h-full max-h-[90vh]">
                      <div className="p-6 border-b bg-white">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h2 className="text-xl font-bold text-gray-900">{selectedRequest.title}</h2>
                                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                      <Home size={14} /> {selectedRequest.properties?.name} • Unit {selectedRequest.units?.unit_number}
                                  </p>
                              </div>
                              {getStatusBadge(selectedRequest.status)}
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                          
                          {/* Left Panel: Info & Actions */}
                          <div className="w-full md:w-1/3 p-6 overflow-y-auto border-r border-gray-200 bg-white">
                              <div className="space-y-6">
                                  <div>
                                      <label className="text-xs font-bold text-gray-400 uppercase">Tenant</label>
                                      <div className="flex items-center gap-2 mt-2">
                                          <div className="bg-gray-100 p-2 rounded-full"><User size={16} /></div>
                                          <div>
                                              <p className="text-sm font-medium">{selectedRequest.profiles?.first_name} {selectedRequest.profiles?.last_name}</p>
                                              <p className="text-xs text-gray-500">{selectedRequest.profiles?.email}</p>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div>
                                       <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                                       <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed">
                                           {selectedRequest.description}
                                       </p>
                                  </div>

                                  {selectedRequest.images && selectedRequest.images.length > 0 && (
                                     <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Attachments</label>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {selectedRequest.images.map((img: string, i: number) => (
                                                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg bg-gray-100 border overflow-hidden flex-shrink-0">
                                                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                     </div>
                                  )}
                                  
                                  <div className="pt-6 border-t space-y-4">
                                      <h4 className="font-semibold text-sm">Actions</h4>
                                      
                                      {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                                          <>
                                              <div className="space-y-2">
                                                  <label className="text-xs text-gray-500">Schedule Visit</label>
                                                  <Input 
                                                     type="datetime-local" 
                                                     value={scheduleDate} 
                                                     onChange={(e) => setScheduleDate(e.target.value)}
                                                     className="text-xs"
                                                  />
                                              </div>
                                              <Button 
                                                 className="w-full bg-blue-600 hover:bg-blue-700" 
                                                 size="sm"
                                                 onClick={() => handleUpdateStatus('in_progress')}
                                                 disabled={updating}
                                              >
                                                  {updating ? <Loader2 className="animate-spin w-4 h-4" /> : 'Schedule / Start Work'}
                                              </Button>
                                              <Button
                                                  className="w-full bg-green-600 hover:bg-green-700"
                                                  size="sm"
                                                  onClick={() => handleUpdateStatus('completed')}
                                                  disabled={updating}
                                              >
                                                   Mark Completed
                                              </Button>
                                          </>
                                      )}
                                      
                                      {selectedRequest.status === 'completed' && (
                                          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                                              <CheckCircle size={16} /> Work Completed
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                          
                          {/* Right Panel: Chat */}
                          <div className="w-full md:w-2/3 flex flex-col bg-gray-50">
                              <div className="p-3 border-b bg-white/50 backdrop-blur flex items-center gap-2">
                                  <MessageCircle size={16} className="text-blue-600" />
                                  <span className="text-sm font-medium text-gray-700">Message Thread</span>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                  {messages.length === 0 && (
                                      <div className="text-center py-12 text-gray-400">
                                          <p className="text-sm">No communication history</p>
                                      </div>
                                  )}
                                  {messages.map((msg) => {
                                      const isMe = user?.id && msg.sender_id === user.id;
                                      return (
                                          <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end ml-auto' : 'items-start'}`}>
                                              <div className={`rounded-2xl p-3 text-sm shadow-sm leading-relaxed ${
                                                  isMe 
                                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                                  : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
                                              }`}>
                                                  {!isMe && (
                                                      <p className="font-bold text-[10px] mb-1 opacity-50 uppercase tracking-widest">
                                                         {msg.sender?.first_name || 'Tenant'}
                                                      </p>
                                                  )}
                                                  {msg.message}
                                              </div>
                                              <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                  {new Date(msg.created_at).toLocaleString()}
                                              </span>
                                          </div>
                                      )
                                  })}
                              </div>
                              
                              <div className="p-3 bg-white border-t">
                                  <form 
                                    className="flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                  >
                                      <Input 
                                          placeholder="Type a message..." 
                                          value={newMessage}
                                          onChange={(e) => setNewMessage(e.target.value)}
                                          disabled={updating}
                                          className="bg-gray-50 border-gray-200"
                                      />
                                      <Button type="submit" size="icon" disabled={!newMessage.trim() || updating} className="bg-blue-600">
                                          <Send size={16} />
                                      </Button>
                                  </form>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerMaintenance;
