import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { proprietorService } from "@/services/proprietorService";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ProprietorMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadMessages();
  }, [user?.id]);

  const loadMessages = async () => {
    try {
      if (!user?.id) return;
      const prop = await proprietorService.getProprietorByUserId(user.id);
      if (prop?.id) {
        const data = await proprietorService.getProprietorMessages(prop.id);
        setMessages(data || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await proprietorService.markMessageAsRead(id);
      setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, is_read: true } : message)));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const messageStats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter((m) => !m.is_read).length;
    const read = total - unread;
    return { total, unread, read };
  }, [messages]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Communication Center</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">Messages</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Track updates and replies from property managers and administrators.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => void loadMessages()}
              className="inline-flex h-10 items-center gap-2 rounded-none border border-[#2f3d51] bg-[#2f3d51] px-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#243041]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2aa8bf] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Total</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{messageStats.total}</p>
            </div>
            <div className="bg-[#1f93a8] px-3 py-1.5 text-[14px] font-medium text-white">Messages</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#dc3545] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Unread</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{messageStats.unread}</p>
            </div>
            <div className="bg-[#c12c3a] px-3 py-1.5 text-[14px] font-medium text-white">Needs review</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2daf4a] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Read</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{messageStats.read}</p>
            </div>
            <div className="bg-[#24933d] px-3 py-1.5 text-[14px] font-medium text-white">Completed</div>
          </div>
        </div>

        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
          <div className="mb-3 border-b border-[#c8cfd8] pb-2">
            <h2 className="text-[32px] font-bold leading-none text-[#263143]">Inbox</h2>
          </div>

          {messages.length === 0 ? (
            <div className="border border-dashed border-[#b8c0cb] bg-white px-4 py-12 text-center">
              <Mail className="mx-auto mb-3 h-7 w-7 text-[#9aa4b1]" />
              <p className="text-[14px] font-semibold text-[#334155]">Inbox Empty</p>
              <p className="mt-1 text-[12px] text-[#5f6b7c]">You have no messages right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => {
                const isRead = Boolean(message.is_read);
                const messageType = String(message.message_type || "general").replace(/_/g, " ");

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "border px-4 py-3",
                      isRead ? "border-[#c7ced7] bg-white" : "border-[#2f3d51] bg-[#edf2f8]",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={cn(
                              "rounded-none border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                              isRead ? "border-[#9aa4b1] bg-[#9aa4b1] text-white" : "border-[#2f3d51] bg-[#2f3d51] text-white",
                            )}
                          >
                            {messageType}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5f6b7c]">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>

                        <h3 className="text-[15px] font-semibold text-[#1f2937]">{message.subject || "No subject"}</h3>
                        <p className="whitespace-pre-wrap text-[13px] text-[#334155]">{message.message}</p>

                        {message.sender && (
                          <p className="pt-1 text-[11px] font-medium text-[#5f6b7c]">
                            From: {message.sender.first_name} {message.sender.last_name} • Property Manager
                          </p>
                        )}
                      </div>

                      {!isRead && (
                        <Button
                          size="sm"
                          onClick={() => void markAsRead(message.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-none border border-[#2daf4a] bg-[#2daf4a] px-2 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-[#24933d]"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProprietorMessages;
