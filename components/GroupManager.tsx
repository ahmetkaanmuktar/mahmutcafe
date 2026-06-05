"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface Member {
  id: string;
  username: string;
}

interface Group {
  id: string;
  name: string;
  ownerId: string;
  members: Member[];
  totalDebt: number;
  isOwner: boolean;
}

interface GroupManagerProps {
  onGroupChange: (groupId: string | null) => void;
  selectedGroupId: string | null;
}

export default function GroupManager({
  onGroupChange,
  selectedGroupId,
}: GroupManagerProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiFetch<{ groups: Group[] }>("/api/groups");
      setGroups(data.groups);
      if (data.groups.length > 0 && !selectedGroupId) {
        onGroupChange(data.groups[0].id);
      }
    } catch {
      /* ignore */
    }
  }, [selectedGroupId, onGroupChange]);

  const loadInvitations = useCallback(async () => {
    try {
      const data = await apiFetch<{ invitations: any[] }>("/api/invitations");
      setInvitations(data.invitations);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadInvitations();
  }, [loadGroups, loadInvitations]);

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ group: Group }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: newGroupName }),
      });
      setGroups((prev) => [...prev, data.group]);
      onGroupChange(data.group.id);
      setNewGroupName("");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await apiFetch<{ users: Member[] }>(
        `/api/users/search?q=${encodeURIComponent(q)}`
      );
      setSearchResults(data.users);
    } catch {
      setSearchResults([]);
    }
  };

  const addMember = async (userId: string) => {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ message?: string; members?: Member[] }>(
        `/api/groups/${selectedGroupId}/members`,
        { method: "POST", body: JSON.stringify({ userId }) }
      );
      if (data.members) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroupId ? { ...g, members: data.members! } : g
          )
        );
      } else if (data.message) {
        alert(data.message); // e.g. "Davet gönderildi"
      }
      setSearchQuery("");
      setSearchResults([]);
      setShowAddMember(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invId: string, action: "accept" | "reject") => {
    try {
      await apiFetch(`/api/invitations/${invId}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setInvitations((prev) => prev.filter((i) => i.id !== invId));
      if (action === "accept") {
        loadGroups();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "İşlem başarısız");
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="space-y-4">
      {invitations.length > 0 && (
        <div className="card border-cafe-accent bg-cafe-surface">
          <h3 className="font-semibold text-cafe-accent mb-2">Gelen Davetler</h3>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex justify-between items-center bg-cafe-card p-3 rounded-xl border border-cafe-border">
                <div className="text-sm">
                  <span className="font-medium text-cafe-text">@{inv.inviterUsername}</span> sizi
                  <span className="font-bold text-cafe-accent"> {inv.groupName} </span> grubuna davet ediyor.
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleInvitation(inv.id, "accept")} className="text-xs bg-cafe-accent text-cafe-bg px-3 py-1.5 rounded-lg font-bold">Kabul</button>
                  <button onClick={() => handleInvitation(inv.id, "reject")} className="text-xs bg-cafe-border text-cafe-textMuted px-3 py-1.5 rounded-lg font-medium">Reddet</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-cafe-text">Gruplar</h2>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="text-sm text-cafe-text hover:text-cafe-text font-medium"
        >
          + Yeni Grup
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-cafe-textMuted text-sm text-center py-4">
          Henüz grup yok. Arkadaşlarınla bir grup oluştur!
        </p>
      ) : (
        <div className="flex gap-2 flex-wrap mb-3">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onGroupChange(g.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedGroupId === g.id
                  ? "bg-cafe-accent text-white"
                  : "bg-cafe-border text-cafe-text hover:bg-cafe-200"
              }`}
            >
              {g.name} ({g.totalDebt} TL)
            </button>
          ))}
        </div>
      )}

      {selectedGroup && (
        <div className="border-t border-cafe-border pt-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-cafe-text">
              {selectedGroup.members.length} üye
            </p>
            <button
              type="button"
              onClick={() => setShowAddMember(!showAddMember)}
              className="text-sm text-cafe-text hover:text-cafe-text"
            >
              + Arkadaş Ekle
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedGroup.members.map((m) => (
              <span
                key={m.id}
                className="px-2 py-1 rounded-lg bg-cafe-surface text-cafe-text text-xs"
              >
                @{m.username}
              </span>
            ))}
          </div>

          {showAddMember && (
            <div className="mt-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                placeholder="Kullanıcı adı ara..."
                className="w-full px-3 py-2 rounded-lg border border-cafe-border focus:outline-none focus:ring-2 focus:ring-cafe-400 text-sm"
              />
              {searchResults.length > 0 && (
                <ul className="mt-1 border border-cafe-border rounded-lg overflow-hidden">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => addMember(u.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-cafe-surface disabled:opacity-50"
                      >
                        @{u.username}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="mt-3 p-3 rounded-xl bg-cafe-surface border border-cafe-border">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Grup adı (ör: Mahmud Ekibi)"
            className="w-full px-3 py-2 rounded-lg border border-cafe-border focus:outline-none focus:ring-2 focus:ring-cafe-400 text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={createGroup}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Oluştur
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-sm"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
    </div>
  );
}
