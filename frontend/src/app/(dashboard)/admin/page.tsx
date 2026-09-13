"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertTriangle,
  MessageSquare,
  ArrowUpRight,
  Boxes,
  Bot,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { inventoryService } from "@/services/inventory.service";
import { orderService } from "@/services/order.service";
import { getSocket } from "@/lib/socket";
import { DashboardStats, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Restock Dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [isRestocking, setIsRestocking] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardService.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const socket = getSocket();
    const handleRefresh = () => {
      fetchStats();
    };

    socket.on("order:new", handleRefresh);
    socket.on("payment:pending", handleRefresh);
    socket.on("inventory:low_stock", handleRefresh);
    socket.on("message:new", handleRefresh);

    return () => {
      socket.off("order:new", handleRefresh);
      socket.off("payment:pending", handleRefresh);
      socket.off("inventory:low_stock", handleRefresh);
      socket.off("message:new", handleRefresh);
    };
  }, [fetchStats]);

  const handleQuickRestock = async () => {
    if (!selectedProduct) return;
    setIsRestocking(true);
    try {
      const res = await inventoryService.restockProduct(
        selectedProduct.id,
        restockQty,
        "Dashboard 1-click restock"
      );
      if (res.success) {
        toast.success(`Restocked ${restockQty} units of ${selectedProduct.name}`);
        setSelectedProduct(null);
        fetchStats();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Restock failed");
    } finally {
      setIsRestocking(false);
    }
  };

  const metrics = stats?.metrics;

  const kpis = [
    {
      title: "Total Revenue",
      value: `৳${(metrics?.totalRevenue || 0).toLocaleString()}`,
      sub: "Paid & confirmed orders",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10",
      href: "/admin/orders",
    },
    {
      title: "Total Orders",
      value: (metrics?.totalOrders || 0).toString(),
      sub: `${metrics?.confirmedOrders || 0} confirmed · ${metrics?.deliveredOrders || 0} delivered`,
      icon: ShoppingCart,
      color: "text-blue-500 bg-blue-500/10",
      href: "/admin/orders",
    },
    {
      title: "Pending Payments",
      value: (metrics?.pendingPayments || 0).toString(),
      sub: "Awaiting bKash / Nagad verification",
      icon: Clock,
      color: "text-amber-500 bg-amber-500/10",
      href: "/admin/orders",
      highlight: (metrics?.pendingPayments || 0) > 0,
    },
    {
      title: "Low Stock Items",
      value: (metrics?.lowStockCount || 0).toString(),
      sub: "Products ≤ 10 units remaining",
      icon: AlertTriangle,
      color: "text-rose-500 bg-rose-500/10",
      href: "/admin/inventory",
      highlight: (metrics?.lowStockCount || 0) > 0,
    },
    {
      title: "Active Live Chats",
      value: (metrics?.activeConversations || 0).toString(),
      sub: `${metrics?.takeoverConversations || 0} in human takeover`,
      icon: MessageSquare,
      color: "text-purple-500 bg-purple-500/10",
      href: "/admin/inbox",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Live AI Agent Active (BullMQ + OpenAI)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Royal Honey BD Operations Hub 🍯
          </h2>
          <p className="text-sm text-amber-50 max-w-xl leading-relaxed">
            Real-time control center for WhatsApp & Facebook automated orders, bKash
            payment verifications, and courier dispatch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setIsRefreshing(true);
              fetchStats();
            }}
            disabled={isRefreshing}
            className="rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold border-0 backdrop-blur-xs"
          >
            <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/admin/inbox">
            <Button className="rounded-xl bg-white text-amber-700 hover:bg-white/95 font-bold shadow-md">
              <Bot className="size-4 mr-2" />
              Live Inbox
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              href={kpi.href}
              className={`group flex flex-col justify-between p-5 rounded-2xl border bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                kpi.highlight
                  ? "border-amber-500/50 ring-1 ring-amber-500/30"
                  : "border-border hover:border-amber-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${kpi.color}`}
                >
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </div>
              <div className="pt-4 space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {kpi.title}
                </p>
                <p className="text-2xl font-black text-foreground tracking-tight">
                  {isLoading ? "..." : kpi.value}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {kpi.sub}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Low Stock Warning Section (if any products <= 10) */}
      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Low Stock Inventory Alert ({stats.lowStockProducts.length} items)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Immediate restock recommended to prevent stockouts during active
                  campaigns.
                </p>
              </div>
            </div>
            <Link href="/admin/inventory">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold"
              >
                View All Inventory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {stats.lowStockProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">
                    {prod.name}
                  </h4>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      {prod.stockCount} units left
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      ৳{prod.price}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(prod);
                    setRestockQty(50);
                  }}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-8 px-3"
                >
                  + Restock
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column: Recent Orders & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-foreground">Recent Orders</h3>
              <p className="text-xs text-muted-foreground">
                Latest incoming orders across all channels
              </p>
            </div>
            <Link href="/admin/orders">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                View All Orders →
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Loading recent orders...
            </div>
          ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-muted-foreground">No orders recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-foreground">
                        {order.id}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-foreground">
                          {order.customer?.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {order.customer?.phone || "No phone"}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-foreground">
                        ৳{order.totalAmount}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            order.paymentStatus === "PAID"
                              ? "default"
                              : order.paymentStatus === "VERIFICATION_PENDING"
                                ? "outline"
                                : "secondary"
                          }
                          className={`text-[10px] font-bold ${
                            order.paymentStatus === "VERIFICATION_PENDING"
                              ? "border-amber-500 text-amber-600 bg-amber-500/10"
                              : ""
                          }`}
                        >
                          {order.paymentMethod}: {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-muted text-foreground">
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print Invoice"
                            onClick={() =>
                              window.open(orderService.getInvoiceUrl(order.id), "_blank")
                            }
                            className="size-7 rounded-lg"
                          >
                            <FileText className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Link href={`/admin/orders`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Manage Order"
                              className="size-7 rounded-lg"
                            >
                              <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Operations Status Widget */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h3 className="text-base font-bold text-foreground pb-3 border-b border-border">
            Engine & Courier Status
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Bot className="size-4 text-amber-500" /> AI Support Worker
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-bold text-[10px]">
                Active (BullMQ)
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Boxes className="size-4 text-blue-500" /> Steadfast Courier
              </span>
              <Badge className="bg-blue-500/10 text-blue-600 border-0 font-bold text-[10px]">
                Sandbox Safe Mode
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-purple-500" /> Vector Knowledge Base
              </span>
              <Badge className="bg-purple-500/10 text-purple-600 border-0 font-bold text-[10px]">
                Cosine RAG Synced
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="font-semibold text-foreground">PostgreSQL 16</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Session Store</span>
              <span className="font-semibold text-foreground">Redis 7 Cluster</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Quick Shortcuts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold justify-start"
                >
                  <ShoppingCart className="size-3.5 mr-1.5 text-amber-500" /> Orders
                </Button>
              </Link>
              <Link href="/admin/inbox">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold justify-start"
                >
                  <MessageSquare className="size-3.5 mr-1.5 text-amber-500" /> Inbox
                </Button>
              </Link>
              <Link href="/admin/inventory">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold justify-start"
                >
                  <Boxes className="size-3.5 mr-1.5 text-amber-500" /> Inventory
                </Button>
              </Link>
              <Link href="/admin/knowledge">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold justify-start"
                >
                  <Bot className="size-3.5 mr-1.5 text-amber-500" /> Knowledge
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Restock Dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Restock Product: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Current stock: {selectedProduct?.stockCount} units. Enter the quantity to
              add to inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty" className="text-xs font-bold">
                Quantity to Add
              </Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProduct(null)}
              disabled={isRestocking}
              className="rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleQuickRestock}
              disabled={isRestocking || restockQty <= 0}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {isRestocking ? "Updating..." : `Confirm Restock (+${restockQty})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
