import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { proprietorService } from '../../../services/proprietorService';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from "../../../components/ui/badge";
import { Mail, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const ProprietorMessages = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMessages();
    }, [user?.id]);

    const loadMessages = async () => {
        try {
            if (!user?.id) return;
            const prop = await proprietorService.getProprietorByUserId(user.id);
            if (prop?.id) {
                const data = await proprietorService.getProprietorMessages(prop.id);
                setMessages(data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await proprietorService.markMessageAsRead(id);
            // Update local state
            setMessages(prev => prev.map(m => 
                m.id === id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m
            ));
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 w-full space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
                <p className="text-slate-500">Communications from property management</p>
            </div>

            <div className="space-y-4 max-w-4xl">
                {messages.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700">Inbox Empty</h3>
                        <p className="text-slate-500">You have no messages at this time.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <Card 
                            key={msg.id} 
                            className={`
                                overflow-hidden transition-all duration-300 border-l-4
                                ${!msg.is_read ? 'border-l-indigo-500 shadow-md bg-white' : 'border-l-slate-200 bg-slate-50/50 shadow-sm opacity-90'}
                            `}
                        >
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={msg.is_read ? "secondary" : "default"} className={msg.is_read ? "bg-slate-200 text-slate-600" : "bg-indigo-600"}>
                                            {msg.message_type || 'General'}
                                        </Badge>
                                        <span className="text-sm text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(msg.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {!msg.is_read && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => markAsRead(msg.id)}
                                            className="text-indigo-600 text-xs hover:bg-indigo-50"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Mark as Read
                                        </Button>
                                    )}
                                </div>
                                
                                <h3 className={`text-lg font-bold mb-2 ${!msg.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {msg.subject}
                                </h3>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {msg.message}
                                    </p>
                                </div>

                                {msg.sender && (
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {msg.sender.first_name?.[0]}{msg.sender.last_name?.[0]}
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-slate-900">{msg.sender.first_name} {msg.sender.last_name}</p>
                                            <p className="text-slate-500 text-xs">Property Manager</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProprietorMessages;