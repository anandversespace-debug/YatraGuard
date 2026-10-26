import { useEffect, useState } from "react";
import { Phone, MessageSquare, Plus, Trash2, Users } from "lucide-react";
import { EMERGENCY_CONTACTS, type EmergencyContact } from "@/lib/mock-data";
import { loadContacts, saveContacts } from "@/lib/sos-service";

export function EmergencyContactList() {
  const [contacts, setContacts] = useState<EmergencyContact[]>(EMERGENCY_CONTACTS);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", relation: "Family", phone: "" });

  useEffect(() => {
    setContacts(loadContacts(EMERGENCY_CONTACTS));
  }, []);

  const persist = (next: EmergencyContact[]) => {
    setContacts(next);
    saveContacts(next);
  };

  const add = () => {
    if (!draft.name.trim() || !draft.phone.trim()) return;
    const next = [
      ...contacts,
      { id: `c${Date.now()}`, name: draft.name.trim(), relation: draft.relation, phone: draft.phone.trim() },
    ];
    persist(next);
    setDraft({ name: "", relation: "Family", phone: "" });
    setAdding(false);
  };

  const remove = (id: string) => persist(contacts.filter((c) => c.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> Trusted circle
        </p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-[11px] font-medium text-primary flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add contact
        </button>
      </div>

      {adding && (
        <div className="mb-2 rounded-2xl p-3 bg-card border border-border space-y-2">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Name"
            className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm"
          />
          <div className="flex gap-2">
            <select
              value={draft.relation}
              onChange={(e) => setDraft({ ...draft, relation: e.target.value })}
              className="h-9 px-2 rounded-lg bg-background border border-border text-sm flex-1"
            >
              {["Family", "Roommate", "Friend", "Partner", "Colleague"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="+91 9xxxx xxxxx"
              className="h-9 px-3 rounded-lg bg-background border border-border text-sm flex-1"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded-lg border border-border">
              Cancel
            </button>
            <button onClick={add} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold">
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="rounded-2xl p-3 bg-card border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-info/20 text-info flex items-center justify-center font-semibold">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.relation} • {c.phone}</p>
            </div>
            <a
              href={`tel:${c.phone.replace(/\s+/g, "")}`}
              className="h-9 w-9 rounded-xl bg-safe/15 text-safe flex items-center justify-center"
              aria-label="Call"
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`sms:${c.phone.replace(/\s+/g, "")}`}
              className="h-9 w-9 rounded-xl bg-info/15 text-info flex items-center justify-center"
              aria-label="Message"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
            <button
              onClick={() => remove(c.id)}
              className="h-9 w-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}