"use client";

import api from "@/lib/api";
import { Category } from "@/lib/types";
import { Edit, Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    parent_id: null as string | null,
    image_url: "",
    sort_order: 0,
    is_active: true,
  });

  const fetchCategories = () => {
    api
      .get("/admin/categories")
      .then(({ data }) => {
        if (data.success) setCategories(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---------------- IMAGE UPLOAD ----------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "categories");

      const { data } = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        setForm({ ...form, image_url: data.data.url });
        toast.success("Image uploaded!");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- CREATE / UPDATE ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = { ...form, parent_id: form.parent_id || null };

      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, payload);
        toast.success("Category updated!");
      } else {
        await api.post("/admin/categories", payload);
        toast.success("Category created!");
      }

      setShowForm(false);
      setEditing(null);
      setForm({
        name: "",
        description: "",
        parent_id: null,
        image_url: "",
        sort_order: 0,
        is_active: true,
      });

      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  // ---------------- EDIT ----------------
  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description,
      parent_id: cat.parent_id,
      image_url: cat.image_url,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setShowForm(true);
  };

  // ---------------- SINGLE DELETE ----------------
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    try {
      await api.delete(`/admin/categories/${id}`);

      toast.success("Deleted!");

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  // ---------------- SELECT TOGGLE ----------------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  // ---------------- SELECT ALL ----------------
  const toggleSelectAll = () => {
    if (selectedIds.length === categories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(categories.map((c) => c.id));
    }
  };

  // ---------------- BULK DELETE ----------------
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("No categories selected");
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} categories?`)) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          api.delete(`/admin/categories/${id}`)
        )
      );

      setCategories((prev) =>
        prev.filter((c) => !selectedIds.includes(c.id))
      );

      setSelectedIds([]);

      toast.success("Deleted successfully!");
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>

        <div className="flex items-center">
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm({
                name: "",
                description: "",
                parent_id: null,
                image_url: "",
                sort_order: 0,
                is_active: true,
              });
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-secondary ml-3"
            >
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Edit" : "Create"} Category
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="input-field"
              placeholder="Name"
              required
            />

            <select
              value={form.parent_id || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  parent_id: e.target.value || null,
                })
              }
              className="input-field"
            >
              <option value="">None (Top Level)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input-field"
              placeholder="Description"
            />

            <div className="flex gap-3 items-center">
              {form.image_url && (
                <img
                  src={form.image_url}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}

              <label className="btn-secondary cursor-pointer text-sm">
                <Upload className="w-4 h-4" />{" "}
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <button className="btn-primary">
              {editing ? "Update" : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === categories.length &&
                    categories.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>

              <th className="text-left p-3">Image</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Parent</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cat.id)}
                    onChange={() => toggleSelect(cat.id)}
                  />
                </td>

                <td className="p-3">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      className="w-10 h-10 rounded"
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </td>

                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-gray-400">{cat.slug}</td>

                <td className="p-3 text-gray-400">
                  {cat.parent_id
                    ? categories.find(
                        (c) => c.id === cat.parent_id
                      )?.name || "-"
                    : "-"}
                </td>

                <td className="p-3">
                  {cat.is_active ? "Active" : "Inactive"}
                </td>

                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(cat)}>
                    <Edit className="w-4 h-4" />
                  </button>

                  <button onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
