"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  UserCheck,
  RotateCcw,
  Search,
  Phone,
  Sparkles,
  Loader2,
  Mic,
} from "lucide-react";
import { chatService } from "@/services/chat.service";
import { getSocket } from "@/lib/socket";
import { Conversation, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "AI_ACTIVE" | "HUMAN_TAKEOVER">("ALL");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        if (!activeConvId && res.data.length > 0) {
          setActiveConvId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setIsLoadingList(false);
    }
  }, [activeConvId]);

  const fetchMessages = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await chatService.getMessages(convId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);

      const socket = getSocket();
      socket.emit("join:conversation", activeConvId);

      const handleNewMessage = (msg: Message) => {
        if (msg.conversationId === activeConvId) {
          setMessages((prev) => [...prev, msg]);
        }
        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversationId ? { ...c, lastMessageAt: msg.createdAt } : c
          )
        );
      };

      const handleStatusChange = (data: {
        conversationId: string;
        status: "AI_ACTIVE" | "HUMAN_TAKEOVER" | "CLOSED";
      }) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversationId ? { ...c, status: data.status } : c
          )
        );
      };

      socket.on("message:new", handleNewMessage);
      socket.on("conversation:status", handleStatusChange);

      return () => {
        socket.emit("leave:conversation", activeConvId);
        socket.off("message:new", handleNewMessage);
        socket.off("conversation:status", handleStatusChange);
      };
    }
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleTakeover = async () => {
    if (!activeConvId) return;
    setIsTakingOver(true);
    try {
      const res = await chatService.takeover(activeConvId);
      if (res.success) {
        toast.success("AI Muted! You have taken over this conversation.");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, status: "HUMAN_TAKEOVER" } : c
          )
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Takeover failed");
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleResumeAi = async () => {
    if (!activeConvId) return;
    setIsResuming(true);
    try {
      const res = await chatService.resumeAi(activeConvId);
      if (res.success) {
        toast.success("AI Bot resumed! automated answers re-enabled.");
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, status: "AI_ACTIVE" } : c))
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Resume AI failed");
    } finally {
      setIsResuming(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !replyText.trim() || isSending) return;

    const text = replyText.trim();
    setReplyText("");
    setIsSending(true);

    try {
      const res = await chatService.sendReply(activeConvId, text);
      if (res.success && res.data?.data) {
        setMessages((prev) => [...prev, res.data.data]);
        // Also update local status to HUMAN_TAKEOVER
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, status: "HUMAN_TAKEOVER" } : c
          )
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setReplyText(text); // restore text on failure
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.customer?.name?.toLowerCase().includes(q) ||
      c.customer?.phone?.includes(q) ||
      c.id.toLowerCase().includes(q);

    const matchesFilter = filter === "ALL" || c.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Left Column: Conversations List */}
      <div className="w-80 md:w-96 flex flex-col border-r border-border bg-card/50 shrink-0">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2">
              <MessageSquare className="size-4 text-amber-500" />
              Live Conversations
            </h3>
            <Badge variant="outline" className="text-[10px] font-bold">
              {filteredConversations.length}
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customer or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl bg-muted/40"
            />
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setFilter("ALL")}
              className={`py-1 rounded-lg transition-all ${
                filter === "ALL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("AI_ACTIVE")}
              className={`py-1 rounded-lg transition-all ${
                filter === "AI_ACTIVE"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              AI Active
            </button>
            <button
              onClick={() => setFilter("HUMAN_TAKEOVER")}
              className={`py-1 rounded-lg transition-all ${
                filter === "HUMAN_TAKEOVER"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Takeover
            </button>
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {isLoadingList ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground p-4">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              const isAi = conv.status === "AI_ACTIVE";

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all hover:bg-muted/50 ${
                    isSelected ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-xs font-bold text-foreground">
                        {conv.customer?.name?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground line-clamp-1">
                          {conv.customer?.name || "Customer"}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                          <Phone className="size-2.5" />
                          <span>{conv.customer?.phone || "No phone"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div>
                        <Badge
                          className={`text-[9px] font-bold px-1.5 py-0 border-0 ${
                            isAi
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isAi ? "AI Active" : "Takeover"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation Thread */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-card">
          {/* Active Conversation Top Bar */}
          <div className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card/80 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 font-extrabold text-sm">
                {activeConversation.customer?.name?.[0]?.toUpperCase() || "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-foreground">
                    {activeConversation.customer?.name || "Customer"}
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {activeConversation.channel}
                  </Badge>
                  <Badge
                    className={`text-[10px] font-bold border-0 ${
                      activeConversation.status === "AI_ACTIVE"
                        ? "bg-purple-500/15 text-purple-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {activeConversation.status === "AI_ACTIVE"
                      ? "AI Bot Handling"
                      : "Human Agent Takeover"}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {activeConversation.customer?.phone || "No phone recorded"} · Address:{" "}
                  {activeConversation.customer?.fullAddress || "Not specified"}
                </div>
              </div>
            </div>

            {/* Takeover / Resume Action Buttons */}
            <div className="flex items-center gap-2">
              {activeConversation.status === "AI_ACTIVE" ? (
                <Button
                  size="sm"
                  onClick={handleTakeover}
                  disabled={isTakingOver}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-8 px-3 shadow-xs"
                >
                  {isTakingOver ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <UserCheck className="size-3.5 mr-1.5" />
                  )}
                  Takeover Chat (Mute AI)
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeAi}
                  disabled={isResuming}
                  className="rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-500/10 font-bold text-xs h-8 px-3"
                >
                  {isResuming ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <RotateCcw className="size-3.5 mr-1.5" />
                  )}
                  Resume AI Bot
                </Button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/15">
            {isLoadingMessages ? (
              <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted-foreground">
                No message history yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.sender === "CUSTOMER";
                const isAi = msg.sender === "AI_BOT";
                const isAgent = msg.sender === "HUMAN_AGENT";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isCustomer ? "items-start" : "items-end"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                      {isCustomer && (
                        <>
                          <User className="size-3" />
                          <span>Customer</span>
                        </>
                      )}
                      {isAi && (
                        <>
                          <Sparkles className="size-3 text-purple-500" />
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            Royal Honey AI (Automated)
                          </span>
                        </>
                      )}
                      {isAgent && (
                        <>
                          <UserCheck className="size-3 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Human Agent
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                        isCustomer
                          ? "bg-card border border-border text-foreground"
                          : isAi
                            ? "bg-purple-500/10 border border-purple-500/25 text-purple-950 dark:text-purple-100"
                            : "bg-amber-500 text-white font-medium"
                      }`}
                    >
                      {/* Audio Player Widget if Voice Message */}
                      {(msg.messageType === "AUDIO" ||
                        (msg.mediaUrl &&
                          msg.mediaUrl.match(/\.(ogg|mp3|wav|m4a|aac|opus)/i))) && (
                        <div className="mb-2 p-2 rounded-xl bg-muted/60 border border-border/50">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 mb-1">
                            <Mic className="size-3 text-amber-500 animate-pulse" />
                            <span>কাস্টমার ভয়েস মেসেজ</span>
                          </div>
                          {msg.mediaUrl && (
                            <audio
                              controls
                              src={msg.mediaUrl}
                              className="w-full h-8 max-w-xs mt-1"
                            />
                          )}
                        </div>
                      )}

                      {/* Image Thumbnail Widget if Image Message (Phase 8: Multi-Modal Vision) */}
                      {(msg.messageType === "IMAGE" ||
                        (msg.mediaUrl &&
                          msg.mediaUrl.match(/\.(jpg|jpeg|png|webp|gif)/i))) &&
                        msg.mediaUrl && (
                          <div className="mb-2 overflow-hidden rounded-xl border border-border/80 max-w-xs bg-black/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.mediaUrl}
                              alt="Customer image"
                              className="max-h-52 w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() =>
                                msg.mediaUrl && window.open(msg.mediaUrl, "_blank")
                              }
                            />
                          </div>
                        )}

                      <div className="flex items-start gap-1.5">
                        {msg.messageType === "AUDIO" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold uppercase shrink-0">
                            ভয়েস টেক্সট
                          </span>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Agent Reply Box */}
          <form
            onSubmit={handleSendReply}
            className="p-4 border-t border-border bg-card/60 flex items-center gap-3 shrink-0"
          >
            <Input
              placeholder={
                activeConversation.status === "AI_ACTIVE"
                  ? "Type your response to take over from AI..."
                  : "Type your reply to customer..."
              }
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 rounded-xl bg-background border-border text-xs h-10"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={isSending || !replyText.trim()}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 px-5 shadow-xs"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <MessageSquare className="size-7" />
          </div>
          <h4 className="font-extrabold text-foreground text-sm">
            Select a Conversation
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Choose a customer conversation from the left to view messages and manage human
            takeover.
          </p>
        </div>
      )}
    </div>
  );
}
