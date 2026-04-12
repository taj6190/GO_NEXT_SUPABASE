"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { User } from "@/lib/types";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/admin/users?page=${page}&limit=10&search=${search}`).then(({ data }) => {
      if (data.success) { setUsers(data.data || []); setTotal(data.meta?.total || 0); }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const updateRole = async (id: string, role: string) => {
    try { await api.put(`/admin/users/${id}`, { role }); toast.success("Role updated"); fetchUsers(); } catch { toast.error("Failed"); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await api.put(`/admin/users/${id}`, { is_active: !isActive }); toast.success("Updated"); fetchUsers(); } catch { toast.error("Failed"); }
  };

  return (
    <div className="page-enter">
      <h1 className="text-2xl font-bold mb-6">Users ({total})</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="input-field pl-10" />
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
            <th className="text-left py-3 px-4">Name</th><th className="text-left py-3 px-4">Email</th><th className="text-left py-3 px-4">Role</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]">
                <td className="py-3 px-4 font-medium">{u.full_name}</td>
                <td className="py-3 px-4 text-[var(--text-secondary)]">{u.email}</td>
                <td className="py-3 px-4"><select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="input-field py-1 px-2 text-xs w-24"><option value="user">User</option><option value="admin">Admin</option></select></td>
                <td className="py-3 px-4"><span className={`badge ${u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                <td className="py-3 px-4"><button onClick={() => toggleActive(u.id, u.is_active)} className="btn-secondary text-xs py-1 px-2">{u.is_active ? "Deactivate" : "Activate"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
