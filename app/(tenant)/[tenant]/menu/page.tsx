"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/public-ordering";
import {
  IconToolsKitchen2,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconX,
  IconPhoto,
  IconCirclePlus,
  IconLoader,
  IconUpload,
  IconLink,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantOption = { name: string; price: number };
type Variant = { name: string; options: VariantOption[] };
type Addon = { name: string; price: number };

type MenuItem = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  available: boolean;
  prepNoteAllowed?: boolean;
  variants?: Variant[];
  addons?: Addon[];
  photos?: { url?: string; alt?: string }[];
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  category: string;
  description: string;
  basePrice: string;
  available: boolean;
  prepNoteAllowed: boolean;
  photoUrl: string;
  photoTab: "url" | "upload";
  photoPreview: string | null; // data-url from file upload
  variants: Variant[];
  addons: Addon[];
};

const BLANK_FORM: FormState = {
  name: "",
  category: "",
  description: "",
  basePrice: "",
  available: true,
  prepNoteAllowed: true,
  photoUrl: "",
  photoTab: "url",
  photoPreview: null,
  variants: [],
  addons: [],
};

function itemToForm(item: MenuItem): FormState {
  return {
    name: item.name,
    category: item.category,
    description: item.description ?? "",
    basePrice: String(item.basePrice),
    available: item.available,
    prepNoteAllowed: item.prepNoteAllowed ?? true,
    photoUrl: item.photos?.[0]?.url ?? "",
    photoTab: "url",
    photoPreview: null,
    variants: item.variants ?? [],
    addons: item.addons ?? [],
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Queries
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-menu"],
    queryFn: () => api<{ data: MenuItem[] }>("/v1/menu"),
    staleTime: 30_000,
  });

  const items = data?.data ?? [];

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  // ── Mutations
  const createItem = useMutation({
    mutationFn: (body: object) =>
      api<{ data: MenuItem }>("/v1/menu", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-menu"] });
      toast.success("Menu item created");
      closeModal();
    },
    onError: () => toast.error("Failed to create item"),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      api<{ data: MenuItem }>(`/v1/menu/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-menu"] });
      toast.success("Item updated");
      closeModal();
    },
    onError: () => toast.error("Failed to update item"),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => api(`/v1/menu/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-menu"] });
      toast.success("Item deleted");
      setConfirmDeleteId(null);
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const toggleAvail = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      api(`/v1/menu/${id}`, { method: "PATCH", body: JSON.stringify({ available }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-menu"] }),
    onError: () => toast.error("Failed to update availability"),
  });

  // ── Modal helpers
  function openCreate() {
    setEditingItem(null);
    setForm(BLANK_FORM);
    setPhotoFile(null);
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    setForm(itemToForm(item));
    setPhotoFile(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setForm(BLANK_FORM);
    setPhotoFile(null);
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((p) => ({ ...p, photoPreview: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Name and category are required");
      return;
    }
    const price = parseFloat(form.basePrice);
    if (isNaN(price) || price < 0) {
      toast.error("Enter a valid base price");
      return;
    }
    // Prefer uploaded file's data-url, fall back to typed URL
    const resolvedPhotoUrl =
      form.photoTab === "upload" && form.photoPreview
        ? form.photoPreview
        : form.photoUrl.trim() || null;

    const body = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim() || undefined,
      basePrice: price,
      available: form.available,
      prepNoteAllowed: form.prepNoteAllowed,
      photos: resolvedPhotoUrl ? [{ url: resolvedPhotoUrl }] : undefined,
      variants: form.variants.length ? form.variants : undefined,
      addons: form.addons.length ? form.addons : undefined,
    };
    if (editingItem) {
      updateItem.mutate({ id: editingItem._id, body });
    } else {
      createItem.mutate(body);
    }
  }

  const saving = createItem.isPending || updateItem.isPending;

  return (
    <AppShell>
      {/* ── Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
          <p className="text-sm text-muted-foreground">
            Manage dishes, prices, variants, and availability.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5 self-start sm:self-auto">
          <IconPlus className="size-4" />
          Add Item
        </Button>
      </div>

      {/* ── Search + category filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter === null ? "default" : "outline"}
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <IconToolsKitchen2 className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No menu items yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add your first dish to start accepting orders.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-1.5">
            <IconPlus className="size-4" />
            Add First Item
          </Button>
        </div>
      )}

      {/* ── No results */}
      {!isLoading && items.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No items match your search.
        </div>
      )}

      {/* ── Item grid, grouped by category */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([cat, catItems]) => (
            <section key={cat}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {cat}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    confirmDeleteId={confirmDeleteId}
                    deletePending={deleteItem.isPending}
                    onEdit={() => openEdit(item)}
                    onToggleAvail={() =>
                      toggleAvail.mutate({ id: item._id, available: !item.available })
                    }
                    onDeleteRequest={() => setConfirmDeleteId(item._id)}
                    onDeleteConfirm={() => deleteItem.mutate(item._id)}
                    onDeleteCancel={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="flex max-h-[90dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 pb-4 pt-6 shrink-0">
            <DialogTitle>{editingItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? `Editing "${editingItem.name}"` : "Fill in the details for a new dish."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Left column */}
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="item-name">Name *</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g. Jollof Rice"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="item-category">Category *</Label>
                  <Input
                    id="item-category"
                    placeholder="e.g. Mains, Drinks, Sides"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {["Starters", "Mains", "Sides", "Drinks", "Desserts", "Specials"].map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="item-desc">Description</Label>
                  <Textarea
                    id="item-desc"
                    placeholder="Short description shown to customers"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>

                {/* Base price */}
                <div className="space-y-1.5">
                  <Label htmlFor="item-price">Base Price (₦) *</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min={0}
                    step={50}
                    placeholder="0"
                    value={form.basePrice}
                    onChange={(e) => setField("basePrice", e.target.value)}
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Available</p>
                      <p className="text-xs text-muted-foreground">Visible to customers</p>
                    </div>
                    <Switch
                      checked={form.available}
                      onCheckedChange={(v) => setField("available", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Allow Prep Notes</p>
                      <p className="text-xs text-muted-foreground">Customer can add a note</p>
                    </div>
                    <Switch
                      checked={form.prepNoteAllowed}
                      onCheckedChange={(v) => setField("prepNoteAllowed", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Photo picker — tabbed Upload / URL */}
                <div className="space-y-2">
                  <Label>Photo</Label>

                  {/* Tab switcher */}
                  <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
                    <button
                      type="button"
                      onClick={() => setField("photoTab", "upload")}
                      className={[
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        form.photoTab === "upload"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      <IconUpload className="size-3.5" /> Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setField("photoTab", "url")}
                      className={[
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        form.photoTab === "url"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      <IconLink className="size-3.5" /> URL
                    </button>
                  </div>

                  {/* Upload tab */}
                  {form.photoTab === "upload" && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {form.photoPreview ? (
                        <div className="relative overflow-hidden rounded-xl border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={form.photoPreview}
                            alt="preview"
                            className="h-40 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setForm((p) => ({ ...p, photoPreview: null }));
                              setPhotoFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                          >
                            <IconX className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 rounded-lg bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm hover:bg-background"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
                        >
                          <IconUpload className="size-6" />
                          <span className="text-sm font-medium">Click to upload</span>
                          <span className="text-xs">PNG, JPG, WEBP up to 5 MB</span>
                        </button>
                      )}
                      {photoFile && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {photoFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* URL tab */}
                  {form.photoTab === "url" && (
                    <div className="space-y-2">
                      <Input
                        placeholder="https://example.com/photo.jpg"
                        value={form.photoUrl}
                        onChange={(e) => setField("photoUrl", e.target.value)}
                      />
                      {form.photoUrl.trim() && (
                        <div className="overflow-hidden rounded-xl border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={form.photoUrl}
                            alt="preview"
                            className="h-40 w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).closest("div")!.remove();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Variants */}
                <VariantsEditor
                  variants={form.variants}
                  onChange={(v) => setField("variants", v)}
                />

                {/* Addons */}
                <AddonsEditor
                  addons={form.addons}
                  onChange={(a) => setField("addons", a)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t px-6 py-4 shrink-0">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
              {saving && <IconLoader className="size-4 animate-spin" />}
              {editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

// ─── Menu Item Card ────────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  confirmDeleteId,
  deletePending,
  onEdit,
  onToggleAvail,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  item: MenuItem;
  confirmDeleteId: string | null;
  deletePending: boolean;
  onEdit: () => void;
  onToggleAvail: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}) {
  const photo = item.photos?.[0]?.url ?? null;
  const isConfirming = confirmDeleteId === item._id;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm">
      {/* Photo */}
      <div className="relative h-36 w-full shrink-0 bg-muted">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={item.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <IconPhoto className="size-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Available badge */}
        <span
          className={[
            "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            item.available
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/15 text-red-600 dark:text-red-400",
          ].join(" ")}
        >
          {item.available ? "Available" : "Sold Out"}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold leading-snug">{item.name}</h3>
            <p className="shrink-0 text-sm font-bold text-primary">
              {formatMoney(item.basePrice)}
            </p>
          </div>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(item.variants?.length ?? 0) > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {item.variants!.length} variant{item.variants!.length !== 1 ? "s" : ""}
              </span>
            )}
            {(item.addons?.length ?? 0) > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {item.addons!.length} addon{item.addons!.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        {isConfirming ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="flex-1 text-xs text-destructive">Delete this item?</p>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={onDeleteConfirm}
              disabled={deletePending}
            >
              Delete
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onDeleteCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Switch
                checked={item.available}
                onCheckedChange={onToggleAvail}
                aria-label="Toggle availability"
              />
              <span className="text-xs text-muted-foreground">
                {item.available ? "On menu" : "Off menu"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="size-8 p-0"
                onClick={onEdit}
                aria-label="Edit"
              >
                <IconPencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={onDeleteRequest}
                aria-label="Delete"
              >
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Variants Editor ───────────────────────────────────────────────────────────

function VariantsEditor({ variants, onChange }: { variants: Variant[]; onChange: (v: Variant[]) => void }) {
  function addVariant() {
    onChange([...variants, { name: "", options: [{ name: "", price: 0 }] }]);
  }
  function removeVariant(vi: number) {
    onChange(variants.filter((_, i) => i !== vi));
  }
  function updateVariantName(vi: number, name: string) {
    onChange(variants.map((v, i) => (i === vi ? { ...v, name } : v)));
  }
  function addOption(vi: number) {
    onChange(
      variants.map((v, i) =>
        i === vi ? { ...v, options: [...v.options, { name: "", price: 0 }] } : v,
      ),
    );
  }
  function removeOption(vi: number, oi: number) {
    onChange(
      variants.map((v, i) =>
        i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v,
      ),
    );
  }
  function updateOption(vi: number, oi: number, field: keyof VariantOption, val: string) {
    onChange(
      variants.map((v, i) =>
        i === vi
          ? {
              ...v,
              options: v.options.map((o, j) =>
                j === oi ? { ...o, [field]: field === "price" ? parseFloat(val) || 0 : val } : o,
              ),
            }
          : v,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Variants</Label>
        <Button type="button" size="sm" variant="ghost" onClick={addVariant} className="h-7 gap-1 text-xs">
          <IconCirclePlus className="size-3.5" /> Add Variant
        </Button>
      </div>
      {variants.map((variant, vi) => (
        <div key={vi} className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Variant name (e.g. Size)"
              value={variant.name}
              onChange={(e) => updateVariantName(vi, e.target.value)}
              className="h-8 flex-1 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="size-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeVariant(vi)}
            >
              <IconX className="size-3.5" />
            </Button>
          </div>
          <div className="space-y-1.5 pl-2">
            {variant.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <Input
                  placeholder="Option name"
                  value={opt.name}
                  onChange={(e) => updateOption(vi, oi, "name", e.target.value)}
                  className="h-7 flex-1 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={opt.price}
                  onChange={(e) => updateOption(vi, oi, "price", e.target.value)}
                  className="h-7 w-24 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="size-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOption(vi, oi)}
                >
                  <IconX className="size-3" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addOption(vi)}
              className="h-6 gap-1 text-xs text-muted-foreground"
            >
              <IconPlus className="size-3" /> Add option
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Addons Editor ────────────────────────────────────────────────────────────

function AddonsEditor({ addons, onChange }: { addons: Addon[]; onChange: (a: Addon[]) => void }) {
  function addAddon() {
    onChange([...addons, { name: "", price: 0 }]);
  }
  function removeAddon(i: number) {
    onChange(addons.filter((_, j) => j !== i));
  }
  function updateAddon(i: number, field: keyof Addon, val: string) {
    onChange(
      addons.map((a, j) =>
        j === i ? { ...a, [field]: field === "price" ? parseFloat(val) || 0 : val } : a,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Add-ons</Label>
        <Button type="button" size="sm" variant="ghost" onClick={addAddon} className="h-7 gap-1 text-xs">
          <IconCirclePlus className="size-3.5" /> Add Add-on
        </Button>
      </div>
      {addons.map((addon, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Add-on name (e.g. Extra sauce)"
            value={addon.name}
            onChange={(e) => updateAddon(i, "name", e.target.value)}
            className="h-8 flex-1 text-sm"
          />
          <Input
            type="number"
            placeholder="Price"
            value={addon.price}
            onChange={(e) => updateAddon(i, "price", e.target.value)}
            className="h-8 w-24 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="size-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeAddon(i)}
          >
            <IconX className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
