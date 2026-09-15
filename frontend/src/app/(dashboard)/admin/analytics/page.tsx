"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Bot,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Send,
  Users,
  Server,
  Layers,
  ArrowRight,
  HelpCircle,
  Package,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import {
  AnalyticsOverview,
  DlqMetrics,
  AbandonedCartOverview,
  AbandonedCart,
  DlqJob,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"bi" | "growth" | "scaling">("bi");
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dlqMetrics, setDlqMetrics] = useState<DlqMetrics | null>(null);
  const [abandonedData, setAbandonedData] = useState<AbandonedCartOverview | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // DLQ inspection modal
  const [selectedJob, setSelectedJob] = useState<DlqJob | null>(null);

  // Hovered timeseries point for tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    revenue: number;
    orderCount: number;
  } | null>(null);

  const fetchOverview = useCallback(async (tf: "7d" | "30d" | "90d" | "1y") => {
    try {
      const res = await analyticsService.getOverview(tf);
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error("Failed to load analytics overview", err);
      toast.error("বিজনেস ইন্টেলিজেন্স ডাটা লোড করতে ব্যর্থ হয়েছে");
    }
  }, []);

  const fetchDlq = useCallback(async () => {
    try {
      const res = await analyticsService.getDlqMetrics();
      if (res.success && res.data) {
        setDlqMetrics(res.data);
      }
    } catch (err) {
      console.error("Failed to load DLQ metrics", err);
    }
  }, []);

  const fetchAbandoned = useCallback(async () => {
    try {
      const res = await analyticsService.getAbandonedCarts();
      if (res.success && res.data) {
        setAbandonedData(res.data);
      }
    } catch (err) {
      console.error("Failed to load abandoned carts", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOverview(timeframe), fetchDlq(), fetchAbandoned()]);
    setIsRefreshing(false);
    setIsLoading(false);
  }, [fetchOverview, fetchDlq, fetchAbandoned, timeframe]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleTimeframeChange = (newTf: "7d" | "30d" | "90d" | "1y") => {
    setTimeframe(newTf);
    fetchOverview(newTf);
  };

  // DLQ Actions
  const handleRetryJob = async (jobId: string) => {
    setIsActionLoading(true);
    try {
      const res = await analyticsService.retryDlqJob(jobId);
      if (res.success) {
        toast.success(`জব #${jobId} পুনরায় কিউতে যুক্ত করা হয়েছে`);
        setSelectedJob(null);
        fetchDlq();
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "জব পুনরায় চেষ্টা করতে ব্যর্থ হয়েছে"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetryAll = async () => {
    setIsActionLoading(true);
    try {
      const res = await analyticsService.retryAllDlq();
      if (res.success) {
        toast.success(
          `${res.data?.retriedCount || 0}টি ব্যর্থ জব পুনরায় কিউতে পাঠানো হয়েছে`
        );
        fetchDlq();
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "সব জব পুনরায় চেষ্টা করতে ব্যর্থ হয়েছে"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCleanDlq = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি DLQ-এর সকল ব্যর্থ জব মুছে ফেলতে চান?")) return;
    setIsActionLoading(true);
    try {
      const res = await analyticsService.cleanDlq();
      if (res.success) {
        toast.success("DLQ সফলভাবে পরিষ্কার করা হয়েছে");
        fetchDlq();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "DLQ পরিষ্কার করতে ব্যর্থ হয়েছে");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Abandoned Cart Actions
  const handleFollowup = async (cartId?: string) => {
    setIsActionLoading(true);
    try {
      const res = await analyticsService.triggerFollowup(cartId);
      if (res.success) {
        toast.success(
          cartId
            ? "গ্রাহককে সফলভাবে ফলো-আপ মেসেজ পাঠানো হয়েছে"
            : `একসাথে ${res.data?.triggeredCount || 0}টি ফলো-আপ মেসেজ পাঠানো হয়েছে`
        );
        fetchAbandoned();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ফলো-আপ পাঠাতে ব্যর্থ হয়েছে");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Timeseries Calculations
  const maxRevenue = overview?.timeseries?.length
    ? Math.max(...overview.timeseries.map((p) => p.revenue), 1000)
    : 1000;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="size-3.5 text-yellow-300" />
            বিজনেস ইন্টেলিজেন্স ও গ্রোথ অ্যানালিটিক্স
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            অ্যানালিটিক্স ও গ্রোথ ড্যাশবোর্ড 📈
          </h2>
          <p className="text-sm text-amber-100 max-w-xl leading-relaxed">
            লাইভ রেভিনিউ মেট্রিক্স, এআই কনভার্সন ফানেল, অসম্পূর্ণ কার্ট রিকভারি এবং
            সার্ভার কিউ ও ওয়ার্কার স্বাস্থ্য পর্যবেক্ষণ।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold border-0 backdrop-blur-xs"
          >
            <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            রিফ্রেশ করুন
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveTab("bi")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "bi"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="size-4 text-amber-500" />
          বিজনেস ইন্টেলিজেন্স
        </button>
        <button
          onClick={() => setActiveTab("growth")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "growth"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart className="size-4 text-emerald-500" />
          অসম্পূর্ণ কার্ট
          {abandonedData?.totalAbandoned ? (
            <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/20 font-bold px-1.5 py-0.5 text-[10px]">
              {abandonedData.totalAbandoned}
            </Badge>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("scaling")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "scaling"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="size-4 text-blue-500" />
          সার্ভার কিউ ও স্কেলিং
          {dlqMetrics?.failed ? (
            <Badge className="bg-rose-500/20 text-rose-700 hover:bg-rose-500/20 font-bold px-1.5 py-0.5 text-[10px]">
              {dlqMetrics.failed}টি ব্যর্থ
            </Badge>
          ) : null}
        </button>
      </div>

      {/* ==================== TAB 1: BUSINESS INTELLIGENCE ==================== */}
      {activeTab === "bi" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Timeframe Bar & Top Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold">বিক্রি ও কনভার্সন সারসংক্ষেপ</h3>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              {(["7d", "30d", "90d", "1y"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeframe === tf
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf === "7d"
                    ? "৭ দিন"
                    : tf === "30d"
                      ? "৩০ দিন"
                      : tf === "90d"
                        ? "৯০ দিন"
                        : "১ বছর"}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  মোট বিক্রি (রেভিনিউ)
                </span>
                <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="size-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight">
                  ৳{(overview?.summary.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  নিশ্চিত অর্ডার প্রতি গড় ৳{overview?.summary.avgOrderValue || 0}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  নিশ্চিত অর্ডার
                </span>
                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShoppingCart className="size-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight">
                  {overview?.summary.totalOrders || 0}টি
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.summary.activeCustomers || 0} জন সক্রিয় ক্রেতা থেকে
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  এআই কনভার্সন রেট
                </span>
                <div className="size-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Bot className="size-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-purple-600">
                  {overview?.conversionFunnel.overallConversionRate || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  চ্যাট ভিজিটরদের সফল পেইড অর্ডারে রূপান্তরের হার
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  কুরিয়ার ডেলিভারি সাকসেস
                </span>
                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Truck className="size-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600">
                  {overview?.courierMetrics.successRate || 100}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  রিটার্ন রেট: {overview?.courierMetrics.returnRate || 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Timeseries SVG Chart */}
          <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold">দৈনিক বিক্রি ও অর্ডার পরিমাণ</h4>
                <p className="text-xs text-muted-foreground">
                  বিগত{" "}
                  {timeframe === "7d"
                    ? "৭ দিনের"
                    : timeframe === "30d"
                      ? "৩০ দিনের"
                      : timeframe === "90d"
                        ? "৯০ দিনের"
                        : "১ বছরের"}{" "}
                  বিক্রির ইন্টারেক্টিভ পরিসংখ্যান
                </p>
              </div>
              {hoveredPoint && (
                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold">
                  <span className="text-amber-700">{hoveredPoint.date}</span>
                  <span className="text-foreground">
                    ৳{hoveredPoint.revenue.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    ({hoveredPoint.orderCount}টি অর্ডার)
                  </span>
                </div>
              )}
            </div>

            {/* Custom Interactive SVG Chart */}
            <div className="h-64 w-full relative pt-6">
              {overview?.timeseries?.length ? (
                <div className="h-full w-full flex items-end gap-1 sm:gap-2">
                  {overview.timeseries.map((pt, idx) => {
                    const heightPercent = Math.max(
                      (pt.revenue / maxRevenue) * 100,
                      pt.orderCount > 0 ? 8 : 2
                    );
                    const isHovered = hoveredPoint?.date === pt.date;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                      >
                        {/* Tooltip on hover */}
                        {isHovered && (
                          <div className="absolute -top-10 z-10 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-bold whitespace-nowrap pointer-events-none shadow-md">
                            ৳{pt.revenue.toLocaleString()} ({pt.orderCount}টি)
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-7 rounded-t-lg transition-all duration-200 ${
                            isHovered
                              ? "bg-amber-500 shadow-md shadow-amber-500/40"
                              : pt.revenue > 0
                                ? "bg-amber-500/80 hover:bg-amber-500"
                                : "bg-muted/60"
                          }`}
                        />

                        {/* X-axis label for every few points */}
                        {(idx % Math.ceil(overview.timeseries.length / 8) === 0 ||
                          idx === overview.timeseries.length - 1) && (
                          <span className="text-[9px] text-muted-foreground mt-2 truncate w-full text-center">
                            {pt.date.slice(5)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  নির্বাচিত সময়ের জন্য বিক্রির কোনো তথ্য পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>

          {/* 2-Column: Conversion Funnel & Best Sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Chat Conversion Funnel */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Bot className="size-4 text-purple-500" />
                  এআই চ্যাট থেকে অর্ডার কনভার্সন ফানেল
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ইনবক্সের কথোপকথন কীভাবে নিশ্চিত গ্রাহক অর্ডারে রূপান্তরিত হচ্ছে
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "১. মোট কথোপকথন",
                    count: overview?.conversionFunnel.totalConversations || 0,
                    percent: 100,
                    color: "bg-blue-500",
                  },
                  {
                    label: "২. একক ক্রেতা/গ্রাহক",
                    count: overview?.conversionFunnel.uniqueCustomers || 0,
                    percent: overview?.conversionFunnel.totalConversations
                      ? Math.round(
                          ((overview.conversionFunnel.uniqueCustomers || 0) /
                            overview.conversionFunnel.totalConversations) *
                            100
                        )
                      : 0,
                    color: "bg-amber-500",
                  },
                  {
                    label: "৩. কার্টে পণ্য যোগ করেছে",
                    count: overview?.conversionFunnel.cartsCreated || 0,
                    percent: overview?.conversionFunnel.uniqueCustomers
                      ? Math.round(
                          ((overview.conversionFunnel.cartsCreated || 0) /
                            overview.conversionFunnel.uniqueCustomers) *
                            100
                        )
                      : 0,
                    color: "bg-orange-500",
                  },
                  {
                    label: "৪. নিশ্চিত অর্ডার সম্পন্ন",
                    count: overview?.conversionFunnel.ordersConfirmed || 0,
                    percent: overview?.conversionFunnel.overallConversionRate || 0,
                    color: "bg-emerald-500",
                  },
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{step.label}</span>
                      <span className="text-muted-foreground">
                        {step.count.toLocaleString()} ({step.percent}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(step.percent, 100)}%` }}
                        className={`h-full ${step.color} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Channel Conversion Split */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    ফেসবুক মেসেঞ্জার
                  </span>
                  <p className="text-lg font-black text-blue-600">
                    {overview?.conversionFunnel.channelBreakdown.facebook.rate || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {overview?.conversionFunnel.channelBreakdown.facebook.orders || 0}টি
                    অর্ডার /{" "}
                    {overview?.conversionFunnel.channelBreakdown.facebook.conversations ||
                      0}
                    টি চ্যাট
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    হোয়াটসঅ্যাপ চ্যাট
                  </span>
                  <p className="text-lg font-black text-emerald-600">
                    {overview?.conversionFunnel.channelBreakdown.whatsapp.rate || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {overview?.conversionFunnel.channelBreakdown.whatsapp.orders || 0}টি
                    অর্ডার /{" "}
                    {overview?.conversionFunnel.channelBreakdown.whatsapp.conversations ||
                      0}
                    টি চ্যাট
                  </p>
                </div>
              </div>
            </div>

            {/* Best-Selling Product Breakdown */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Package className="size-4 text-amber-500" />
                  সর্বাধিক বিক্রিত পণ্যের তালিকা
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  পণ্য অনুযায়ী মোট বিক্রি ও বিক্রিত পরিমাণ
                </p>
              </div>

              <div className="space-y-4">
                {overview?.productBreakdown?.length ? (
                  overview.productBreakdown.map((prod) => (
                    <div key={prod.productId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate max-w-[200px]">{prod.productName}</span>
                        <span>
                          ৳{prod.revenue.toLocaleString()}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({prod.unitsSold}টি · {prod.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(prod.percentage, 100)}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    এই নির্বাচিত সময়ে কোনো পণ্য বিক্রির রেকর্ড নেই
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2-Column: Human Handoff Reasons & Logistics Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Human Handoff Analytics */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <HelpCircle className="size-4 text-rose-500" />
                    ম্যানুয়াল টেকওভারের হার ও কারণ
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    টেকওভার রেট: মোট চ্যাটের {overview?.handoffAnalytics.handoffRate || 0}
                    %
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold">
                    {overview?.handoffAnalytics.openHandoffs || 0}টি পেন্ডিং
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                    {overview?.handoffAnalytics.resolvedHandoffs || 0}টি সম্পন্ন
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {overview?.handoffAnalytics.reasonsBreakdown?.length ? (
                  overview.handoffAnalytics.reasonsBreakdown.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold">{r.reason}</span>
                      <span className="font-bold text-muted-foreground">
                        {r.count} বার ({r.percentage}%)
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    এই নির্বাচিত সময়ে কোনো ম্যানুয়াল টেকওভারের প্রয়োজন হয়নি
                  </div>
                )}
              </div>
            </div>

            {/* Courier Performance & Returns */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Truck className="size-4 text-emerald-500" />
                  কুরিয়ার ডেলিভারি সাফল্য বনাম রিটার্ন
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  স্টিডফাস্ট কুরিয়ার পারফরম্যান্স মেট্রিক্স
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    ডেলিভারড
                  </span>
                  <p className="text-xl font-black text-emerald-600">
                    {overview?.courierMetrics.delivered || 0}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {overview?.courierMetrics.successRate || 100}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">
                    ইন ট্রানজিট
                  </span>
                  <p className="text-xl font-black text-blue-600">
                    {overview?.courierMetrics.inTransit || 0}
                  </p>
                  <span className="text-[10px] text-muted-foreground">ডেলিভারির পথে</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">
                    রিটার্ন হয়েছে
                  </span>
                  <p className="text-xl font-black text-rose-600">
                    {overview?.courierMetrics.returned || 0}
                  </p>
                  <span className="text-[10px] font-bold text-rose-700">
                    {overview?.courierMetrics.returnRate || 0}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  কুরিয়ারে পাঠানো মোট পার্সেল
                </span>
                <span className="font-bold text-foreground">
                  {overview?.courierMetrics.totalBooked || 0}টি পার্সেল
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: GROWTH SUITE (ABANDONED CARTS) ==================== */}
      {activeTab === "growth" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Recovery Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                অসম্পূর্ণ কার্ট
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-amber-600">
                  {abandonedData?.totalAbandoned || 0}টি
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  পণ্য রেখে ১ ঘণ্টার বেশি নিষ্ক্রিয়
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                সম্ভাব্য রিকভারি মূল্য
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                  ৳{(abandonedData?.recoverableValue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  অসম্পূর্ণ কার্টে আটকে থাকা রেভিনিউ
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                রিকভার্ড গ্রাহক
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-blue-600">
                  {abandonedData?.recoveredCount || 0} জন
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ফলো-আপের পর সফলভাবে অর্ডার করেছেন
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                রিকভারি রেট
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-purple-600">
                  {abandonedData?.recoveryRate || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  সফলভাবে কার্ট ফিরে আসার হার
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                স্বয়ংক্রিয় রিকভারি ইঞ্জিন (হোয়াটসঅ্যাপ ও ফেসবুক মেসেঞ্জার)
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                সিস্টেম প্রতি ৩০ মিনিট পরপর স্বয়ংক্রিয়ভাবে ফলো-আপ পাঠায়, অথবা আপনি এখনই
                সবাইকে একসাথে মেসেজ পাঠাতে পারেন।
              </p>
            </div>
            <Button
              onClick={() => handleFollowup()}
              disabled={
                isActionLoading ||
                !abandonedData?.carts?.some((c) => !c.abandonedFollowupSentAt)
              }
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
            >
              <Send className="size-4 mr-2" />
              সকলকে একসাথে ফলো-আপ পাঠান
            </Button>
          </div>

          {/* Abandoned Carts Table */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border">
              <h4 className="text-base font-bold">অসম্পূর্ণ বা ফেলে রাখা শপিং কার্ট</h4>
              <p className="text-xs text-muted-foreground">
                যেসব ক্রেতা পণ্য নির্বাচন করেছেন কিন্তু অর্ডার সম্পন্ন করেননি
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">গ্রাহক / ক্রেতা</th>
                    <th className="p-4">চ্যানেল</th>
                    <th className="p-4">কার্টের পণ্যসমূহ</th>
                    <th className="p-4">মোট মূল্য</th>
                    <th className="p-4">শেষ সক্রিয় সময়</th>
                    <th className="p-4">স্ট্যাটাস</th>
                    <th className="p-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {abandonedData?.carts?.length ? (
                    abandonedData.carts.map((cart) => (
                      <tr key={cart.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-foreground">{cart.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {cart.customerPhone}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={`font-bold text-[10px] ${
                              cart.channel === "WHATSAPP"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            }`}
                          >
                            {cart.channel}
                          </Badge>
                        </td>
                        <td className="p-4 max-w-[240px]">
                          <p className="truncate font-medium">{cart.itemsSummary}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {cart.itemsCount}টি পণ্য
                          </span>
                        </td>
                        <td className="p-4 font-bold text-foreground">
                          ৳{cart.totalValue.toLocaleString()}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(cart.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {new Date(cart.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {cart.status === "FOLLOWUP_SENT" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                              ফলো-আপ সম্পন্ন
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">
                              ফলো-আপ অপেক্ষমাণ
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleFollowup(cart.id)}
                            disabled={isActionLoading}
                            variant="outline"
                            className="rounded-xl font-bold text-xs"
                          >
                            <Send className="size-3.5 mr-1" />
                            ফলো-আপ পাঠান
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-xs text-muted-foreground"
                      >
                        এই মুহূর্তে কোনো অসম্পূর্ণ কার্ট নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SCALING & DLQ MONITOR ==================== */}
      {activeTab === "scaling" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Worker Nodes & Queue Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                চলমান কাজ (Active)
              </span>
              <p className="text-2xl font-black text-blue-600">
                {dlqMetrics?.active || 0}টি
              </p>
              <span className="text-[10px] text-muted-foreground">
                বর্তমানে প্রসেস হচ্ছে
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                অপেক্ষমাণ কাজ (Waiting)
              </span>
              <p className="text-2xl font-black text-amber-600">
                {dlqMetrics?.waiting || 0}টি
              </p>
              <span className="text-[10px] text-muted-foreground">
                রেডিস কিউতে অপেক্ষমাণ
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                সম্পন্ন কাজ (Completed)
              </span>
              <p className="text-2xl font-black text-emerald-600">
                {dlqMetrics?.completed || 0}টি
              </p>
              <span className="text-[10px] text-muted-foreground">সফলভাবে শেষ হয়েছে</span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                ব্যর্থ কাজ (DLQ)
              </span>
              <p className="text-2xl font-black text-rose-600">
                {dlqMetrics?.failed || 0}টি
              </p>
              <span className="text-[10px] text-muted-foreground">
                ডেড-লেটার কিউতে জমা
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                ওয়ার্কার নোডস
              </span>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-base font-black text-foreground">AI + মিডিয়া</p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                অটো স্কেলিং সক্রিয় রয়েছে
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-muted/40 border border-border">
            <div>
              <h4 className="text-sm font-bold">ডেড-লেটার কিউ (DLQ) ম্যানেজার</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                ব্যর্থ হওয়া কাজগুলোর ত্রুটি পর্যবেক্ষণ করুন এবং ১ ক্লিকে পুনরায় কিউতে
                পাঠান।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRetryAll}
                disabled={isActionLoading || !dlqMetrics?.failed}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <RotateCcw className="size-4 mr-2" />
                সব ব্যর্থ জব পুনরায় চেষ্টা করুন
              </Button>
              <Button
                onClick={handleCleanDlq}
                disabled={isActionLoading || !dlqMetrics?.failed}
                variant="destructive"
                className="rounded-xl font-bold"
              >
                <Trash2 className="size-4 mr-2" />
                DLQ খালি করুন
              </Button>
            </div>
          </div>

          {/* Failed Jobs Table */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border">
              <h4 className="text-base font-bold">ডেড-লেটার কিউতে থাকা ব্যর্থ কাজসমূহ</h4>
              <p className="text-xs text-muted-foreground">
                যেসব কাজ স্বয়ংক্রিয় চেষ্টার পরেও ব্যর্থ হয়ে DLQ-তে জমা হয়েছে
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">জব আইডি</th>
                    <th className="p-4">কিউ (Queue)</th>
                    <th className="p-4">চেষ্টার সংখ্যা</th>
                    <th className="p-4">ব্যর্থতার কারণ</th>
                    <th className="p-4">সময়</th>
                    <th className="p-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dlqMetrics?.jobs?.length ? (
                    dlqMetrics.jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-foreground">
                          #{job.id}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {job.queue}
                          </Badge>
                        </td>
                        <td className="p-4 font-bold">{job.attemptsMade} বার</td>
                        <td className="p-4 max-w-[280px]">
                          <p className="truncate font-semibold text-rose-600">
                            {job.failedReason}
                          </p>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(job.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedJob(job)}
                            className="rounded-xl text-xs font-bold"
                          >
                            বিবরণ দেখুন
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                            disabled={isActionLoading}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                          >
                            <RotateCcw className="size-3.5 mr-1" />
                            পুনরায় চালান
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                        ডেড-লেটার কিউতে কোনো ব্যর্থ জব নেই। সিস্টেম কিউ সম্পূর্ণ সুস্থ
                        (১০০%)!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Failed Job Modal */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-500" />
                DLQ জব #{selectedJob.id} এর বিবরণ
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                সমস্যা সমাধানের জন্য ত্রুটির বিবরণ, পেলোড ডাটা এবং স্ট্যাক ট্রেস
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-4">
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  ব্যর্থতার কারণ:
                </span>
                <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 font-semibold mt-1">
                  {selectedJob.failedReason}
                </p>
              </div>

              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  জব পেলোড ডাটা:
                </span>
                <pre className="p-3 rounded-xl bg-muted/60 border border-border font-mono text-[11px] overflow-x-auto max-h-40 mt-1">
                  {JSON.stringify(selectedJob.data, null, 2)}
                </pre>
              </div>

              {selectedJob.stacktrace?.length ? (
                <div>
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">
                    স্ট্যাক ট্রেস (Stack Trace):
                  </span>
                  <pre className="p-3 rounded-xl bg-muted/60 border border-border font-mono text-[10px] text-muted-foreground overflow-x-auto max-h-48 mt-1">
                    {selectedJob.stacktrace.join("\n")}
                  </pre>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-xl font-bold"
                >
                  বন্ধ করুন
                </Button>
                <Button
                  onClick={() => handleRetryJob(selectedJob.id)}
                  disabled={isActionLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <RotateCcw className="size-4 mr-1.5" />
                  এখনই পুনরায় চালান
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
