
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { caretakerService } from '@/services/caretakerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

const CaretakerMessages = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [manager, setManager] = useState<any>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user) {
            fetchManagerAndMessages();
        }
    }, [user]);

    const fetchManagerAndMessages = async () => {
        try {
            setLoading(true);
            // Get caretaker details
            const caretakerData = (await caretakerService.getCaretakerByUserId(user!.id)) as any;
            
            let managerId: string | null = null;
            let currentManager: any = null;

            // STRATEGY 1: Check Property Assignment (Preferred "via property" method)
            if (caretakerData?.property_id) {
                 const { data: assignmentData, error: assignmentError } = await supabase
                    .from('property_manager_assignments')
                    .select('property_manager:profiles(id, first_name, last_name, email, avatar_url)')
                    .eq('property_id', caretakerData.property_id)
                    .eq('status', 'active')
                    .maybeSingle();
                 
                 if (!assignmentError && assignmentData?.property_manager) {
                     // The query structure returns { property_manager: { ... } }
                     // We need to use 'as any' casting to handle potential type mismatches from Supabase joint query
                     const pm = assignmentData.property_manager as any;
                     managerId = pm.id;
                     currentManager = pm;
                 }
            }

            // STRATEGY 2: Fallback to direct assignment in caretaker profile
            if (!managerId && caretakerData?.property_manager) {
                // Determine if property_manager is an array (from joint result) or single object
                const pm = Array.isArray(caretakerData.property_manager) 
                    ? caretakerData.property_manager[0] 
                    : caretakerData.property_manager;
                
                if (pm) {
                    managerId = pm.id;
                    currentManager = pm;
                }
            }

            if (managerId && currentManager) {
                setManager(currentManager);
                await fetchMessages(managerId);
            } else {
                toast.error("No property manager found for your assigned property.");
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (managerId: string) => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(first_name, last_name, email, avatar_url)
            `)
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${managerId}),and(sender_id.eq.${managerId},recipient_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return;
        }

        setMessages(data || []);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !manager?.id || !user?.id) return;

        try {
            setSending(true);
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    recipient_id: manager.id,
                    content: newMessage.trim(),
                    is_read: false
                });

            if (error) throw error;

            setNewMessage('');
            await fetchMessages(manager.id); // Refresh messages
            toast.success("Message sent");
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#154279]" /></div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-100px)]">
            <Card className="h-full flex flex-col border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 py-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarImage src={manager?.avatar_url} />
                            <AvatarFallback className="bg-slate-100 text-slate-500">
                                <User className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg font-bold text-[#154279]">
                                {manager ? `${manager.first_name} ${manager.last_name}` : 'Property Manager'}
                            </CardTitle>
                            <CardDescription>
                                {manager?.email}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No messages yet. Start a conversation with your manager.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div 
                                            key={msg.id} 
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div 
                                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                                    isMe 
                                                        ? 'bg-[#154279] text-white rounded-br-none' 
                                                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="flex gap-2">
                            <Textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="resize-none bg-white border-slate-300 focus:border-[#154279] min-h-[50px] max-h-[120px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <Button 
                                onClick={handleSendMessage} 
                                disabled={sending || !newMessage.trim()}
                                className="bg-[#F96302] hover:bg-[#d85502] text-white h-auto px-4"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CaretakerMessages;
