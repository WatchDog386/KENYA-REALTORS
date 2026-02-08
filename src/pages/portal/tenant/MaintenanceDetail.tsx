import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Wrench, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Image as ImageIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const MaintenanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (user?.id && id) {
      fetchRequestDetails();
      fetchMessages();

      // Realtime subscription for Messages
      const channel = supabase
        .channel(`maintenance_messages_${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'maintenance_request_messages',
            filter: `maintenance_request_id=eq.${id}`
          },
          (payload) => {
             // Re-fetch to get sender details easily and avoid "ghost" messages
             fetchMessages();
          }
        )
        .subscribe();
        
       // Realtime subscription for Status Updates
       const reqChannel = supabase
        .channel(`maintenance_request_update_${id}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'maintenance_requests',
                filter: `id=eq.${id}`
            },
            (payload) => {
                setRequest((prev: any) => ({ ...prev, ...payload.new }));
                toast.info(`Request status updated to ${payload.new.status}`);
            }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(reqChannel);
      };
    }
  }, [user?.id, id]);

  const fetchRequestDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select(`
            *,
            units:units!fk_maintenance_units (unit_number),
            properties:properties!fk_maintenance_properties (name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load request details");
      navigate("/portal/tenant/maintenance");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      setMessagesLoading(true);
      
      // 1. Fetch messages
      const { data: msgs, error } = await supabase
        .from("maintenance_request_messages")
        .select("*")
        .eq("maintenance_request_id", id)
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      
      const rawMessages = msgs || [];
      
      // 2. Fetch sender profiles manually for robustness
      if (rawMessages.length > 0) {
          const senderIds = [...new Set(rawMessages.map((m: any) => m.sender_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', senderIds);
            
          const merged = rawMessages.map((m: any) => ({
              ...m,
              sender: profiles?.find((p: any) => p.id === m.sender_id) || { first_name: 'User', last_name: '' }
          }));
          setMessages(merged);
      } else {
          setMessages([]);
      }

    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !user) return;

    const msgContent = newMessage.trim();
    
    // Optimistic Update
    const optimisticMsg = {
        id: 'temp-' + Date.now(),
        maintenance_request_id: id,
        sender_id: user.id,
        message: msgContent,
        created_at: new Date().toISOString(),
        sender: { first_name: 'Me', last_name: '' } // Placeholder
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");

    try {
      const { error } = await supabase.from("maintenance_request_messages").insert({
        maintenance_request_id: id,
        sender_id: user.id,
        message: msgContent
      });

      if (error) throw error;
      
      // Notify Manager logic (simplified trigger)
      notifyManager(msgContent);

    } catch (error: any) {
      toast.error("Failed to send message");
      // Revert optimistic? 
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };
  
  const notifyManager = async (msg: string) => {
      // Find property managers
      if (!request?.property_id) return;
      try {
          const { data: assignments } = await supabase
            .from('property_manager_assignments')
            .select('manager_id') // changed from property_manager_id based on schema checks, or fallback
            // Actually, based on previous greps, column is property_manager_id
            .eq('property_id', request.property_id);
          
          if (!assignments || assignments.length === 0) return;
          
          const notifs = assignments.map((a: any) => ({
             recipient_id: a.property_manager_id || a.manager_id, // Safety check
             sender_id: user!.id,
             type: 'maintenance', // Generic type
             title: 'New Maintenance Message',
             message: `New message on request #${id?.slice(0,8)}: ${msg.substring(0, 30)}...`,
             related_entity_id: id,
             read: false
          }));
          
          await supabase.from('notifications').insert(notifs);
          
      } catch(e) { console.error(e); }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'completed': return <Badge className="bg-green-600">Completed</Badge>;
        case 'in_progress': return <Badge className="bg-blue-600">In Progress</Badge>;
        case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
        case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-8"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div></div>;
  if (!request) return <div className="p-8">Request not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <Button variant="ghost" className="pl-0 gap-2 text-gray-500 hover:text-[#00356B]" onClick={() => navigate("/portal/tenant/maintenance")}>
        <ArrowLeft size={18} /> Back to Requests
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">{request.title}</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
             <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">#{id?.slice(0,8)}</span>
             <span>•</span>
             {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
             {getStatusBadge(request.status)}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left: Details */}
        <div className="space-y-6 md:col-span-1">
           <Card className="shadow-md rounded-xl border-slate-100 overflow-hidden">
             <CardHeader className="pb-4 border-b bg-slate-50/50">
                <CardTitle className="text-base font-bold text-slate-800">Request Details</CardTitle>
             </CardHeader>
             <CardContent className="pt-6 space-y-5">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
                    <p className="text-sm text-slate-700 leading-relaxed">{request.description}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Priority</label>
                        <div className={`mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${
                            request.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                            request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {request.priority}
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Location</label>
                        <p className="text-sm mt-1">{request.properties?.name}</p>
                        {request.units?.unit_number && <p className="text-xs text-gray-500">Unit {request.units.unit_number}</p>}
                     </div>
                 </div>

                 {request.scheduled_date && (
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1">
                            <Calendar size={12} /> Scheduled Date
                        </label>
                        <p className="text-sm font-semibold text-blue-900 mt-1">
                            {new Date(request.scheduled_date).toLocaleString()}
                        </p>
                     </div>
                 )}
                 
                 {/* Images (Placeholder if array exists) */}
                 {request.images && request.images.length > 0 && (
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Attachments</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {request.images.map((img: string, i: number) => (
                                <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg bg-gray-100 border overflow-hidden flex-shrink-0">
                                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                </a>
                            ))}
                        </div>
                     </div>
                 )}
             </CardContent>
           </Card>
        </div>

        {/* Right: Chat */}
        <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-700">Communication History</h3>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                     {messages.length === 0 && (
                         <div className="text-center py-10 text-gray-400">
                             <p className="text-sm">No messages yet. Start the conversation.</p>
                         </div>
                     )}
                     
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
                                         <p className="font-bold text-[10px] mb-1 opacity-50 uppercase tracking-widest border-b border-gray-100 pb-1">
                                            {msg.sender?.first_name || 'Manager'}
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

                <div className="p-4 bg-white border-t">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message to property management..."
                            className="bg-gray-50"
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-[#00356B]">
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MaintenanceDetailPage;