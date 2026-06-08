import React, { useState, useRef } from "react";
import { Pencil } from "lucide-react";
import { useCms, useContent } from "@/lib/cms/CmsProvider";

const EDIT_RING = { boxShadow: "0 0 0 1px rgba(16,185,129,0.45)" };

function PencilButton({ id, onOpen }) {
  return (
    <span
      role="button"
      tabIndex={0}
      data-testid={`edit-${id}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onOpen();
      }}
      className="absolute -top-2.5 -right-2.5 z-30 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow cursor-pointer opacity-0 group-hover/cms:opacity-100 transition"
    >
      <Pencil className="w-3 h-3" />
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-brand-ink mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ToolBtn({ onClick, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="px-2.5 py-1 text-sm rounded border border-brand-line hover:bg-brand-sand"
    >
      {children}
    </button>
  );
}

function TextFieldModal({ id, value, rich, multiline, onClose }) {
  const cms = useCms();
  const ref = useRef(null);
  const [text, setText] = useState(value || "");
  const [busy, setBusy] = useState(false);

  const cmd = (c, v) => {
    document.execCommand(c, false, v);
    ref.current && ref.current.focus();
  };

  const save = async () => {
    setBusy(true);
    try {
      const v = rich ? ref.current.innerHTML : text;
      await cms.saveField(id, rich ? "richtext" : "text", v);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit text" onClose={onClose}>
      {rich ? (
        <>
          <div className="flex gap-1 mb-2">
            <ToolBtn onClick={() => cmd("bold")}><b>B</b></ToolBtn>
            <ToolBtn onClick={() => cmd("italic")}><i>I</i></ToolBtn>
            <ToolBtn
              onClick={() => {
                const u = window.prompt("Link URL");
                if (u) cmd("createLink", u);
              }}
            >
              Link
            </ToolBtn>
            <ToolBtn onClick={() => cmd("insertUnorderedList")}>• List</ToolBtn>
          </div>
          <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            data-testid={`field-${id}`}
            className="min-h-[120px] border border-brand-line rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </>
      ) : multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          data-testid={`field-${id}`}
          className="w-full border border-brand-line rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      ) : (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid={`field-${id}`}
          className="w-full border border-brand-line rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-brand-line">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          data-testid={`save-${id}`}
          className="px-4 py-2 rounded-lg bg-brand-green text-white font-semibold disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function ImageModal({ id, value, onClose }) {
  const cms = useCms();
  const [url, setUrl] = useState(value || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const u = await cms.uploadMedia(f);
      setUrl(u);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await cms.saveField(id, "image", url);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit media" onClose={onClose}>
      {url ? (
        <img src={url} alt="" className="max-h-40 rounded-lg mb-3 object-contain border border-brand-line" />
      ) : null}
      <label className="block text-sm font-medium mb-1">Upload image / video</label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={onFile}
        data-testid={`upload-${id}`}
        className="mb-3 block text-sm"
      />
      <label className="block text-sm font-medium mb-1">or paste a URL (incl. YouTube/Vimeo)</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        data-testid={`field-${id}`}
        className="w-full border border-brand-line rounded-lg px-3 py-2 mb-3"
      />
      {err ? <p className="text-red-600 text-sm mb-2">{err}</p> : null}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-brand-line">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={busy}
          data-testid={`save-${id}`}
          className="px-4 py-2 rounded-lg bg-brand-green text-white font-semibold disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function ListModal({ id, items, fields, onClose, lockItems = false }) {
  const cms = useCms();
  const [list, setList] = useState(() => items.map((x) => ({ ...x })));
  const [busy, setBusy] = useState(false);

  // Dot-path helpers so a field key like "outcome.value" reads/writes
  // it.outcome = { value, label } without flattening the model.
  const getPath = (obj, path) => path.split(".").reduce((o, p) => (o == null ? o : o[p]), obj);
  const setPath = (obj, path, v) => {
    const parts = path.split(".");
    const next = Array.isArray(obj) ? [...obj] : { ...obj };
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      cur[p] = cur[p] && typeof cur[p] === "object" ? { ...cur[p] } : {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = v;
    return next;
  };

  const upd = (i, k, v) => setList((l) => l.map((it, idx) => (idx === i ? setPath(it, k, v) : it)));
  const add = () => setList((l) => [...l, Object.fromEntries(fields.map((f) => [f.key.split(".")[0], ""]))]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const move = (i, dir) =>
    setList((l) => {
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const onFile = async (i, k, e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    try {
      const u = await cms.uploadMedia(f);
      setList((l) => l.map((it, idx) => (idx === i ? setPath(it, k, u) : it)));
    } finally {
      setBusy(false);
    }
  };

  const lineKeys = fields.filter((f) => f.type === "lines").map((f) => f.key);
  const save = async () => {
    setBusy(true);
    try {
      const cleaned = list.map((it) => {
        let copy = { ...it };
        for (const k of lineKeys) {
          const v = getPath(copy, k);
          if (Array.isArray(v)) copy = setPath(copy, k, v.map((s) => s.trim()).filter(Boolean));
        }
        return copy;
      });
      await cms.saveField(id, "list", JSON.stringify(cleaned));
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid={`list-editor-${id}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-brand-ink">Edit items</h3>
          {!lockItems ? (
            <button
              onClick={add}
              data-testid={`list-add-${id}`}
              className="text-sm px-3 py-1.5 rounded-lg bg-brand-green/10 text-brand-green font-semibold"
            >
              + Add item
            </button>
          ) : null}
        </div>

        {list.map((it, i) => (
          <div key={i} className="border border-brand-line rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold text-brand-muted">#{i + 1}</span>
              {!lockItems ? (
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} className="text-xs px-2 py-1 border border-brand-line rounded">↑</button>
                  <button onClick={() => move(i, 1)} className="text-xs px-2 py-1 border border-brand-line rounded">↓</button>
                  <button onClick={() => remove(i)} className="text-xs px-2 py-1 border border-brand-line rounded text-red-600">Delete</button>
                </div>
              ) : null}
            </div>
            {fields.map((f) => {
              const val = getPath(it, f.key);
              return (
              <div key={f.key} className="mb-2">
                <label className="block text-xs font-medium mb-1 text-brand-muted">{f.label}</label>
                {f.type === "image" ? (
                  <div className="flex items-center gap-2">
                    {val ? (
                      <img src={val} alt="" className="w-10 h-10 rounded object-cover border border-brand-line" />
                    ) : null}
                    <input type="file" accept="image/*,video/*" onChange={(e) => onFile(i, f.key, e)} className="text-xs" />
                    <input
                      value={val || ""}
                      onChange={(e) => upd(i, f.key, e.target.value)}
                      placeholder="or paste URL"
                      className="flex-1 border border-brand-line rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                ) : f.type === "lines" ? (
                  <textarea
                    value={Array.isArray(val) ? val.join("\n") : (val || "")}
                    onChange={(e) => upd(i, f.key, e.target.value.split("\n"))}
                    rows={4}
                    placeholder="One item per line"
                    className="w-full border border-brand-line rounded-lg px-2 py-1.5 text-sm"
                  />
                ) : f.type === "bool" ? (
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={val === true || val === "true"}
                      onChange={(e) => upd(i, f.key, e.target.checked)}
                    />
                    <span className="text-brand-muted">{f.hint || "Enabled"}</span>
                  </label>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={val || ""}
                    onChange={(e) => upd(i, f.key, e.target.value)}
                    rows={3}
                    className="w-full border border-brand-line rounded-lg px-2 py-1.5 text-sm"
                  />
                ) : (
                  <input
                    value={val || ""}
                    onChange={(e) => upd(i, f.key, e.target.value)}
                    className="w-full border border-brand-line rounded-lg px-2 py-1.5 text-sm"
                  />
                )}
              </div>
              );
            })}
          </div>
        ))}

        <div className="flex justify-end gap-2 sticky bottom-0 bg-white py-3">
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

export function EditableText({ id, as: Tag = "span", fallback = "", rich = false, multiline = false, block = false, className = "", ...rest }) {
  const cms = useCms();
  const value = useContent(id, fallback);
  const [open, setOpen] = useState(false);
  const editable = cms && cms.editMode && cms.isAdmin && !cms.preview;

  const content = rich ? (
    <Tag className={className} {...rest} dangerouslySetInnerHTML={{ __html: value }} />
  ) : (
    <Tag className={className} {...rest}>
      {value}
    </Tag>
  );

  if (!editable) return content;

  const Wrapper = block ? "div" : "span";
  return (
    <Wrapper className={`relative group/cms rounded-[3px] ${block ? "block" : "inline-block"}`} style={EDIT_RING}>
      {content}
      <PencilButton id={id} onOpen={() => setOpen(true)} />
      {open ? (
        <TextFieldModal id={id} value={value} rich={rich} multiline={multiline} onClose={() => setOpen(false)} />
      ) : null}
    </Wrapper>
  );
}

export function EditableImage({ id, fallback, alt = "", block = false, className = "", ...rest }) {
  const cms = useCms();
  const src = useContent(id, fallback);
  const [open, setOpen] = useState(false);
  const editable = cms && cms.editMode && cms.isAdmin && !cms.preview;

  const img = <img src={src} alt={alt} className={className} {...rest} />;
  if (!editable) return img;

  const Wrapper = block ? "div" : "span";
  return (
    <Wrapper className={`relative group/cms rounded-[3px] ${block ? "block" : "inline-block"}`} style={EDIT_RING}>
      {img}
      <PencilButton id={id} onOpen={() => setOpen(true)} />
      {open ? <ImageModal id={id} value={src} onClose={() => setOpen(false)} /> : null}
    </Wrapper>
  );
}

export function EditableList({ id, fallback = [], fields, render, lockItems = false }) {
  const cms = useCms();
  const raw = useContent(id, null);
  const [open, setOpen] = useState(false);
  const editable = cms && cms.editMode && cms.isAdmin && !cms.preview;

  let items = fallback;
  if (raw != null) {
    try {
      items = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      items = fallback;
    }
  }

  return (
    <div className="relative">
      {editable ? (
        <button
          onClick={() => setOpen(true)}
          data-testid={`edit-${id}`}
          className="absolute right-0 -top-10 z-20 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white shadow"
        >
          <Pencil className="w-3 h-3" /> Edit list
        </button>
      ) : null}
      {render(items)}
      {open ? <ListModal id={id} items={items} fields={fields} lockItems={lockItems} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
