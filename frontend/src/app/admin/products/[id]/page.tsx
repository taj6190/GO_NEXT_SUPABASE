"use client";

import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { ArrowLeft, ChevronDown, Eye, Plus, Trash2, Upload, Wand2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface OptionValueForm {
  id?: string;
  value: string;
  color_hex: string;
}

interface OptionGroupForm {
  name: string;
  values: OptionValueForm[];
}

interface SpecRow {
  id: string;
  name: string;
  value: string;
}

interface VariantOverride {
  sku: string;
  price: string;
  discount_price: string;
  stock_quantity: number;
  weight: string;
  is_active: boolean;
}

type ComboPick = { group_name: string; option_value_id: string; value: string };

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateSKU(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${rand}`;
}

function slugPart(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8) || "v";
}

function comboKeyFromPicks(picks: ComboPick[]): string {
  return [...picks]
    .sort((a, b) => a.group_name.localeCompare(b.group_name))
    .map((p) => `${p.group_name}=${p.value}`)
    .join("|");
}

function comboLabelOrdered(picks: ComboPick[]): string {
  return picks.map((p) => p.value).join(" · ");
}

function cartesianCombos(axes: ComboPick[][]): ComboPick[][] {
  if (axes.length === 0 || axes.some((a) => a.length === 0)) return [];
  return axes.reduce<ComboPick[][]>(
    (acc, axis) => acc.flatMap((prefix) => axis.map((pick) => [...prefix, pick])),
    [[]]
  );
}

function combosFromProduct(product: Product): ComboPick[][] {
  const groups = (product.option_groups || []).filter((g) => g.name?.trim() && (g.values?.length || 0) > 0);
  const axes: ComboPick[][] = groups.map((g) =>
    (g.values || [])
      .filter((v) => v.value?.trim() && v.id)
      .map((v) => ({
        group_name: g.name,
        option_value_id: v.id,
        value: v.value,
      }))
  );
  return cartesianCombos(axes);
}

function overridesFromProduct(product: Product): Record<string, VariantOverride> {
  const out: Record<string, VariantOverride> = {};
  for (const v of product.variants || []) {
    if (!v.options?.length) continue;
    const picks: ComboPick[] = v.options.map((o) => ({
      group_name: o.group_name,
      option_value_id: o.option_value_id,
      value: o.value_name,
    }));
    out[comboKeyFromPicks(picks)] = {
      sku: v.sku,
      price: String(v.price ?? ""),
      discount_price: String(v.discount_price ?? ""),
      stock_quantity: v.stock_quantity,
      weight: String(v.weight ?? ""),
      is_active: v.is_active,
    };
  }
  return out;
}

function buildVariantsPayload(
  product: Product,
  overrides: Record<string, VariantOverride>,
  defaults: { sku: string; price: string; discount_price: string; stock_quantity: number; weight: string }
): Record<string, unknown>[] {
  const combos = combosFromProduct(product);
  return combos.map((picks, i) => {
    const key = comboKeyFromPicks(picks);
    const o = overrides[key];
    const labelSlug = slugPart(picks.map((p) => p.value).join("-"));
    const fallbackSku = `${defaults.sku}-${labelSlug}-${i + 1}`.slice(0, 95);
    return {
      sku: (o?.sku || fallbackSku).slice(0, 100),
      price: parseFloat(o?.price || defaults.price) || 0,
      discount_price: parseFloat(o?.discount_price || defaults.discount_price) || 0,
      stock_quantity: o?.stock_quantity ?? defaults.stock_quantity,
      weight: parseFloat(o?.weight || defaults.weight) || 0,
      is_active: o?.is_active !== false,
      sort_order: i,
      option_values: picks.map((p) => p.option_value_id),
      image_urls: [] as string[],
    };
  });
}

function specRowsFromAttributes(attrs: Record<string, unknown> | undefined): SpecRow[] {
  if (!attrs || typeof attrs !== "object") return [];
  return Object.entries(attrs).map(([name, value], i) => ({
    id: `spec-${i}-${name}`,
    name,
    value: String(value ?? ""),
  }));
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new" || !id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [previewSlug, setPreviewSlug] = useState("");
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [variantOverrides, setVariantOverrides] = useState<Record<string, VariantOverride>>({});
  const [showStoreLink, setShowStoreLink] = useState(false);
  const [showExtraSpecs, setShowExtraSpecs] = useState(false);

  const [form, setForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    description: "",
    short_description: "",
    price: "",
    discount_price: "",
    stock_quantity: 0,
    sku: "",
    is_active: true,
    is_featured: false,
    weight: "",
  });

  const handleNameChange = useCallback(
    (name: string) => {
      setForm((prev) => {
        const updates: Record<string, unknown> = { name };
        if (!slugManual) {
          const slug = generateSlug(name);
          updates.slug = slug;
          setPreviewSlug(slug);
        }
        if (isNew && !prev.sku) {
          updates.sku = generateSKU(name);
        }
        return { ...prev, ...updates } as typeof prev;
      });
    },
    [slugManual, isNew]
  );

  useEffect(() => {
    api.get("/admin/categories").then(({ data }) => data.success && setCategories(data.data || []));
    if (!isNew) {
      setLoading(true);
      api
        .get(`/admin/products/${id}`)
        .then(({ data }) => {
          if (data.success) {
            const p: Product = data.data;
            setForm({
              category_id: p.category_id,
              name: p.name,
              slug: p.slug,
              description: p.description,
              short_description: p.short_description,
              price: p.price,
              discount_price: p.discount_price,
              stock_quantity: p.stock_quantity,
              sku: p.sku,
              is_active: p.is_active,
              is_featured: p.is_featured,
              weight: p.weight,
            });
            setPreviewSlug(p.slug);
            setSlugManual(true);
            setImages(p.images?.map((i) => i.image_url) || []);
            const loadedSpecs = specRowsFromAttributes(p.attributes as Record<string, unknown> | undefined);
            setSpecRows(loadedSpecs);
            if (loadedSpecs.length > 0) setShowExtraSpecs(true);
            const hasOg = p.option_groups && p.option_groups.length > 0;
            const hasVar = p.variants && p.variants.length > 0;
            if (hasOg || hasVar) {
              setShowVariants(true);
              setOptionGroups(
                (p.option_groups || []).map((g) => ({
                  name: g.name,
                  values:
                    g.values?.map((v) => ({
                      id: v.id,
                      value: v.value,
                      color_hex: v.color_hex || "",
                    })) || [],
                }))
              );
              setVariantOverrides(overridesFromProduct(p));
            }
          }
        })
        .catch(() => toast.error("Product not found"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const comboPreview = useMemo(() => {
    if (!showVariants) return [];
    const cleaned = optionGroups.filter((g) => g.name.trim() && g.values.some((v) => v.value.trim()));
    const axes: ComboPick[][] = cleaned.map((g) =>
      g.values
        .filter((v) => v.value.trim())
        .map((v) => ({
          group_name: g.name,
          option_value_id: v.id || `pending:${g.name}:${v.value}`,
          value: v.value,
        }))
    );
    return cartesianCombos(axes);
  }, [optionGroups, showVariants]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("image", files[i]);
      formData.append("folder", "products");
      try {
        const { data } = await api.post("/admin/upload", formData);
        if (data.success && data.data.url) setImages((prev) => [...prev, data.data.url]);
      } catch {
        toast.error("Upload failed");
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const addSpecRow = () => setSpecRows((rows) => [...rows, { id: `spec-${Date.now()}`, name: "", value: "" }]);
  const removeSpecRow = (rid: string) => setSpecRows((rows) => rows.filter((r) => r.id !== rid));

  const addOptionGroup = () => setOptionGroups((g) => [...g, { name: "", values: [{ value: "", color_hex: "" }] }]);
  const removeOptionGroup = (i: number) => setOptionGroups((g) => g.filter((_, j) => j !== i));
  const addOptionValue = (gi: number) => {
    setOptionGroups((groups) => {
      const next = [...groups];
      next[gi] = { ...next[gi], values: [...next[gi].values, { value: "", color_hex: "" }] };
      return next;
    });
  };
  const removeOptionValue = (gi: number, vi: number) => {
    setOptionGroups((groups) => {
      const next = [...groups];
      next[gi] = { ...next[gi], values: next[gi].values.filter((_, j) => j !== vi) };
      return next;
    });
  };

  const applyPreset = (preset: "color" | "size" | "both") => {
    setShowVariants(true);
    if (preset === "color") {
      setOptionGroups([{ name: "Color", values: [{ value: "", color_hex: "#6366f1" }] }]);
    } else if (preset === "size") {
      setOptionGroups([{ name: "Size", values: [{ value: "", color_hex: "" }] }]);
    } else {
      setOptionGroups([
        { name: "Color", values: [{ value: "", color_hex: "#6366f1" }] },
        { name: "Size", values: [{ value: "", color_hex: "" }] },
      ]);
    }
  };

  const updateVariantOverride = (key: string, patch: Partial<VariantOverride>) => {
    setVariantOverrides((prev) => ({
      ...prev,
      [key]: {
        sku: patch.sku ?? prev[key]?.sku ?? "",
        price: patch.price ?? prev[key]?.price ?? form.price,
        discount_price: patch.discount_price ?? prev[key]?.discount_price ?? form.discount_price,
        stock_quantity: patch.stock_quantity ?? prev[key]?.stock_quantity ?? form.stock_quantity,
        weight: patch.weight ?? prev[key]?.weight ?? form.weight,
        is_active: patch.is_active ?? prev[key]?.is_active ?? true,
      },
    }));
  };

  const getOverride = (key: string): VariantOverride => {
    const o = variantOverrides[key];
    return {
      sku: o?.sku ?? "",
      price: o?.price ?? form.price,
      discount_price: o?.discount_price ?? form.discount_price,
      stock_quantity: o?.stock_quantity ?? form.stock_quantity,
      weight: o?.weight ?? form.weight,
      is_active: o?.is_active !== false,
    };
  };

  const reorderImages = (from: number, to: number) => {
    setImages((imgs) => {
      const next = [...imgs];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const buildBasePayload = () => {
    const attrs: Record<string, string> = {};
    for (const row of specRows) {
      const k = row.name.trim();
      const v = row.value.trim();
      if (k && v) attrs[k] = v;
    }
    return {
      ...form,
      price: parseFloat(form.price) || 0,
      discount_price: parseFloat(form.discount_price) || 0,
      weight: parseFloat(form.weight) || 0,
      stock_quantity: form.stock_quantity,
      image_urls: images,
      attributes: attrs,
    };
  };

  const syncVariantsForProductId = async (productId: string) => {
    const { data } = await api.get(`/admin/products/${productId}`);
    if (!data.success || !data.data) {
      toast.error("Could not load product to save versions");
      return;
    }
    const fresh: Product = data.data;
    const variants = buildVariantsPayload(fresh, variantOverrides, {
      sku: form.sku,
      price: form.price,
      discount_price: form.discount_price,
      stock_quantity: form.stock_quantity,
      weight: form.weight,
    });
    if (variants.length === 0) return;
    await api.put(`/admin/products/${productId}`, { variants });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.category_id) {
      toast.error("Please select a category");
      return;
    }

    const cleanedGroups = optionGroups
      .filter((g) => g.name.trim())
      .map((g, i) => ({
        name: g.name,
        sort_order: i,
        values: g.values
          .filter((v) => v.value.trim())
          .map((v, j) => ({ value: v.value, color_hex: v.color_hex, sort_order: j })),
      }))
      .filter((g) => g.values.length > 0);

    if (showVariants && cleanedGroups.length === 0) {
      toast.error('Add at least one choice (e.g. Color) with values, or turn off "Product has versions".');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...buildBasePayload() };
      if (showVariants && cleanedGroups.length > 0) {
        payload.option_groups = cleanedGroups;
      }

      let productId = String(id);

      if (isNew) {
        const { data } = await api.post("/admin/products", payload);
        if (!data.success || !data.data?.id) {
          toast.error(data.error || "Failed to create product");
          return;
        }
        productId = data.data.id;
        toast.success("Product created");
      } else {
        await api.put(`/admin/products/${id}`, payload);
        toast.success("Product updated");
      }

      if (showVariants && cleanedGroups.length > 0) {
        try {
          await syncVariantsForProductId(productId);
          toast.success("Version prices & stock saved");
        } catch (ve: unknown) {
          const err = ve as { response?: { data?: { error?: string } } };
          toast.error(err.response?.data?.error || "Product saved, but versions failed — try Save again.");
        }
      }

      router.push("/admin/products");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const lbl = "block text-[11px] font-medium text-[var(--text-muted)] mb-0.5";
  const field = "input-field py-1.5 text-sm";

  if (loading) {
    return (
      <div className="max-w-3xl space-y-3">
        <div className="skeleton h-7 w-40 rounded-md" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl page-enter pb-16">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/admin/products"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            aria-label="Back to products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight">{isNew ? "New product" : "Edit product"}</h1>
            {previewSlug && <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">/products/{previewSlug}</p>}
          </div>
        </div>
        {!isNew && form.slug && (
          <Link href={`/products/${form.slug}`} target="_blank" className="btn-secondary btn-sm shrink-0 !py-1.5 !px-2.5 text-xs gap-1">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 overflow-hidden divide-y divide-[var(--border)]">
        {/* Core */}
        <section className="p-4 space-y-3">
          <div>
            <label className={lbl}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={field}
              placeholder="Product name"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className={lbl}>Category *</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={field} required>
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${lbl} flex justify-between gap-2`}>
                <span>SKU *</span>
                {isNew && (
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, sku: generateSKU(prev.name || "PROD") }))} className="font-normal text-[var(--accent-light)] hover:underline">
                    <Wand2 className="w-3 h-3 inline" /> Suggest
                  </button>
                )}
              </label>
              <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={`${field} font-mono`} required />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className={lbl}>Price (৳) *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={field} required />
            </div>
            <div>
              <label className={lbl}>Sale (৳)</label>
              <input type="number" step="0.01" min="0" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} className={field} placeholder="—" />
            </div>
            <div>
              <label className={lbl}>Stock</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className={field} />
            </div>
            <div>
              <label className={lbl}>Weight (kg)</label>
              <input type="number" step="0.01" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={field} />
            </div>
          </div>

          <div>
            <label className={lbl}>Short line for cards</label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              className={field}
              maxLength={200}
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{form.short_description.length}/200</p>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} rows={3} placeholder="Details for the product page" />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-0.5">
            <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-3.5 h-3.5 accent-[var(--accent)] rounded" />
              Visible in store
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-3.5 h-3.5 accent-[var(--accent)] rounded" />
              Featured on home
            </label>
          </div>
        </section>

        {/* Store link — collapsible */}
        <section className="p-3">
          <button
            type="button"
            onClick={() => setShowStoreLink((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <span className="font-medium text-[var(--text-muted)]">Store link {!slugManual ? "(auto from name)" : "(custom)"}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showStoreLink ? "rotate-180" : ""}`} />
          </button>
          {showStoreLink && (
            <div className="mt-2 space-y-2 pl-1">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (slugManual) {
                      const slug = generateSlug(form.name);
                      setForm((prev) => ({ ...prev, slug }));
                      setPreviewSlug(slug);
                    }
                    setSlugManual(!slugManual);
                  }}
                  className="text-[10px] text-[var(--accent-light)] hover:underline"
                >
                  {slugManual ? "Use auto link" : "Edit link manually"}
                </button>
              </div>
              <input
                type="text"
                value={form.slug || previewSlug}
                onChange={(e) => {
                  setSlugManual(true);
                  const s = generateSlug(e.target.value);
                  setForm((prev) => ({ ...prev, slug: s }));
                  setPreviewSlug(s);
                }}
                readOnly={!slugManual}
                className={`${field} font-mono ${!slugManual ? "bg-[var(--bg-elevated)] text-[var(--text-muted)]" : ""}`}
              />
            </div>
          )}
        </section>

        {/* Specs — collapsible */}
        <section className="p-3">
          <button
            type="button"
            onClick={() => setShowExtraSpecs((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <span>
              <span className="font-medium text-[var(--text-muted)]">Extra details (specs)</span>
              {specRows.length > 0 && <span className="text-[var(--text-muted)]"> · {specRows.length} row{specRows.length !== 1 ? "s" : ""}</span>}
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showExtraSpecs ? "rotate-180" : ""}`} />
          </button>
          {showExtraSpecs && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] text-[var(--text-muted)] px-1">Shown on the product page as a simple list.</p>
              {specRows.map((row) => (
                <div key={row.id} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => setSpecRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: e.target.value } : r)))}
                    className={`${field} flex-1`}
                    placeholder="Label"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => setSpecRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))}
                    className={`${field} flex-1`}
                    placeholder="Value"
                  />
                  <button type="button" onClick={() => removeSpecRow(row.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] shrink-0" aria-label="Remove row">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSpecRow} className="text-[11px] text-[var(--accent-light)] hover:underline px-1 flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Add spec row
              </button>
            </div>
          )}
        </section>

        {/* Images */}
        <section className="p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Photos</span>
            <span className="text-[10px] text-[var(--text-muted)]">First = cover · hover image</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {images.filter(Boolean).map((url, i) => (
              <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-[var(--border)] group shrink-0">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5">
                  {i > 0 && (
                    <button type="button" onClick={() => reorderImages(i, 0)} className="h-6 w-6 rounded bg-white/25 text-[10px] text-white hover:bg-white/40" title="Cover">
                      ★
                    </button>
                  )}
                  <button type="button" onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))} className="h-6 w-6 rounded bg-red-500/85 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[var(--accent)] text-white text-[8px] text-center py-px font-semibold">1st</span>}
              </div>
            ))}
            <label className="h-16 w-16 rounded-lg border border-dashed border-[var(--border)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] shrink-0">
              <Upload className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-[9px] text-[var(--text-muted)]">{uploading ? "…" : "+"}</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </section>

        {/* Variants */}
        <section className="p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Options & versions</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-md">Same price for all? Leave defaults. Different sizes/colors? Turn on and fill the table — Save updates the shop.</p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-2.5 py-1.5">
              <input type="checkbox" checked={showVariants} onChange={(e) => setShowVariants(e.target.checked)} className="w-3.5 h-3.5 accent-[var(--accent)] rounded" />
              <span className="text-xs font-medium">Has options</span>
            </label>
          </div>

          {showVariants && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => applyPreset("color")} className="rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] hover:border-[var(--accent)]/50">
                  Color
                </button>
                <button type="button" onClick={() => applyPreset("size")} className="rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] hover:border-[var(--accent)]/50">
                  Size
                </button>
                <button type="button" onClick={() => applyPreset("both")} className="rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] hover:border-[var(--accent)]/50">
                  Color + size
                </button>
              </div>

              {optionGroups.map((group, gi) => (
                <div key={gi} className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]/80 p-2.5 space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        setOptionGroups((groups) => {
                          const next = [...groups];
                          next[gi] = { ...next[gi], name: e.target.value };
                          return next;
                        });
                      }}
                      placeholder="e.g. Color, Size"
                      className={`${field} flex-1`}
                    />
                    <button type="button" onClick={() => removeOptionGroup(gi)} className="p-1.5 rounded-md text-[var(--danger)] hover:bg-[var(--danger-bg)] shrink-0" aria-label="Remove group">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 pl-2 border-l border-[var(--border)] ml-1">
                    {group.values.map((val, vi) => (
                      <div key={vi} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={val.value}
                          onChange={(e) => {
                            setOptionGroups((groups) => {
                              const next = [...groups];
                              const vals = [...next[gi].values];
                              vals[vi] = { ...vals[vi], value: e.target.value };
                              next[gi] = { ...next[gi], values: vals };
                              return next;
                            });
                          }}
                          placeholder="e.g. Red, M"
                          className={`${field} flex-1`}
                        />
                        {group.name.toLowerCase().includes("color") && (
                          <input
                            type="color"
                            value={val.color_hex || "#6366f1"}
                            onChange={(e) => {
                              setOptionGroups((groups) => {
                                const next = [...groups];
                                const vals = [...next[gi].values];
                                vals[vi] = { ...vals[vi], color_hex: e.target.value };
                                next[gi] = { ...next[gi], values: vals };
                                return next;
                              });
                            }}
                            className="h-8 w-8 cursor-pointer rounded border border-[var(--border)] p-0.5 shrink-0"
                            title="Swatch"
                          />
                        )}
                        {group.values.length > 1 && (
                          <button type="button" onClick={() => removeOptionValue(gi, vi)} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addOptionValue(gi)} className="text-[11px] text-[var(--accent-light)] hover:underline pl-2">
                    + Add value
                  </button>
                </div>
              ))}

              <button type="button" onClick={addOptionGroup} className="w-full rounded-lg border border-dashed border-[var(--border)] py-1.5 text-[11px] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-tertiary)]">
                + Another option type
              </button>

              {comboPreview.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] overflow-hidden mt-1">
                  <div className="flex items-center justify-between gap-2 bg-[var(--bg-tertiary)] px-2.5 py-1.5 border-b border-[var(--border)]">
                    <span className="text-xs font-medium">Combinations ({comboPreview.length})</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Edit prices / stock per row</span>
                  </div>
                  <div className="overflow-x-auto max-h-[min(50vh,320px)] overflow-y-auto">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr className="text-left text-[10px] uppercase text-[var(--text-muted)] bg-[var(--bg-secondary)]">
                          <th className="px-2 py-1 font-medium">Mix</th>
                          <th className="px-2 py-1 font-medium w-[88px]">SKU</th>
                          <th className="px-2 py-1 font-medium w-[72px]">৳</th>
                          <th className="px-2 py-1 font-medium w-[72px]">Sale</th>
                          <th className="px-2 py-1 font-medium w-[56px]">Qty</th>
                          <th className="px-2 py-1 font-medium w-[36px] text-center">On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comboPreview.map((picks) => {
                          const key = comboKeyFromPicks(picks);
                          const vo = getOverride(key);
                          const pending = picks.some((p) => p.option_value_id.startsWith("pending:"));
                          return (
                            <tr key={key} className="border-t border-[var(--border)]">
                              <td className="px-2 py-1 align-top">
                                <span className="font-medium text-[var(--text-primary)]">{comboLabelOrdered(picks)}</span>
                                {pending && <span className="block text-[9px] text-amber-500 leading-tight mt-0.5">Save once to sync</span>}
                              </td>
                              <td className="px-2 py-0.5">
                                <input className={`${field} !py-1 font-mono text-[11px]`} value={vo.sku} placeholder="auto" onChange={(e) => updateVariantOverride(key, { ...vo, sku: e.target.value })} />
                              </td>
                              <td className="px-2 py-0.5">
                                <input type="number" step="0.01" className={`${field} !py-1 text-[11px]`} value={vo.price} onChange={(e) => updateVariantOverride(key, { ...vo, price: e.target.value })} />
                              </td>
                              <td className="px-2 py-0.5">
                                <input type="number" step="0.01" className={`${field} !py-1 text-[11px]`} value={vo.discount_price} onChange={(e) => updateVariantOverride(key, { ...vo, discount_price: e.target.value })} />
                              </td>
                              <td className="px-2 py-0.5">
                                <input type="number" min={0} className={`${field} !py-1 text-[11px]`} value={vo.stock_quantity} onChange={(e) => updateVariantOverride(key, { ...vo, stock_quantity: parseInt(e.target.value) || 0 })} />
                              </td>
                              <td className="px-2 py-1 text-center">
                                <input type="checkbox" checked={vo.is_active} onChange={(e) => updateVariantOverride(key, { ...vo, is_active: e.target.checked })} className="w-3.5 h-3.5 accent-[var(--accent)] rounded" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 p-3 bg-[var(--bg-tertiary)]/50">
          <button type="submit" disabled={saving} className="btn-primary !py-2 !px-4 text-sm flex-1 sm:flex-none">
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
          <Link href="/admin/products" className="btn-secondary !py-2 !px-3 text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
