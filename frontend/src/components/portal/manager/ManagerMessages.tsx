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

      // Use schema-safe message fetch, then hydrate profile details in a second query.
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Message[];

      const uniqueUserIds = Array.from(
        new Set(
          allMessages
            .flatMap((msg) => [msg.sender_id, msg.recipient_id])
            .filter(Boolean)
        )
      );

      let profileMap = new Map<string, any>();
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', uniqueUserIds);

        profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      }

      const hydratedMessages = allMessages.map((msg) => ({
        ...msg,
        sender: profileMap.get(msg.sender_id) || null,
        recipient: profileMap.get(msg.recipient_id) || null,
      }));

      setMessages(hydratedMessages);
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

  const getPartyName = (party?: any) => {
    if (!party) return 'Unknown User';
    const full = `${party.first_name || ''} ${party.last_name || ''}`.trim();
    return full || party.email || 'Unknown User';
  };

  const getPartyInitials = (party?: any) => {
    const name = getPartyName(party);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  };

  const unreadCount = filteredMessages.filter((msg) => !msg.is_read && msg.recipient_id === user?.id).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-slate-50 to-stone-100/70">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6 md:mb-8 rounded-2xl border border-slate-200/80 bg-white/95 p-5 md:p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Message Center</h1>
              </div>
              <p className="text-slate-600">Review conversations, reply quickly, and send new messages.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                {filteredMessages.length} Conversations
              </span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                {unreadCount} Unread
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Messages List */}
          <aside>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.45)] overflow-hidden h-full">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Conversation List</p>
                  <span className="text-xs font-medium text-slate-500">{filteredMessages.length} total</span>
                </div>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    prefix={<Search size={16} className="text-slate-400" />}
                    className="bg-white border-slate-300 focus-visible:ring-emerald-500"
                  />
                </div>
                <Button
                  onClick={() => {
                    setShowCompose(true);
                    setSelectedMessage(null);
                  }}
                  className="w-full h-11 bg-[#0f766e] hover:bg-[#0b5e59] text-white font-semibold"
                >
                  <Send size={16} className="mr-2" />
                  New Message
                </Button>
              </div>

              <div className="max-h-[650px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  filteredMessages.map(msg => {
                    const otherParty = msg.sender_id === user?.id ? msg.recipient : msg.sender;
                    const isSelected = selectedMessage?.id === msg.id;
                    const shouldShowUnread = !msg.is_read && msg.recipient_id === user?.id;
                    return (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          setShowCompose(false);
                          if (shouldShowUnread) {
                            void markAsRead(msg.id);
                          }
                        }}
                        className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-700 pl-3' : ''
                        } ${shouldShowUnread ? 'bg-emerald-50/40' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {getPartyInitials(otherParty)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-slate-900 truncate">
                                {getPartyName(otherParty)}
                              </p>
                              {shouldShowUnread && (
                                <div className="w-2 h-2 bg-emerald-700 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 truncate">{msg.subject}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(msg.created_at).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* Message Detail */}
          <section>
            {showCompose ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.45)] p-5 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Compose Message</h2>
                <p className="text-sm text-slate-600 mb-5">Enter recipient email, subject, and your message below.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">To (Email)</label>
                    <Input
                      placeholder="recipient@example.com"
                      value={newMessage.to}
                      onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <Input
                      placeholder="Message subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      rows={8}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 min-h-[220px] resize-y"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSendNewMessage} disabled={sendingReply} className="bg-[#0f766e] hover:bg-[#0b5e59] text-white font-semibold">
                      {sendingReply ? 'Sending...' : 'Send Message'}
                    </Button>
                    <Button onClick={() => setShowCompose(false)} variant="outline" className="border-slate-300">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedMessage ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.45)] overflow-hidden">
                <div className="px-5 md:px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900">{selectedMessage.subject}</h2>
                      <p className="text-slate-600 mt-1 text-sm md:text-base">
                        {selectedMessage.sender_id === user?.id ? 'To: ' : 'From: '}
                        {selectedMessage.sender_id === user?.id 
                          ? `${selectedMessage.recipient?.first_name} ${selectedMessage.recipient?.last_name}`
                          : `${selectedMessage.sender?.first_name} ${selectedMessage.sender?.last_name}`}
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 text-right">
                      {new Date(selectedMessage.created_at).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>

                <div className="px-5 md:px-6 py-6">
                  <div className="max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.content}</p>
                  </div>
                </div>

                {/* Reply Box */}
                <div className="px-5 md:px-6 pb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reply</label>
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 min-h-[140px] resize-y"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSendReply} disabled={sendingReply} className="bg-[#0f766e] hover:bg-[#0b5e59] text-white font-semibold">
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.45)] p-10 md:p-14 text-center">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <p className="text-slate-700 text-lg font-semibold mb-1">No conversation selected</p>
                <p className="text-slate-500 mb-5">Choose a message from the list or start a new conversation.</p>
                <Button
                  onClick={() => {
                    setShowCompose(true);
                    setSelectedMessage(null);
                  }}
                  className="bg-[#0f766e] hover:bg-[#0b5e59] text-white"
                >
                  <Send className="w-4 h-4 mr-2" /> Start New Message
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ManagerMessages;
