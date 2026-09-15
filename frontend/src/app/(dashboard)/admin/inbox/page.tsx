"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  Video,
  CheckCircle2,
  Clock,
  ShoppingBag,
  ShoppingCart,
  Globe,
  Zap,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  MapPin,
  Flame,
} from "lucide-react";
import { chatService } from "@/services/chat.service";
import { getSocket } from "@/lib/socket";
import { Conversation, Message, ConversationStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Brand channel icons
const MessengerIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.453 5.518 3.734 7.207v3.535l3.414-1.874c.907.251 1.867.387 2.852.387 5.523 0 10-4.145 10-9.255C22 6.145 17.523 2 12 2zm1.066 12.434l-2.673-2.853-5.215 2.853 5.733-6.089 2.742 2.853 5.146-2.853-5.733 6.089z" />
  </svg>
);

const WhatsAppIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 2c-5.502 0-9.972 4.47-9.972 9.974 0 1.76.459 3.479 1.33 4.995L2 22l5.176-1.358a9.92 9.92 0 004.855 1.259h.004c5.501 0 9.973-4.47 9.973-9.974 0-2.665-1.037-5.171-2.923-7.056A9.907 9.907 0 0012.031 2zm0 18.232h-.003a8.243 8.243 0 01-4.204-1.149l-.301-.179-3.127.82.834-3.048-.196-.312a8.216 8.216 0 01-1.261-4.39c0-4.563 3.713-8.276 8.279-8.276 2.211 0 4.29.862 5.854 2.427a8.214 8.214 0 012.424 5.852c0 4.564-3.714 8.278-8.279 8.278zm4.542-6.196c-.249-.125-1.472-.727-1.7-.809-.228-.083-.394-.125-.56.125-.166.249-.643.809-.788.975-.145.166-.29.187-.539.062-.249-.125-1.052-.388-2.003-1.236-.74-.66-1.24-1.476-1.385-1.725-.145-.249-.015-.384.11-.508.112-.112.249-.29.373-.435.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.435-.062-.125-.56-1.349-.768-1.847-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.436.062-.664.311-.228.249-.871.851-.871 2.075 0 1.224.892 2.407 1.016 2.573.125.166 1.756 2.682 4.254 3.76.595.257 1.06.41 1.422.525.597.19 1.14.163 1.569.099.479-.071 1.472-.602 1.68-1.183.208-.581.208-1.079.145-1.183-.062-.104-.228-.166-.477-.291z" />
  </svg>
);

const InstagramIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export type ChannelFilter =
  "ALL" | "FACEBOOK" | "WHATSAPP" | "INSTAGRAM" | "WEBSITE" | "TAKEOVER";
export type CategoryFilter =
  "ALL" | "UNREPLIED" | "ORDERED" | "INCOMPLETE_CART" | "AI_ACTIVE" | "TAKEOVER";

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

  // High-level Channel filter (Messenger, WhatsApp, Instagram, Website, Takeover)
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("ALL");
  // Category / Status Filter (All, Unreplied, Ordered, Incomplete Cart, AI, Takeover)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");

  // Global AI Auto-Reply Switch State
  const [isGlobalAiActive, setIsGlobalAiActive] = useState<boolean>(true);
  const [isTogglingAi, setIsTogglingAi] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch initial global AI status and listen for socket updates
  useEffect(() => {
    const fetchGlobalAi = async () => {
      try {
        const res = await chatService.getGlobalAiStatus();
        if (res.success && res.data) {
          setIsGlobalAiActive(res.data.isAiEnabled);
        }
      } catch (err) {
        console.warn("Failed to fetch global AI status:", err);
      }
    };
    fetchGlobalAi();

    const socket = getSocket();
    const handleGlobalAiStatus = (data: { isAiEnabled: boolean }) => {
      setIsGlobalAiActive(data.isAiEnabled);
    };
    socket.on("chat:global_ai_status", handleGlobalAiStatus);
    return () => {
      socket.off("chat:global_ai_status", handleGlobalAiStatus);
    };
  }, []);

  const handleToggleGlobalAi = async () => {
    setIsTogglingAi(true);
    try {
      const nextState = !isGlobalAiActive;
      const res = await chatService.toggleGlobalAi(nextState);
      if (res.success && res.data) {
        setIsGlobalAiActive(res.data.isAiEnabled);
        if (res.data.isAiEnabled) {
          toast.success(
            "AI অটো-রিপ্লাই সফলভাবে চালু করা হয়েছে! এখন এআই স্বয়ংক্রিয়ভাবে মেসেজের উত্তর দেবে।"
          );
        } else {
          toast.warning(
            "AI অটো-রিপ্লাই বন্ধ করা হয়েছে! এখন সব মেসেজে মানুষকে ম্যানুয়ালি রিপ্লাই দিতে হবে।"
          );
        }
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "AI স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে"
      );
    } finally {
      setIsTogglingAi(false);
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setConversations(res.data);
          if (!activeConvId && res.data.length > 0) {
            setActiveConvId(res.data[0].id);
          }
        } else if ((res.data as any).conversations) {
          const list = (res.data as any).conversations;
          setConversations(list);
          if (!activeConvId && list.length > 0) {
            setActiveConvId(list[0].id);
          }
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
        const msgList: Message[] = Array.isArray(res.data)
          ? res.data
          : (res.data as { messages?: Message[] }).messages || [];
        const unique = Array.from(new Map(msgList.map((m) => [m.id, m])).values());
        setMessages(unique);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
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
          setMessages((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            if (msg.id && list.some((m) => m.id === msg.id)) {
              return list;
            }
            return [...list, msg];
          });
        }
        // Update last message in conversation list and update unreplied state dynamically
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversationId
              ? {
                  ...c,
                  lastMessageAt: msg.createdAt,
                  lastMessage: {
                    sender: msg.sender,
                    content: msg.content,
                    createdAt: msg.createdAt,
                  },
                  isUnreplied: msg.sender === "CUSTOMER",
                }
              : c
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

  // Derived live stats for instant responsive badge counts
  const liveStats = useMemo(() => {
    return {
      total: conversations.length,
      unreplied: conversations.filter((c) => c.isUnreplied).length,
      ordered: conversations.filter(
        (c) => c.hasOrdered || (c.customer?.ordersCount && c.customer.ordersCount > 0)
      ).length,
      incompleteCart: conversations.filter(
        (c) =>
          (c.hasActiveCart ||
            (c.customer?.cartItemsCount && c.customer.cartItemsCount > 0)) &&
          !c.hasOrdered
      ).length,
      takeover: conversations.filter((c) => c.status === "HUMAN_TAKEOVER").length,
      aiActive: conversations.filter((c) => c.status === "AI_ACTIVE").length,
      messenger: conversations.filter((c) => c.channel === "FACEBOOK").length,
      whatsapp: conversations.filter((c) => c.channel === "WHATSAPP").length,
      instagram: 0,
      website: 0,
    };
  }, [conversations]);

  // Multi-tier filtering: Channel Filter -> Category Filter -> Search Query
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Channel Filter
      if (channelFilter === "FACEBOOK" && c.channel !== "FACEBOOK") return false;
      if (channelFilter === "WHATSAPP" && c.channel !== "WHATSAPP") return false;
      if (channelFilter === "TAKEOVER" && c.status !== "HUMAN_TAKEOVER") return false;
      if (channelFilter === "INSTAGRAM") return false;
      if (channelFilter === "WEBSITE") return false;

      // 2. Category Filter
      if (categoryFilter === "UNREPLIED" && !c.isUnreplied) return false;
      if (
        categoryFilter === "ORDERED" &&
        !(c.hasOrdered || (c.customer?.ordersCount && c.customer.ordersCount > 0))
      )
        return false;
      if (
        categoryFilter === "INCOMPLETE_CART" &&
        !(
          (c.hasActiveCart ||
            (c.customer?.cartItemsCount && c.customer.cartItemsCount > 0)) &&
          !c.hasOrdered
        )
      )
        return false;
      if (categoryFilter === "TAKEOVER" && c.status !== "HUMAN_TAKEOVER") return false;
      if (categoryFilter === "AI_ACTIVE" && c.status !== "AI_ACTIVE") return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.customer?.name?.toLowerCase().includes(q);
        const matchesPhone = c.customer?.phone?.includes(q);
        const matchesMsg = c.lastMessage?.content?.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesMsg && !matchesId) return false;
      }

      return true;
    });
  }, [conversations, channelFilter, categoryFilter, searchQuery]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleTakeover = async () => {
    if (!activeConvId) return;
    setIsTakingOver(true);
    try {
      const res = await chatService.takeover(activeConvId);
      if (res.success) {
        toast.success("AI Bot Muted! চ্যাটটি টেকওভার করা হয়েছে।");
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
        toast.success("AI Bot সক্রিয় করা হয়েছে!");
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
        const newMsg = res.data.data;
        setMessages((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          if (newMsg.id && list.some((m) => m.id === newMsg.id)) {
            return list;
          }
          return [...list, newMsg];
        });
        // Locally mark conversation as Takeover and responded (isUnreplied: false)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  status: "HUMAN_TAKEOVER",
                  isUnreplied: false,
                  lastMessage: {
                    sender: "HUMAN_AGENT",
                    content: text,
                    createdAt: new Date().toISOString(),
                  },
                }
              : c
          )
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "মেসেজ পাঠাতে সমস্যা হয়েছে");
      setReplyText(text);
    } finally {
      setIsSending(false);
    }
  };

  // Quick reply snippet buttons
  const applyQuickReply = (text: string) => {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3">
      {/* 🌟 Top Navigation Bar: Channel Tabs & Quick KPI Overview */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs shrink-0">
        {/* Horizontal Channel Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setChannelFilter("ALL")}
            style={
              channelFilter === "ALL"
                ? { backgroundColor: "#f59e0b", color: "#ffffff" }
                : undefined
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              channelFilter === "ALL"
                ? "bg-amber-500 text-white shadow-xs shadow-amber-500/25"
                : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
            }`}
          >
            <MessageSquare className="size-3.5" />
            <span>সব চ্যানেল</span>
            <span
              style={
                channelFilter === "ALL"
                  ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#ffffff" }
                  : undefined
              }
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                channelFilter === "ALL"
                  ? "bg-white/25 text-white"
                  : "bg-muted text-foreground"
              }`}
            >
              {liveStats.total}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("FACEBOOK")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              channelFilter === "FACEBOOK"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            <MessengerIcon className="size-3.5" />
            <span>Messenger</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                channelFilter === "FACEBOOK"
                  ? "bg-white/20 text-white"
                  : "bg-blue-500/10 text-blue-600"
              }`}
            >
              {liveStats.messenger}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("WHATSAPP")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              channelFilter === "WHATSAPP"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            <WhatsAppIcon className="size-3.5" />
            <span>WhatsApp</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                channelFilter === "WHATSAPP"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {liveStats.whatsapp}
            </span>
          </button>

          {/* Instagram Tab (Ready for future implementation) */}
          <button
            onClick={() => {
              setChannelFilter("INSTAGRAM");
              toast.info("Instagram ইন্টিগ্রেশন শীঘ্রই আসছে!");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all opacity-80 ${
              channelFilter === "INSTAGRAM"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-pink-500/10 hover:text-pink-600"
            }`}
          >
            <InstagramIcon className="size-3.5" />
            <span>Instagram</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 font-extrabold">
              শীঘ্রই
            </span>
          </button>

          {/* Website Chat Tab (Ready for future implementation) */}
          <button
            onClick={() => {
              setChannelFilter("WEBSITE");
              toast.info("Website লাইভ চ্যাট উইজেট শীঘ্রই আসছে!");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all opacity-80 ${
              channelFilter === "WEBSITE"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600"
            }`}
          >
            <Globe className="size-3.5" />
            <span>Website</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold">
              শীঘ্রই
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("TAKEOVER")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              channelFilter === "TAKEOVER"
                ? "bg-purple-600 text-white shadow-xs shadow-purple-500/25"
                : "text-muted-foreground hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
            }`}
          >
            <UserCheck className="size-3.5" />
            <span>Takeover</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                channelFilter === "TAKEOVER"
                  ? "bg-white/20 text-white"
                  : "bg-purple-500/15 text-purple-700 dark:text-purple-300"
              }`}
            >
              {liveStats.takeover}
            </span>
          </button>
        </div>

        {/* Quick KPI Status Ribbon & Global AI Auto-Reply Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 🤖 Global AI Auto-Reply Switch Button */}
          <button
            onClick={handleToggleGlobalAi}
            disabled={isTogglingAi}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
              isGlobalAiActive
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                : "bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 animate-pulse"
            }`}
            title={
              isGlobalAiActive
                ? "ক্লিক করলে AI Agent স্বয়ংক্রিয় রিপ্লাই দেওয়া বন্ধ করবে এবং সম্পূর্ণ ম্যানুয়াল মোড চালু হবে (সব মেসেজে মানুষকে রিপ্লাই দিতে হবে)"
                : "ক্লিক করলে AI Agent পুনরায় স্বয়ংক্রিয়ভাবে মেসেজের উত্তর দেওয়া শুরু করবে"
            }
          >
            <div className="flex items-center gap-1.5">
              {isTogglingAi ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : isGlobalAiActive ? (
                <>
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  <Bot className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>AI অটো-রিপ্লাই: চালু</span>
                </>
              ) : (
                <>
                  <span className="relative inline-flex rounded-full size-2 bg-rose-500"></span>
                  <UserCheck className="size-3.5 text-rose-600 dark:text-rose-400" />
                  <span>ম্যানুয়াল মোড (AI বন্ধ)</span>
                </>
              )}
            </div>

            {/* Mini Visual Toggle Switch Pill */}
            <div
              className={`w-6 h-3.5 rounded-full transition-colors flex items-center p-0.5 ${
                isGlobalAiActive
                  ? "bg-emerald-600 justify-end"
                  : "bg-neutral-400 dark:bg-neutral-600 justify-start"
              }`}
            >
              <div className="size-2.5 rounded-full bg-white shadow-xs"></div>
            </div>
          </button>

          {liveStats.unreplied > 0 ? (
            <div
              onClick={() => setCategoryFilter("UNREPLIED")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-extrabold cursor-pointer animate-pulse"
              title="জবাব বাকি মেসেজ ফিল্টার করুন"
            >
              <Clock className="size-3.5" />
              <span>জবাব বাকি: {liveStats.unreplied}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold">
              <CheckCircle2 className="size-3.5" />
              <span>সব মেসেজের উত্তর সম্পন্ন</span>
            </div>
          )}

          <div
            onClick={() => setCategoryFilter("ORDERED")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition-all"
            title="অর্ডারকৃত কাস্টমার"
          >
            <ShoppingBag className="size-3.5" />
            <span>অর্ডার: {liveStats.ordered}</span>
          </div>
        </div>
      </div>

      {/* Main Container: Left Conversation List + Center Chat Thread */}
      <div className="flex-1 flex rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* 📋 Left Column: Filter Tabs, Search & Conversations List */}
        <div className="w-80 md:w-96 flex flex-col border-r border-border bg-card/60 shrink-0">
          {/* Search Box */}
          <div className="p-3 border-b border-border/80 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="নাম, ফোন বা মেসেজ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl bg-muted/40 border-border/60"
              />
            </div>

            {/* Category Filter Pills with Live Counters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
              <button
                onClick={() => setCategoryFilter("ALL")}
                style={
                  categoryFilter === "ALL"
                    ? { backgroundColor: "#f59e0b", color: "#ffffff" }
                    : undefined
                }
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  categoryFilter === "ALL"
                    ? "bg-amber-500 text-white shadow-xs shadow-amber-500/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600"
                }`}
              >
                <span>সব</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    categoryFilter === "ALL"
                      ? "bg-white/20 text-white font-extrabold"
                      : "opacity-80"
                  }`}
                >
                  {liveStats.total}
                </span>
              </button>

              <button
                onClick={() => setCategoryFilter("UNREPLIED")}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  categoryFilter === "UNREPLIED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : liveStats.unreplied > 0
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>জবাব বাকি</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    categoryFilter === "UNREPLIED"
                      ? "bg-white/20 text-white font-extrabold"
                      : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {liveStats.unreplied}
                </span>
              </button>

              <button
                onClick={() => setCategoryFilter("ORDERED")}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  categoryFilter === "ORDERED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>অর্ডার</span>
                <span className="text-[10px] opacity-80">{liveStats.ordered}</span>
              </button>

              <button
                onClick={() => setCategoryFilter("INCOMPLETE_CART")}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  categoryFilter === "INCOMPLETE_CART"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>অসম্পূর্ণ</span>
                <span className="text-[10px] opacity-80">{liveStats.incompleteCart}</span>
              </button>

              <button
                onClick={() => setCategoryFilter("TAKEOVER")}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                  categoryFilter === "TAKEOVER"
                    ? "bg-purple-600 text-white shadow-xs shadow-purple-500/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-purple-500/10 hover:text-purple-600"
                }`}
              >
                <span>টেকওভার</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    categoryFilter === "TAKEOVER"
                      ? "bg-white/20 text-white font-extrabold"
                      : "opacity-80"
                  }`}
                >
                  {liveStats.takeover}
                </span>
              </button>
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {isLoadingList ? (
              <div className="py-16 text-center text-xs text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                <Loader2 className="size-5 animate-spin text-amber-500" />
                <span>চ্যাট লোড হচ্ছে...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground p-6 space-y-1">
                <p className="font-bold text-foreground text-sm">
                  কোনো চ্যাট পাওয়া যায়নি
                </p>
                <p className="text-[11px]">
                  নির্বাচিত ফিল্টার বা সার্চ অনুযায়ী কোনো কথোপকথন নেই।
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                const isAi = conv.status === "AI_ACTIVE";
                const isUnreplied = !!conv.isUnreplied;
                const hasOrders = !!(
                  conv.hasOrdered ||
                  (conv.customer?.ordersCount && conv.customer.ordersCount > 0)
                );
                const hasCart = !!(
                  conv.hasActiveCart ||
                  (conv.customer?.cartItemsCount && conv.customer.cartItemsCount > 0)
                );

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3 cursor-pointer transition-all hover:bg-muted/40 relative ${
                      isSelected
                        ? "bg-amber-500/10 border-l-4 border-amber-500 shadow-xs"
                        : isUnreplied
                          ? "bg-rose-500/5"
                          : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={`flex size-9 items-center justify-center rounded-xl text-xs font-extrabold ${
                              isUnreplied
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                : isSelected
                                  ? "bg-amber-500 text-white"
                                  : "bg-muted text-foreground"
                            }`}
                          >
                            {conv.customer?.name?.[0]?.toUpperCase() || "C"}
                          </div>
                          {/* Channel Badge Overlay */}
                          <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full size-4 bg-background border border-border shadow-xs">
                            {conv.channel === "WHATSAPP" ? (
                              <WhatsAppIcon className="size-2.5 text-emerald-600" />
                            ) : (
                              <MessengerIcon className="size-2.5 text-blue-600" />
                            )}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-foreground truncate flex items-center gap-1.5">
                            <span>{conv.customer?.name || "সম্মানিত কাস্টমার"}</span>
                            {conv.customer?.linkedChannels &&
                              conv.customer.linkedChannels.length > 1 && (
                                <span className="text-[8px] font-extrabold px-1 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  FB+WA
                                </span>
                              )}
                          </div>

                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="size-2.5" />
                            <span>{conv.customer?.phone || "নম্বর নেই"}</span>
                          </div>

                          {/* Last message preview */}
                          <p className="text-[11px] text-muted-foreground truncate mt-1 max-w-[180px]">
                            {conv.lastMessage?.content || "কোনো মেসেজ নেই"}
                          </p>
                        </div>
                      </div>

                      {/* Right Tags & Timestamp */}
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        <div className="flex flex-col items-end gap-1">
                          {isUnreplied && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white shadow-xs animate-pulse">
                              জবাব বাকি
                            </span>
                          )}

                          {hasOrders && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              🛍️ অর্ডারকৃত
                            </span>
                          )}

                          {!hasOrders && hasCart && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              🛒 কার্ট
                            </span>
                          )}

                          <Badge
                            className={`text-[9px] font-bold px-1.5 py-0 border-0 ${
                              isAi
                                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {isAi ? "AI চালু" : "টেকওভার"}
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

        {/* 💬 Right Column: Active Conversation Thread */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-card">
            {/* Active Conversation Top Bar */}
            <div className="h-16 border-b border-border px-5 flex items-center justify-between shrink-0 bg-card/90 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 font-extrabold text-sm">
                  {activeConversation.customer?.name?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-foreground">
                      {activeConversation.customer?.name || "সম্মানিত কাস্টমার"}
                    </h4>

                    {activeConversation.channel === "WHATSAPP" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <WhatsAppIcon className="size-3" />
                        <span>WhatsApp</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                        <MessengerIcon className="size-3" />
                        <span>Messenger</span>
                      </span>
                    )}

                    {activeConversation.customer?.linkedChannels &&
                      activeConversation.customer.linkedChannels.length > 1 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1"
                        >
                          <Sparkles className="size-2.5 text-blue-500" />
                          <span>Unified (FB + WA)</span>
                        </Badge>
                      )}

                    <Badge
                      className={`text-[10px] font-bold border-0 ${
                        !isGlobalAiActive
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                          : activeConversation.status === "AI_ACTIVE"
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {!isGlobalAiActive
                        ? "⏸️ গ্লোবাল AI বন্ধ (ম্যানুয়াল মোড)"
                        : activeConversation.status === "AI_ACTIVE"
                          ? "🤖 AI Bot স্বয়ংক্রিয় উত্তর দিচ্ছে"
                          : "👤 হিউম্যান এজেন্ট টেকওভার"}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                    {activeConversation.customer?.phone && (
                      <a
                        href={`tel:${activeConversation.customer.phone}`}
                        className="font-mono text-foreground font-bold hover:underline flex items-center gap-1"
                      >
                        <PhoneCall className="size-2.5 text-emerald-600" />
                        <span>{activeConversation.customer.phone}</span>
                      </a>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-2.5 text-muted-foreground" />
                      <span>
                        {activeConversation.customer?.district || ""}{" "}
                        {activeConversation.customer?.fullAddress
                          ? `(${activeConversation.customer.fullAddress})`
                          : "ঠিকানা দেওয়া হয়নি"}
                      </span>
                    </span>
                    {activeConversation.customer?.cartTotal ? (
                      <>
                        <span>·</span>
                        <span className="font-bold text-amber-600">
                          কার্ট: ৳{activeConversation.customer.cartTotal}
                        </span>
                      </>
                    ) : null}
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
                    টেকওভার নিন (Bot থামান)
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
                    Bot চালু করুন (Resume AI)
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-muted/10">
              {isLoadingMessages ? (
                <div className="py-20 text-center text-xs text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                  <Loader2 className="size-5 animate-spin text-amber-500" />
                  <span>মেসেজ হিস্ট্রি লোড হচ্ছে...</span>
                </div>
              ) : !Array.isArray(messages) || messages.length === 0 ? (
                <div className="py-20 text-center text-xs text-muted-foreground">
                  এই চ্যাটে এখনো কোনো পূর্ববর্তী বার্তা নেই।
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.sender === "CUSTOMER";
                  const isAi = msg.sender === "AI_BOT";
                  const isAgent = msg.sender === "HUMAN_AGENT";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        {isCustomer && (
                          <>
                            <User className="size-3" />
                            <span className="font-bold">কাস্টমার</span>
                          </>
                        )}
                        {isAi && (
                          <>
                            <Sparkles className="size-3 text-purple-500" />
                            <span className="text-purple-600 dark:text-purple-400 font-bold">
                              Royal Honey AI Bot (Automated)
                            </span>
                          </>
                        )}
                        {isAgent && (
                          <>
                            <UserCheck className="size-3 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              হিউম্যান এজেন্ট
                            </span>
                          </>
                        )}
                        {msg.channel &&
                          activeConversation.customer?.linkedChannels &&
                          activeConversation.customer.linkedChannels.length > 1 && (
                            <>
                              <span>·</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-muted font-bold uppercase text-muted-foreground border border-border/40">
                                {msg.channel === "WHATSAPP" ? "WA" : "FB"}
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
                        {/* Audio Player Widget */}
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

                        {/* Image Thumbnail Widget */}
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

                        {/* Video Player Widget */}
                        {(msg.messageType === "VIDEO" ||
                          (msg.mediaUrl &&
                            msg.mediaUrl.match(/\.(mp4|webm|mov|mkv|avi|3gp)/i))) &&
                          msg.mediaUrl && (
                            <div className="mb-2 overflow-hidden rounded-xl border border-border/80 max-w-sm bg-black shadow-sm">
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400 p-2 bg-black/60 border-b border-white/10">
                                <Video className="size-3 text-amber-400" />
                                <span>কাস্টমার ভিডিও মেসেজ</span>
                              </div>
                              <video
                                controls
                                src={msg.mediaUrl}
                                className="max-h-64 w-full rounded-b-xl"
                                preload="metadata"
                              />
                            </div>
                          )}

                        <div className="flex items-start gap-1.5">
                          {msg.messageType === "AUDIO" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold uppercase shrink-0">
                              ভয়েস টেক্সট
                            </span>
                          )}
                          {msg.messageType === "VIDEO" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400 font-bold uppercase shrink-0">
                              ভিডিও টেক্সট
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

            {/* ⚡ Quick Action Templates Bar */}
            <div className="px-4 py-2 border-t border-border/70 bg-card/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                <Zap className="size-3 text-amber-500" />
                <span>কুইক উত্তর:</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  applyQuickReply(
                    "আসসালামু আলাইকুম স্যার! রয়্যাল হানি বিডি-তে আপনাকে স্বাগতম। কীভাবে সহযোগিতা করতে পারি? 😊🍯"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 hover:text-amber-600 text-[11px] font-medium transition-all shrink-0"
              >
                👋 সালাম ও কুশল
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickReply(
                    "স্যার, পার্সেলটি পাঠিয়ে দেওয়ার জন্য অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা দিন।"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 hover:text-amber-600 text-[11px] font-medium transition-all shrink-0"
              >
                📋 ঠিকানা ও অর্ডার
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickReply(
                    "আমাদের বিকাশ / নগদ (Personal) নম্বর: 01604121107। টাকা পাঠিয়ে অনুগ্রহ করে TrxID অথবা স্ক্রিনশট দিন স্যার।"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 hover:text-amber-600 text-[11px] font-medium transition-all shrink-0"
              >
                💳 বিকাশ/নগদ পেমেন্ট
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickReply(
                    "ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (১-২ কার্যদিবস) এবং ঢাকার বাইরে ১২০ টাকা (২-৩ কার্যদিবস)। ক্যাশ অন ডেলিভারিতে পণ্য দেখে টাকা পরিশোধ করতে পারবেন।"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 hover:text-amber-600 text-[11px] font-medium transition-all shrink-0"
              >
                🚚 ডেলিভারি চার্জ ও সময়
              </button>
              <button
                type="button"
                onClick={() =>
                  applyQuickReply(
                    "অত্যন্ত দুঃখিত স্যার! পার্সেল বা মধুর বয়াম ক্ষতিগ্রস্ত হওয়ায় আমরা আন্তরিকভাবে ক্ষমাপ্রার্থী। Royal Honey BD-এর নিয়ম অনুযায়ী আমরা সম্পূর্ণ ফ্রিতে নতুন পার্সেল রিপ্লেস করে দিই। অনুগ্রহ করে ভাঙা বয়ামের ছবি দিন এবং হেল্পলাইনে (01604121107) যোগাযোগ করুন।"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 text-[11px] font-medium transition-all shrink-0"
              >
                💔 ক্ষতিগ্রস্ত বয়াম ক্ষমা
              </button>
            </div>

            {/* Agent Reply Input Box */}
            <form
              onSubmit={handleSendReply}
              className="p-3.5 border-t border-border bg-card/80 flex items-center gap-2.5 shrink-0"
            >
              <Input
                placeholder={
                  activeConversation.status === "AI_ACTIVE"
                    ? "মেসেজ লিখুন (পাঠালে স্বয়ংক্রিয়ভাবে এআই মিউট হয়ে আপনি টেকওভার করবেন)..."
                    : "কাস্টমারকে উত্তর লিখুন..."
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 rounded-xl bg-background border-border text-xs h-10"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 px-5 shadow-xs shrink-0"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4 mr-1.5" />
                    <span>পাঠান</span>
                  </>
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
              একটি কথোপকথন নির্বাচন করুন
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              বামের তালিকা থেকে যেকোনো কাস্টমারের চ্যাট নির্বাচন করে বার্তা দেখুন, রিপ্লাই
              দিন অথবা হিউম্যান টেকওভার পরিচালনা করুন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
