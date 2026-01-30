import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  user_id: string;
  sender_id: string;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
  }, [user?.id]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not fetch messages:", error);
        // Use mock data
        setMessages([
          {
            id: "1",
            user_id: user.id,
            sender_id: "system",
            title: "Welcome to Tenant Portal",
            content: "Welcome! You can now manage your rent payments, maintenance requests, and more from this portal.",
            read: true,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            user_id: user.id,
            sender_id: "system",
            title: "Maintenance Reminder",
            content: "Your maintenance request #123 has been assigned. Check the maintenance section for updates.",
            read: false,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", messageId);

      if (!error) {
        setMessages(messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)));
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
      toast.error("Failed to mark message as read");
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (!error) {
        setMessages(messages.filter((m) => m.id !== messageId));
        toast.success("Message deleted");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Failed to delete message");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00356B]" />
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            <p className="text-blue-100 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "Communicate with property management"}
            </p>
          </div>
        </div>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all ${!message.read ? "border-blue-300 bg-blue-50" : ""}`}
              onClick={() => {
                if (!message.read) {
                  markAsRead(message.id);
                }
                setExpandedId(expandedId === message.id ? null : message.id);
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {!message.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <h3 className={`font-semibold ${!message.read ? "text-blue-900" : "text-gray-900"}`}>
                        {message.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{message.content.substring(0, 100)}...</p>
                    <p className="text-xs text-gray-400">{formatDate(message.created_at)}</p>

                    {expandedId === message.id && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-700 mb-4">{message.content}</p>
                        <div className="flex gap-2">
                          {!message.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(message.id);
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle size={16} />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
