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
      toast.error("Failed to load business intelligence data");
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
        toast.success(`Job #${jobId} re-enqueued for execution`);
        setSelectedJob(null);
        fetchDlq();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to retry job");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRetryAll = async () => {
    setIsActionLoading(true);
    try {
      const res = await analyticsService.retryAllDlq();
      if (res.success) {
        toast.success(`Re-enqueued ${res.data?.retriedCount || 0} failed jobs`);
        fetchDlq();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to retry all jobs");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCleanDlq = async () => {
    if (!confirm("Are you sure you want to clean and clear all failed jobs in DLQ?"))
      return;
    setIsActionLoading(true);
    try {
      const res = await analyticsService.cleanDlq();
      if (res.success) {
        toast.success("Dead-letter queue purged successfully");
        fetchDlq();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to clean DLQ");
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
            ? "Follow-up message dispatched to customer"
            : `Batch triggered ${res.data?.triggeredCount || 0} follow-up messages`
        );
        fetchAbandoned();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger follow-up");
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
            Phase 12: Business Intelligence & Scaling
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Analytics & Growth Suite 📈
          </h2>
          <p className="text-sm text-amber-100 max-w-xl leading-relaxed">
            Live revenue metrics, AI conversion funnel, automated abandoned cart recovery,
            and BullMQ dead-letter queue (DLQ) health monitor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold border-0 backdrop-blur-xs"
          >
            <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
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
          Business Intelligence
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
          Abandoned Carts
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
          DLQ & Worker Scaling
          {dlqMetrics?.failed ? (
            <Badge className="bg-rose-500/20 text-rose-700 hover:bg-rose-500/20 font-bold px-1.5 py-0.5 text-[10px]">
              {dlqMetrics.failed} failed
            </Badge>
          ) : null}
        </button>
      </div>

      {/* ==================== TAB 1: BUSINESS INTELLIGENCE ==================== */}
      {activeTab === "bi" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Timeframe Bar & Top Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold">Revenue & Conversion Overview</h3>
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
                    ? "7 Days"
                    : tf === "30d"
                      ? "30 Days"
                      : tf === "90d"
                        ? "90 Days"
                        : "1 Year"}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Revenue
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
                  Avg. ৳{overview?.summary.avgOrderValue || 0} per confirmed order
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Confirmed Orders
                </span>
                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShoppingCart className="size-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight">
                  {overview?.summary.totalOrders || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {overview?.summary.activeCustomers || 0} unique active customers
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  AI Conversion Rate
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
                  Chat visitors converting into paid orders
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Courier Success Rate
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
                  Return rate: {overview?.courierMetrics.returnRate || 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Timeseries SVG Chart */}
          <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold">Daily Revenue & Order Volume</h4>
                <p className="text-xs text-muted-foreground">
                  Interactive sales trend for the past{" "}
                  {timeframe === "7d"
                    ? "7 days"
                    : timeframe === "30d"
                      ? "30 days"
                      : timeframe === "90d"
                        ? "90 days"
                        : "year"}
                </p>
              </div>
              {hoveredPoint && (
                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold">
                  <span className="text-amber-700">{hoveredPoint.date}</span>
                  <span className="text-foreground">
                    ৳{hoveredPoint.revenue.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    ({hoveredPoint.orderCount} orders)
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
                            ৳{pt.revenue.toLocaleString()} ({pt.orderCount})
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all duration-200 ${
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
                  No revenue data available for selected timeframe
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
                  AI Chat-to-Order Conversion Funnel
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How incoming conversations convert into confirmed customer orders
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "1. Total Conversations",
                    count: overview?.conversionFunnel.totalConversations || 0,
                    percent: 100,
                    color: "bg-blue-500",
                  },
                  {
                    label: "2. Unique Customers",
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
                    label: "3. Items Added to Cart",
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
                    label: "4. Confirmed Orders",
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
                    Facebook Messenger
                  </span>
                  <p className="text-lg font-black text-blue-600">
                    {overview?.conversionFunnel.channelBreakdown.facebook.rate || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {overview?.conversionFunnel.channelBreakdown.facebook.orders || 0}{" "}
                    orders /{" "}
                    {overview?.conversionFunnel.channelBreakdown.facebook.conversations ||
                      0}{" "}
                    chats
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    WhatsApp Chat
                  </span>
                  <p className="text-lg font-black text-emerald-600">
                    {overview?.conversionFunnel.channelBreakdown.whatsapp.rate || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {overview?.conversionFunnel.channelBreakdown.whatsapp.orders || 0}{" "}
                    orders /{" "}
                    {overview?.conversionFunnel.channelBreakdown.whatsapp.conversations ||
                      0}{" "}
                    chats
                  </p>
                </div>
              </div>
            </div>

            {/* Best-Selling Product Breakdown */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Package className="size-4 text-amber-500" />
                  Best-Selling Product Breakdown
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Revenue and units sold by product category
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
                            ({prod.unitsSold} units · {prod.percentage}%)
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
                    No product sales recorded yet in this timeframe
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
                    Human Handoff Rate & Reasons
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Handoff rate: {overview?.handoffAnalytics.handoffRate || 0}% of all
                    chats
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold">
                    {overview?.handoffAnalytics.openHandoffs || 0} Open
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                    {overview?.handoffAnalytics.resolvedHandoffs || 0} Resolved
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
                        {r.count} times ({r.percentage}%)
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No human handoffs triggered in this timeframe
                  </div>
                )}
              </div>
            </div>

            {/* Courier Performance & Returns */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-6">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Truck className="size-4 text-emerald-500" />
                  Courier Delivery Success vs Return Rate
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Steadfast Courier logistics performance metrics
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    Delivered
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
                    In Transit
                  </span>
                  <p className="text-xl font-black text-blue-600">
                    {overview?.courierMetrics.inTransit || 0}
                  </p>
                  <span className="text-[10px] text-muted-foreground">On the way</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">
                    Returned
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
                  Total Courier Booked Parcels
                </span>
                <span className="font-bold text-foreground">
                  {overview?.courierMetrics.totalBooked || 0} parcels
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
                Abandoned Carts
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-amber-600">
                  {abandonedData?.totalAbandoned || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Idle for &gt; 1 hour with items
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Recoverable Value
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                  ৳{(abandonedData?.recoverableValue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Potential revenue in pending carts
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Recovered Customers
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-blue-600">
                  {abandonedData?.recoveredCount || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed order after follow-up
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Recovery Rate
              </span>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-purple-600">
                  {abandonedData?.recoveryRate || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Successful cart re-engagements
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Automated Re-engagement Engine (WhatsApp & Messenger)
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                The system automatically triggers polite follow-up messages every 30
                minutes, or you can trigger an instant batch.
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
              Batch Re-engage All Unsent
            </Button>
          </div>

          {/* Abandoned Carts Table */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border">
              <h4 className="text-base font-bold">Uncompleted Shopping Carts</h4>
              <p className="text-xs text-muted-foreground">
                Customers who selected products but haven&apos;t confirmed checkout yet
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Items in Cart</th>
                    <th className="p-4">Total Value</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
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
                            {cart.itemsCount} product(s)
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
                              Follow-up Sent
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">
                              Pending Follow-up
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
                            Re-engage
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
                        No abandoned carts recorded at this time
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
                Active Jobs
              </span>
              <p className="text-2xl font-black text-blue-600">
                {dlqMetrics?.active || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Processing right now
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Waiting Jobs
              </span>
              <p className="text-2xl font-black text-amber-600">
                {dlqMetrics?.waiting || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">In Redis queue</span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Completed Jobs
              </span>
              <p className="text-2xl font-black text-emerald-600">
                {dlqMetrics?.completed || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Successfully resolved
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Failed (DLQ)
              </span>
              <p className="text-2xl font-black text-rose-600">
                {dlqMetrics?.failed || 0}
              </p>
              <span className="text-[10px] text-muted-foreground">Dead-letter queue</span>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Worker Nodes
              </span>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-base font-black text-foreground">AI + Media</p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Horizontal scaling active
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-muted/40 border border-border">
            <div>
              <h4 className="text-sm font-bold">Dead-Letter Queue (DLQ) Manager</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect failed BullMQ jobs with error stack traces and re-enqueue with 1
                click.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRetryAll}
                disabled={isActionLoading || !dlqMetrics?.failed}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <RotateCcw className="size-4 mr-2" />
                Retry All Failed
              </Button>
              <Button
                onClick={handleCleanDlq}
                disabled={isActionLoading || !dlqMetrics?.failed}
                variant="destructive"
                className="rounded-xl font-bold"
              >
                <Trash2 className="size-4 mr-2" />
                Clean DLQ
              </Button>
            </div>
          </div>

          {/* Failed Jobs Table */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="p-5 border-b border-border">
              <h4 className="text-base font-bold">Failed Jobs in Dead-Letter Queue</h4>
              <p className="text-xs text-muted-foreground">
                Jobs that exhausted automated retry attempts and were parked in DLQ
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Job ID</th>
                    <th className="p-4">Queue</th>
                    <th className="p-4">Attempts</th>
                    <th className="p-4">Failed Reason</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Action</th>
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
                        <td className="p-4 font-bold">{job.attemptsMade}</td>
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
                            Inspect
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                            disabled={isActionLoading}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                          >
                            <RotateCcw className="size-3.5 mr-1" />
                            Retry
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
                        No failed jobs in Dead-Letter Queue. BullMQ queue health is 100%!
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
                DLQ Job #{selectedJob.id} Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Error details, payload, and stack trace for troubleshooting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-4">
              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  Failed Reason:
                </span>
                <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 font-semibold mt-1">
                  {selectedJob.failedReason}
                </p>
              </div>

              <div>
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  Job Payload:
                </span>
                <pre className="p-3 rounded-xl bg-muted/60 border border-border font-mono text-[11px] overflow-x-auto max-h-40 mt-1">
                  {JSON.stringify(selectedJob.data, null, 2)}
                </pre>
              </div>

              {selectedJob.stacktrace?.length ? (
                <div>
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">
                    Stack Trace:
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
                  Close
                </Button>
                <Button
                  onClick={() => handleRetryJob(selectedJob.id)}
                  disabled={isActionLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <RotateCcw className="size-4 mr-1.5" />
                  Retry Job Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
