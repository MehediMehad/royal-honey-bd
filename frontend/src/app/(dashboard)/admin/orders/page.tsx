"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  ShieldAlert,
  Loader2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { orderService } from "@/services/order.service";
import { getSocket } from "@/lib/socket";
import { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Payment Verification Modal State
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Courier Booking State
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await orderService.getAllOrders(params);
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    const handleOrderEvent = () => {
      fetchOrders();
    };

    socket.on("order:new", handleOrderEvent);
    socket.on("payment:pending", handleOrderEvent);
    socket.on("order:status_updated", handleOrderEvent);

    return () => {
      socket.off("order:new", handleOrderEvent);
      socket.off("payment:pending", handleOrderEvent);
      socket.off("order:status_updated", handleOrderEvent);
    };
  }, [fetchOrders]);

  const handleVerifyPayment = async (action: "APPROVE" | "REJECT") => {
    if (!verifyingOrder) return;
    setIsProcessingPayment(true);
    try {
      const res = await orderService.verifyPayment(
        verifyingOrder.id,
        action,
        verificationNotes
      );
      if (res.success) {
        toast.success(
          action === "APPROVE"
            ? `Payment verified for Order ${verifyingOrder.id}!`
            : `Payment rejected for Order ${verifyingOrder.id}`
        );
        setVerifyingOrder(null);
        setVerificationNotes("");
        fetchOrders();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment verification failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBookCourier = async (order: Order) => {
    setBookingOrderId(order.id);
    try {
      const res = await orderService.bookCourier(order.id);
      if (res.success) {
        toast.success(`Order ${order.id} sent to Steadfast Courier!`);
        fetchOrders();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Courier booking failed");
    } finally {
      setBookingOrderId(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await orderService.updateStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      o.id.toLowerCase().includes(query) ||
      o.customer?.name?.toLowerCase().includes(query) ||
      o.customer?.phone?.includes(query) ||
      o.transactionId?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" ||
      o.orderStatus === statusFilter ||
      (statusFilter === "VERIFICATION_PENDING" &&
        o.paymentStatus === "VERIFICATION_PENDING");

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 ">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Orders & Payment Verification
          </h2>
          <p className="text-xs text-muted-foreground pt-0.5">
            Verify advance bKash/Nagad payments, print automated shipping invoices, and
            dispatch courier parcels.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            fetchOrders();
          }}
          className="rounded-xl font-semibold border-border"
        >
          <RefreshCw className="size-3.5 mr-2" />
          Refresh Orders
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID (RH-XXXXXX), phone, customer, or TrxID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/40 border-border"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "VERIFICATION_PENDING", label: "Pending Payment ⏳" },
            { id: "CONFIRMED", label: "Confirmed" },
            { id: "PROCESSING", label: "Processing" },
            { id: "SHIPPED", label: "Shipped" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
            Loading customer orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">
              No orders matching criteria
            </p>
            <p className="text-xs text-muted-foreground">
              Try clearing filters or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-muted-foreground font-bold">
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items / Total</th>
                  <th className="py-3 px-4">Payment & TrxID</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Courier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order) => {
                  const isPendingVerification =
                    order.paymentStatus === "VERIFICATION_PENDING";

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isPendingVerification ? "bg-amber-500/5" : ""
                      }`}
                    >
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-extrabold text-foreground">{order.id}</span>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">
                          {order.customer?.name || "Customer"}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {order.customer?.phone || "No phone"}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-44">
                          {order.customer?.fullAddress || order.customer?.district || ""}
                        </div>
                      </td>

                      {/* Items / Total */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-foreground text-sm">
                          ৳{order.totalAmount}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {order.items?.length || 1} items (Del: ৳{order.deliveryCharge})
                        </div>
                      </td>

                      {/* Payment & TrxID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`text-[10px] font-bold ${
                                order.paymentStatus === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-600 border-0"
                                  : order.paymentStatus === "VERIFICATION_PENDING"
                                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/30 animate-pulse"
                                    : "bg-muted text-muted-foreground border-0"
                              }`}
                            >
                              {order.paymentMethod}: {order.paymentStatus}
                            </Badge>
                          </div>

                          {order.transactionId && (
                            <div className="text-[11px] font-mono text-foreground font-semibold flex items-center gap-1">
                              <span>TrxID:</span>
                              <span className="text-amber-600 dark:text-amber-400">
                                {order.transactionId}
                              </span>
                            </div>
                          )}

                          {isPendingVerification && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setVerifyingOrder(order);
                                setVerificationNotes("");
                              }}
                              className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] h-6 px-2 shadow-xs"
                            >
                              Verify Payment →
                            </Button>
                          )}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="text-xs font-semibold rounded-lg border border-border bg-background px-2 py-1 text-foreground cursor-pointer focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      {/* Courier Dispatch */}
                      <td className="py-3.5 px-4">
                        {order.consignmentId || order.trackingCode ? (
                          <div className="space-y-0.5">
                            <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px] font-bold">
                              Steadfast Booked
                            </Badge>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {order.trackingCode || order.consignmentId}
                            </div>
                          </div>
                        ) : order.orderStatus === "CONFIRMED" ||
                          order.orderStatus === "PROCESSING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={bookingOrderId === order.id}
                            onClick={() => handleBookCourier(order)}
                            className="rounded-lg border-blue-500/30 text-blue-600 hover:bg-blue-500/10 font-bold text-[10px] h-7 px-2.5"
                          >
                            <Truck className="size-3 mr-1" />
                            {bookingOrderId === order.id
                              ? "Booking..."
                              : "Send to Steadfast"}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Invoice Print */}
                          <Button
                            variant="outline"
                            size="icon"
                            title="Print Label & Invoice"
                            onClick={() =>
                              window.open(orderService.getInvoiceUrl(order.id), "_blank")
                            }
                            className="size-8 rounded-xl border-border hover:bg-muted"
                          >
                            <FileText className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>

                          {/* Order Details */}
                          <Button
                            variant="outline"
                            size="icon"
                            title="View Full Details"
                            onClick={() => setSelectedOrder(order)}
                            className="size-8 rounded-xl border-border hover:bg-muted"
                          >
                            <Eye className="size-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1-Click Payment Verification Modal */}
      <Dialog
        open={!!verifyingOrder}
        onOpenChange={(open) => !open && setVerifyingOrder(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
              <ShieldAlert className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Verify Advance Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Order:{" "}
              <span className="font-bold text-foreground">{verifyingOrder?.id}</span>
            </DialogDescription>
          </DialogHeader>

          {verifyingOrder && (
            <div className="space-y-3 py-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-bold text-foreground">
                    {verifyingOrder.customer?.name} ({verifyingOrder.customer?.phone})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount to Collect:</span>
                  <span className="font-extrabold text-foreground text-sm">
                    ৳{verifyingOrder.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Method:</span>
                  <Badge className="font-bold text-[10px]">
                    {verifyingOrder.paymentMethod}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Customer TrxID:
                  </span>
                  <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {verifyingOrder.transactionId || "None specified"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground">
                  Verification Note (Optional)
                </label>
                <Input
                  placeholder="e.g., Received ৳1250 on bKash merchant 01604121107"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleVerifyPayment("REJECT")}
              disabled={isProcessingPayment}
              className="rounded-xl font-semibold"
            >
              <XCircle className="size-4 mr-1.5" />
              Reject Payment
            </Button>

            <Button
              size="sm"
              onClick={() => handleVerifyPayment("APPROVE")}
              disabled={isProcessingPayment}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Approve & Confirm Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Sheet/Modal */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Order Details: {selectedOrder?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Created on{" "}
              {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2 text-xs">
              {/* Customer Box */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
                <span className="font-bold text-[11px] text-muted-foreground uppercase">
                  Customer & Delivery
                </span>
                <div className="font-bold text-foreground">
                  {selectedOrder.customer?.name}
                </div>
                <div className="font-mono text-muted-foreground">
                  {selectedOrder.customer?.phone}
                </div>
                <div className="text-muted-foreground leading-relaxed">
                  {selectedOrder.customer?.fullAddress || "Address not specified"}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-[11px] text-muted-foreground uppercase">
                  Ordered Items
                </span>
                <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-card">
                      <div>
                        <div className="font-bold text-foreground">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.quantity} x ৳{item.unitPrice}
                        </div>
                      </div>
                      <div className="font-extrabold text-foreground">
                        ৳{item.totalPrice}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-muted/40 space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Charge:</span>
                      <span>৳{selectedOrder.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-foreground text-sm pt-1 border-t border-border">
                      <span>Grand Total:</span>
                      <span>৳{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedOrder) {
                  window.open(orderService.getInvoiceUrl(selectedOrder.id), "_blank");
                }
              }}
              className="rounded-xl font-bold"
            >
              <FileText className="size-4 mr-1.5" />
              Print Invoice / Label
            </Button>
            <Button
              size="sm"
              onClick={() => setSelectedOrder(null)}
              className="rounded-xl font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
