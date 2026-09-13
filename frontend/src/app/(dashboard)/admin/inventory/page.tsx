"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Boxes,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  PackagePlus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { inventoryService } from "@/services/inventory.service";
import { getSocket } from "@/lib/socket";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(50);
  const [restockNote, setRestockNote] = useState("");
  const [isRestocking, setIsRestocking] = useState(false);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdId, setNewProdId] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(1200);
  const [newProdWeight, setNewProdWeight] = useState("500g");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdStock, setNewProdStock] = useState(100);
  const [isCreating, setIsCreating] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await inventoryService.getAllProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error("Failed to load products", err);
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    const socket = getSocket();
    const handleStockUpdate = () => {
      fetchProducts();
    };

    socket.on("inventory:low_stock", handleStockUpdate);

    return () => {
      socket.off("inventory:low_stock", handleStockUpdate);
    };
  }, [fetchProducts]);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || restockQty <= 0) return;

    setIsRestocking(true);
    try {
      const res = await inventoryService.restockProduct(
        restockProduct.id,
        restockQty,
        restockNote || undefined
      );
      if (res.success) {
        toast.success(
          `Successfully added ${restockQty} units to ${restockProduct.name}!`
        );
        setRestockProduct(null);
        setRestockQty(50);
        setRestockNote("");
        fetchProducts();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Restock failed");
    } finally {
      setIsRestocking(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdId.trim() || !newProdName.trim()) {
      toast.error("Product ID and Name are required");
      return;
    }

    setIsCreating(true);
    try {
      const res = await inventoryService.createProduct({
        id: newProdId.trim().toUpperCase(),
        name: newProdName.trim(),
        price: Number(newProdPrice),
        weight: newProdWeight.trim(),
        description: newProdDesc.trim() || undefined,
        stockCount: Number(newProdStock),
        minThreshold: 10,
      });

      if (res.success) {
        toast.success(`Product ${newProdName} added successfully!`);
        setIsAddModalOpen(false);
        setNewProdId("");
        setNewProdName("");
        setNewProdDesc("");
        fetchProducts();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const res = await inventoryService.updateProduct(product.id, {
        isAvailable: !product.isAvailable,
      });
      if (res.success) {
        toast.success(
          `${product.name} is now ${!product.isAvailable ? "Available" : "Hidden"}`
        );
        fetchProducts();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update product");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="size-6 text-amber-500" />
            Product Catalog & Inventory
          </h2>
          <p className="text-xs text-muted-foreground pt-0.5">
            Monitor real-time stock levels, trigger instant restocks, and manage honey
            product offerings.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              fetchProducts();
            }}
            className="rounded-xl font-semibold border-border"
          >
            <RefreshCw className="size-3.5 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
          >
            <Plus className="size-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by SKU, name, or weight..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/40 border-border"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">No products found</p>
            <p className="text-xs text-muted-foreground">
              Try clearing search query or add a new product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-muted-foreground font-bold">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name & Weight</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.map((prod) => {
                  const isLowStock = prod.stockCount <= prod.minThreshold;
                  const isOutOfStock = prod.stockCount === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-foreground">
                        {prod.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-sm">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Weight: {prod.weight} ·{" "}
                          {prod.description || "Premium Natural Honey"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-foreground text-sm">
                        ৳{prod.price}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] font-extrabold border-0 ${
                              isOutOfStock
                                ? "bg-rose-500/20 text-rose-600"
                                : isLowStock
                                  ? "bg-amber-500/20 text-amber-600 animate-pulse"
                                  : "bg-emerald-500/15 text-emerald-600"
                            }`}
                          >
                            {isOutOfStock
                              ? "OUT OF STOCK"
                              : isLowStock
                                ? `LOW: ${prod.stockCount} left`
                                : `${prod.stockCount} in stock`}
                          </Badge>
                          {isLowStock && (
                            <AlertTriangle className="size-3.5 text-amber-500" />
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAvailability(prod)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                            prod.isAvailable
                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {prod.isAvailable ? "Active in Bot" : "Hidden"}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setRestockProduct(prod);
                            setRestockQty(50);
                            setRestockNote("");
                          }}
                          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-8 px-3 shadow-xs"
                        >
                          <PackagePlus className="size-3.5 mr-1" />+ Restock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1-Click Restock Dialog */}
      <Dialog
        open={!!restockProduct}
        onOpenChange={(open) => !open && setRestockProduct(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
              <PackagePlus className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Restock Inventory: {restockProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Current stock:{" "}
              <span className="font-bold text-foreground">
                {restockProduct?.stockCount} units
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRestockSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="restock-qty" className="text-xs font-bold">
                Units to Add (+Qty)
              </Label>
              <Input
                id="restock-qty"
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="restock-note" className="text-xs font-bold">
                Restock Note (Optional)
              </Label>
              <Input
                id="restock-note"
                placeholder="e.g. Received fresh batch from Sundarbans apiary"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRestockProduct(null)}
                disabled={isRestocking}
                className="rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isRestocking || restockQty <= 0}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                {isRestocking ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 mr-1.5" />
                    Confirm Restock (+{restockQty})
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Product Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Add New Product to Catalog
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              New products are automatically indexed for the AI Sales Agent and chatbot.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="pid" className="text-xs font-bold">
                Product SKU / ID
              </Label>
              <Input
                id="pid"
                placeholder="e.g. RH-SUNDARBAN-500G"
                value={newProdId}
                onChange={(e) => setNewProdId(e.target.value)}
                className="rounded-xl font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pname" className="text-xs font-bold">
                Product Name
              </Label>
              <Input
                id="pname"
                placeholder="e.g. Sundarban Natural Honey"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="pprice" className="text-xs font-bold">
                  Price (৳)
                </Label>
                <Input
                  id="pprice"
                  type="number"
                  min={1}
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pweight" className="text-xs font-bold">
                  Weight
                </Label>
                <Input
                  id="pweight"
                  placeholder="e.g. 500g"
                  value={newProdWeight}
                  onChange={(e) => setNewProdWeight(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pstock" className="text-xs font-bold">
                Initial Stock
              </Label>
              <Input
                id="pstock"
                type="number"
                min={0}
                value={newProdStock}
                onChange={(e) => setNewProdStock(Number(e.target.value))}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pdesc" className="text-xs font-bold">
                Description / Taste Notes
              </Label>
              <Input
                id="pdesc"
                placeholder="e.g. 100% pure raw wild flower honey from Sundarbans forest."
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isCreating}
                className="rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                {isCreating ? "Saving..." : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
