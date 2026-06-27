import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { useCms, useContentDoc, useSaveDoc } from "@/lib/cms/CmsProvider";

/**
 * Dedicated FAQ editor (Phase 2 framework addition #2).
 *
 * Storage: single CMS key (e.g. "ai.faqs") holding a JSON array of FAQ items.
 * Each item shape:
 *   {
 *     q: string,
 *     a: string,
 *     details?: string[],
 *     media?: { type: "image" | "video", src: string, poster?: string, caption?: string },
 *     links?: { label: string, to?: string, href?: string }[]
 *   }
 *
 * Usage:
 *   <EditableFaqList
 *     id="ai.faqs"
 *     fallback={AI_FAQS}
 *     render={(items) => items.map((f, i) => (<FaqItem key={i} {...f} testid={`faq-${i}`} />))}
 *   />
 */

function MediaBlock({ media, onChange, onUpload }) {
  const m = media || { type: "image", src: "", poster: "", caption: "" };
  const set = (k, v) => onChange({ ...m, [k]: v });

  return (
    <div className="border border-brand-line rounded-lg p-3 bg-brand-sand/40 space-y-2">
      <div className="flex items-center gap-3 text-xs">
        <label className="font-semibold text-brand-muted">Type:</label>
        <select
          value={m.type || "image"}
          onChange={(e) => set("type", e.target.value)}
          className="border border-brand-line rounded px-2 py-1 text-xs"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        {m.src ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto text-xs text-red-600 hover:underline"
          >
            Remove media
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {m.type === "image" && m.src ? (
          <img src={m.src} alt="" className="w-12 h-12 rounded object-cover border border-brand-line" />
        ) : null}
        <input
          type="file"
          accept={m.type === "video" ? "video/*" : "image/*,video/*"}
          onChange={(e) => onUpload(e, (u) => set("src", u))}
          className="text-xs"
        />
        <input
          value={m.src || ""}
          onChange={(e) => set("src", e.target.value)}
          placeholder="or paste URL (incl. YouTube/Vimeo)"
          className="flex-1 border border-brand-line rounded-lg px-2 py-1 text-xs"
        />
      </div>
      {m.type === "video" ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-muted w-12">Poster:</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onUpload(e, (u) => set("poster", u))}
            className="text-xs"
          />
          <input
            value={m.poster || ""}
            onChange={(e) => set("poster", e.target.value)}
            placeholder="or paste poster URL"
            className="flex-1 border border-brand-line rounded-lg px-2 py-1 text-xs"
          />
        </div>
      ) : null}
      <input
        value={m.caption || ""}
        onChange={(e) => set("caption", e.target.value)}
        placeholder="Caption (optional)"
        className="w-full border border-brand-line rounded-lg px-2 py-1 text-xs"
      />
    </div>
  );
}

function LinksBlock({ links, onChange }) {
  const list = Array.isArray(links) ? links : [];
  const upd = (i, k, v) => onChange(list.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const add = () => onChange([...list, { label: "", to: "" }]);
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="border border-brand-line rounded-lg p-3 bg-brand-sand/40 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-brand-muted">Action links</span>
        <button type="button" onClick={add} className="text-brand-green font-semibold hover:underline">
          + Add link
        </button>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-brand-muted italic">No links yet.</p>
      ) : null}
      {list.map((l, i) => {
        const isExternal = !!l.href;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <input
              value={l.label || ""}
              onChange={(e) => upd(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1 border border-brand-line rounded px-2 py-1"
            />
            <select
              value={isExternal ? "href" : "to"}
              onChange={(e) => {
                const k = e.target.value;
                const v = l.to || l.href || "";
                onChange(list.map((x, idx) => (idx === i ? { label: l.label, [k]: v } : x)));
              }}
              className="border border-brand-line rounded px-1 py-1"
              title="Link type"
            >
              <option value="to">Internal</option>
              <option value="href">External</option>
            </select>
            <input
              value={l.to || l.href || ""}
              onChange={(e) => upd(i, isExternal ? "href" : "to", e.target.value)}
              placeholder={isExternal ? "https://…" : "/path"}
              className="flex-1 border border-brand-line rounded px-2 py-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-600 px-2 py-1 border border-brand-line rounded"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

function FaqEditorModal({ id, items, onClose }) {
  const cms = useCms();
  const saveDoc = useSaveDoc();
  const [list, setList] = useState(() =>
    items.map((it) => ({
      q: it.q || "",
      a: it.a || "",
      details: it.details ? [...it.details] : undefined,
      media: it.media ? { ...it.media } : undefined,
      links: it.links ? it.links.map((l) => ({ ...l })) : undefined,
    }))
  );
  const [busy, setBusy] = useState(false);

  const upd = (i, k, v) => setList((l) => l.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const add = () => setList((l) => [...l, { q: "", a: "" }]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const move = (i, dir) =>
    setList((l) => {
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const handleUpload = async (e, apply) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    try {
      const u = await cms.uploadMedia(f);
      apply(u);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      // Clean: trim empty links/details, drop empty media
      const cleaned = list.map((it) => {
        const out = { q: (it.q || "").trim(), a: (it.a || "").trim() };
        if (Array.isArray(it.details)) {
          const d = it.details.map((s) => (s || "").trim()).filter(Boolean);
          if (d.length) out.details = d;
        }
        if (it.media && (it.media.src || it.media.poster)) {
          out.media = { type: it.media.type || "image" };
          if (it.media.src) out.media.src = it.media.src;
          if (it.media.poster) out.media.poster = it.media.poster;
          if (it.media.caption) out.media.caption = it.media.caption;
        }
        if (Array.isArray(it.links)) {
          const ls = it.links
            .filter((l) => (l.label || "").trim() && ((l.to || "").trim() || (l.href || "").trim()))
            .map((l) => (l.href ? { label: l.label.trim(), href: l.href.trim() } : { label: l.label.trim(), to: l.to.trim() }));
          if (ls.length) out.links = ls;
        }
        return out;
      });
      await saveDoc(id, cleaned);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid={`faq-editor-${id}`}
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b border-brand-line z-10">
          <h3 className="font-semibold text-lg text-brand-ink">Edit FAQs</h3>
          <button
            onClick={add}
            data-testid={`faq-add-${id}`}
            className="text-sm px-3 py-1.5 rounded-lg bg-brand-green/10 text-brand-green font-semibold"
          >
            + Add FAQ
          </button>
        </div>

        {list.map((it, i) => (
          <div key={i} className="border border-brand-line rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs font-semibold text-brand-muted">FAQ #{i + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} className="text-xs px-2 py-1 border border-brand-line rounded">↑</button>
                <button onClick={() => move(i, 1)} className="text-xs px-2 py-1 border border-brand-line rounded">↓</button>
                <button onClick={() => remove(i)} data-testid={`faq-delete-${id}-${i}`} className="text-xs px-2 py-1 border border-brand-line rounded text-red-600">Delete</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-brand-muted">Question</label>
              <input
                value={it.q}
                onChange={(e) => upd(i, "q", e.target.value)}
                data-testid={`faq-q-${id}-${i}`}
                className="w-full border border-brand-line rounded-lg px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-brand-muted">Answer</label>
              <textarea
                value={it.a}
                onChange={(e) => upd(i, "a", e.target.value)}
                rows={3}
                data-testid={`faq-a-${id}-${i}`}
                className="w-full border border-brand-line rounded-lg px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-brand-muted">Extra paragraphs (one per line)</label>
              <textarea
                value={Array.isArray(it.details) ? it.details.join("\n") : ""}
                onChange={(e) => upd(i, "details", e.target.value.split("\n"))}
                rows={2}
                placeholder="Optional. Extra paragraphs shown below the answer."
                className="w-full border border-brand-line rounded-lg px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-brand-muted">Media (optional)</label>
              <MediaBlock
                media={it.media}
                onChange={(v) => upd(i, "media", v || undefined)}
                onUpload={handleUpload}
              />
            </div>

            <div>
              <LinksBlock links={it.links} onChange={(v) => upd(i, "links", v.length ? v : undefined)} />
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 sticky bottom-0 bg-white py-3 border-t border-brand-line">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-brand-line">Cancel</button>
          <button
            onClick={save}
            disabled={busy}
            data-testid={`save-${id}`}
            className="px-4 py-2 rounded-lg bg-brand-green text-white font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditableFaqList({ id, fallback = [], render }) {
  const cms = useCms();
  const items = useContentDoc(id, fallback);
  const [open, setOpen] = useState(false);
  const editable = cms && cms.editMode && cms.isAdmin && !cms.preview;

  return (
    <div className="relative">
      {editable ? (
        <button
          onClick={() => setOpen(true)}
          data-testid={`edit-${id}`}
          className="absolute right-0 -top-12 z-20 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white shadow"
        >
          <Pencil className="w-3 h-3" /> Edit FAQs
        </button>
      ) : null}
      {render(items)}
      {open ? (
        <FaqEditorModal id={id} items={items} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
