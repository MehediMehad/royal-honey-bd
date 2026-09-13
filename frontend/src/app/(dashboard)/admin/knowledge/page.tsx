"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bot,
  Plus,
  Search,
  Trash2,
  Edit2,
  Sparkles,
  Loader2,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  Megaphone,
} from "lucide-react";
import { knowledgeService } from "@/services/knowledge.service";
import { KnowledgeCategory, KnowledgeItem } from "@/types";
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

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>("FAQ");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formTags, setFormTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // RAG Simulator
  const [simQuery, setSimQuery] = useState("");
  const [simResults, setSimResults] = useState<KnowledgeItem[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params: { category?: KnowledgeCategory; search?: string } = {};
      if (categoryFilter !== "ALL") params.category = categoryFilter as KnowledgeCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await knowledgeService.getAllKnowledgeItems(params);
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error("Failed to load knowledge items", err);
      toast.error("Failed to load knowledge items");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormCategory("FAQ");
    setFormQuestion("");
    setFormAnswer("");
    setFormTags("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormTags(item.tags?.join(", ") || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      toast.error("Question and Answer are required");
      return;
    }

    setIsSaving(true);
    const tags = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingItem) {
        const res = await knowledgeService.updateKnowledgeItem(editingItem.id, {
          category: formCategory,
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          tags,
        });
        if (res.success) {
          toast.success("Knowledge item updated successfully!");
          setIsModalOpen(false);
          fetchItems();
        }
      } else {
        const res = await knowledgeService.createKnowledgeItem({
          category: formCategory,
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          tags,
        });
        if (res.success) {
          toast.success("Knowledge item created and indexed in vector store!");
          setIsModalOpen(false);
          fetchItems();
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save knowledge item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge item?")) return;
    try {
      const res = await knowledgeService.deleteKnowledgeItem(id);
      if (res.success) {
        toast.success("Knowledge item deleted");
        fetchItems();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  const handleSimulateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simQuery.trim()) return;

    setIsSimulating(true);
    try {
      const res = await knowledgeService.testSearch(simQuery.trim(), 3);
      if (res.success && res.data) {
        setSimResults(res.data);
        if (res.data.length === 0) {
          toast.info("No matching knowledge chunks found for this query");
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "RAG test failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const getCategoryIcon = (cat: KnowledgeCategory) => {
    switch (cat) {
      case "FAQ":
        return <HelpCircle className="size-3.5 text-blue-500" />;
      case "POLICY":
        return <ShieldCheck className="size-3.5 text-emerald-500" />;
      case "HONEY_GUIDE":
        return <BookOpen className="size-3.5 text-amber-500" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="size-3.5 text-purple-500" />;
      default:
        return <HelpCircle className="size-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Bot className="size-6 text-amber-500" />
            AI Knowledge Base & Testing
          </h2>
          <p className="text-xs text-muted-foreground pt-0.5">
            Manage FAQs, return policies, and honey dosage instructions indexed for the AI
            chatbot.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
        >
          <Plus className="size-4 mr-1.5" />
          Add Knowledge Item
        </Button>
      </div>

      {/* RAG Test Simulator Card */}
      <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              AI RAG Vector Test Simulator
            </h3>
            <p className="text-xs text-muted-foreground">
              Simulate customer queries to verify which knowledge chunks the AI agent will
              retrieve via OpenAI embeddings.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimulateSearch} className="flex gap-2">
          <Input
            placeholder="Type a customer query e.g. 'মধু আসল কি নকল বুঝব কিভাবে?' or 'ডেলিভারি কত দিন লাগবে?'"
            value={simQuery}
            onChange={(e) => setSimQuery(e.target.value)}
            className="rounded-xl bg-card border-border text-xs flex-1"
          />
          <Button
            type="submit"
            disabled={isSimulating || !simQuery.trim()}
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 shadow-xs"
          >
            {isSimulating ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="size-4 mr-1" />
            )}
            Test Query
          </Button>
        </form>

        {simResults.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">
              Top Retrieved Knowledge Chunks ({simResults.length})
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {simResults.map((r, i) => (
                <div
                  key={r.id || i}
                  className="p-3.5 rounded-xl border border-purple-500/25 bg-card shadow-xs space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {r.category}
                    </Badge>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                      Rank #{i + 1}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground">{r.question}</h4>
                  <p className="text-muted-foreground text-[11px] line-clamp-3 leading-relaxed">
                    {r.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search FAQs, policies, or guide content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/40 border-border"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "ALL", label: "All Items" },
            { id: "FAQ", label: "FAQs" },
            { id: "POLICY", label: "Policies" },
            { id: "HONEY_GUIDE", label: "Honey Guides" },
            { id: "ANNOUNCEMENT", label: "Announcements" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === tab.id
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Items Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
          Loading AI knowledge base...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center space-y-2 rounded-2xl border border-border bg-card">
          <p className="text-sm font-bold text-foreground">No knowledge items found</p>
          <p className="text-xs text-muted-foreground">
            Click "+ Add Knowledge Item" to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 hover:border-amber-500/30 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(item.category)}
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(item)}
                      className="size-7 rounded-lg"
                    >
                      <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="size-7 rounded-lg hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-foreground">{item.question}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-border/60">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingItem ? "Edit Knowledge Item" : "New Knowledge Item"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Embeddings will be automatically computed and stored in the vector index.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Category</Label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                className="w-full rounded-xl border border-border bg-background p-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-amber-500"
              >
                <option value="FAQ">FAQ (Frequently Asked Questions)</option>
                <option value="POLICY">POLICY (Return, Delivery, Payment Terms)</option>
                <option value="HONEY_GUIDE">HONEY_GUIDE (Health Benefits, Dosage)</option>
                <option value="ANNOUNCEMENT">ANNOUNCEMENT (Promos, Offers)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="kq" className="text-xs font-bold">
                Question / Topic Header
              </Label>
              <Input
                id="kq"
                placeholder="e.g. মধু ফ্রিজে রাখলে কি জমে যায়?"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ka" className="text-xs font-bold">
                Knowledge Answer Content
              </Label>
              <textarea
                id="ka"
                rows={5}
                placeholder="Detailed and accurate response that the AI bot will reference..."
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:ring-1 focus:ring-amber-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="kt" className="text-xs font-bold">
                Keywords / Tags (Comma separated)
              </Label>
              <Input
                id="kt"
                placeholder="e.g. খাঁটি মধু, জমে যাওয়া, ফ্রিজ, পরীক্ষা"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                {isSaving
                  ? "Indexing..."
                  : editingItem
                    ? "Update Item"
                    : "Create & Index"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
