import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: any;
  recipient?: any;
}

const ManagerMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({ to: '', subject: '', content: '' });

  useEffect(() => {
    loadMessages();
  }, [user?.id]);

  const loadMessages = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Fetch messages where user is sender
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(first_name, last_name, email), recipient:profiles!recipient_id(first_name, last_name, email)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Fetch messages where user is recipient
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(first_name, last_name, email), recipient:profiles!recipient_id(first_name, last_name, email)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Merge and sort by created_at
      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setMessages(allMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      setSendingReply(true);
      const recipientId = selectedMessage.sender_id === user?.id 
        ? selectedMessage.recipient_id 
        : selectedMessage.sender_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientId,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
          is_read: false
        });

      if (error) throw error;
      toast.success('Reply sent successfully');
      setReplyContent('');
      loadMessages();
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSendingReply(true);
      // Find recipient by email
      const { data: recipients, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newMessage.to)
        .single();

      if (searchError || !recipients) {
        toast.error('Recipient not found');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipients.id,
          subject: newMessage.subject,
          content: newMessage.content,
          is_read: false
        });

      if (error) throw error;
      toast.success('Message sent successfully');
      setNewMessage({ to: '', subject: '', content: '' });
      setShowCompose(false);
      loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      loadMessages();
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.sender?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.recipient?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Messages</h1>
          </div>
          <p className="text-slate-600">Communicate with tenants, staff, and other managers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    prefix={<Search size={16} className="text-slate-400" />}
                  />
                </div>
                <Button onClick={() => setShowCompose(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Send size={16} className="mr-2" />
                  New Message
                </Button>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  filteredMessages.map(msg => {
                    const otherParty = msg.sender_id === user?.id ? msg.recipient : msg.sender;
                    return (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          markAsRead(msg.id);
                        }}
                        className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          selectedMessage?.id === msg.id ? 'bg-blue-50' : ''
                        } ${!msg.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {otherParty?.first_name} {otherParty?.last_name}
                          </p>
                          {!msg.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate">{msg.subject}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {showCompose ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">New Message</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">To (Email)</label>
                    <Input
                      placeholder="recipient@example.com"
                      value={newMessage.to}
                      onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <Input
                      placeholder="Message subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      rows={8}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSendNewMessage} disabled={sendingReply} className="bg-blue-600 hover:bg-blue-700">
                      {sendingReply ? 'Sending...' : 'Send Message'}
                    </Button>
                    <Button onClick={() => setShowCompose(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedMessage ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedMessage.subject}</h2>
                      <p className="text-slate-600 mt-1">
                        {selectedMessage.sender_id === user?.id ? 'To: ' : 'From: '}
                        {selectedMessage.sender_id === user?.id 
                          ? `${selectedMessage.recipient?.first_name} ${selectedMessage.recipient?.last_name}`
                          : `${selectedMessage.sender?.first_name} ${selectedMessage.sender?.last_name}`}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {/* Reply Box */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reply</label>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSendReply} disabled={sendingReply} className="bg-blue-600 hover:bg-blue-700">
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
                <p className="text-slate-600 text-lg">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerMessages;
