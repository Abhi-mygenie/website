#!/usr/bin/env python3
"""Build governance/TRACEABILITY_MATRIX.md from the register, CR docs, code refs and overrides. Read-only on everything except the matrix file."""
import json, os, re, subprocess
from collections import defaultdict
from datetime import date

ROOT = "/app"
MEM = f"{ROOT}/memory"
GOV = f"{MEM}/governance"
OVR = json.load(open(f"{ROOT}/scripts/gov/overrides.json"))
GATE_ORDER = ["INTAKE", "INVESTIGATION", "IMPACT", "PLAN", "APPROVAL", "IMPLEMENTATION", "QA", "CLOSURE",
              "OWNER-ACTION", "DEFERRED", "REOPENED-UNVERIFIED", "CLOSED", "LEGACY-CLOSED", "SUPERSEDED", "REJECTED"]
FILE_RE = re.compile(r"[\w./-]+\.(?:jsx?|py|conf|json|xml|html|css|md|txt|sh)\b|\bL\d{2,4}\b|iter(?:ation)?[- _]?\d+|curl|HTTP/?2? ?\d{3}|\b(?:200|301|404) ?(?:OK)?\b")

def parse_register():
    reg = open(f"{MEM}/CR_INTAKE_REGISTER.md").read()
    rows = defaultdict(list)
    for l in reg.splitlines():
        if not re.match(r"^\|\s*\**CR-\d+", l):
            continue
        c = [x.strip() for x in l.strip("|").split("|")]
        n = int(re.search(r"CR-(\d+)", c[0]).group(1))
        rows[n].append(c)
    out = {}
    for n, rs in rows.items():
        first = rs[0]
        title = re.sub(r"\*\*", "", first[1])[:90]
        status = first[2] if len(first) > 2 else ""
        prio = next((c[3] for c in rs if len(c) > 3 and re.match(r"^(P\d|LOW|MED|HIGH|CRIT)", c[3], re.I)), "—")
        alltext = " ".join(" ".join(c) for c in rs)
        out[n] = dict(title=title, status=status, prio=prio, alltext=alltext, nrows=len(rs))
    return out

def emoji_state(s):
    if "✅" in s: return "CLOSED"
    if "👤" in s: return "OWNER-ACTION"
    if "📋" in s: return "APPROVAL"
    if "⏸" in s: return "DEFERRED"
    if "🔲" in s: return "INTAKE"
    return "UNCLASSIFIED"

def docs_for(n, files):
    d = set()
    for f in files:
        if not f.startswith("CR"): continue
        if re.search(rf"CR-?{n}(?![0-9])", f): d.add(f)
        for a, b in re.findall(r"CR-(\d+)-(?:to-)?(\d+)", f):
            if int(a) <= n <= int(b): d.add(f)
        for m in re.findall(r"CR-(\d+(?:[_-]\d+)+)(?:_|\.)", f):
            if str(n) in re.split("[_-]", m): d.add(f)
    return sorted(d)

def code_refs():
    out = subprocess.run(f"grep -rnoE 'CR-[0-9]+' {ROOT}/backend/*.py {ROOT}/frontend/src {ROOT}/frontend/scripts {ROOT}/backend/scripts 2>/dev/null",
                         shell=True, capture_output=True, text=True).stdout
    refs = defaultdict(set)
    for line in out.splitlines():
        path, _, ref = line.rsplit(":", 2)
        refs[int(ref.split("-")[1])].add(os.path.relpath(path, ROOT))
    return refs

def main():
    files = os.listdir(MEM)
    reg = parse_register()
    refs = code_refs()
    ovr = OVR["status_overrides"]
    legacy = OVR["legacy_crs"]
    ids = sorted(set(reg) | {int(k) for k in legacy} | {int(k) for k in ovr})
    rows, counts, reopened, violations = [], defaultdict(int), [], []
    for n in ids:
        r = reg.get(n)
        d = docs_for(n, files)
        ia = [f for f in d if "Impact" in f]
        plan = [f for f in d if "Plan" in f]
        brief = [f for f in d if f not in ia and f not in plan]
        crefs = sorted(refs.get(n, []))
        title = r["title"] if r else legacy.get(str(n), {}).get("title", "?")
        prio = r["prio"] if r else legacy.get(str(n), {}).get("prio", "—")
        base = emoji_state(r["status"]) if r else "CLOSED"
        note = ""
        if str(n) in ovr:
            state, note = ovr[str(n)]["state"], ovr[str(n)]["note"]
        else:
            state = base
        if str(n) in legacy and str(n) not in ovr:
            note = "D-3 retro-registered (legacy, pre-register era)"
        # D-4 light evidence pass for anything closed before baseline
        evidence = []
        if crefs: evidence.append(f"code: {', '.join(crefs[:3])}{' …' if len(crefs) > 3 else ''}")
        if r and FILE_RE.search(r["alltext"].replace(title, "")): evidence.append("register validation note")
        if ia or plan: evidence.append("IA/plan doc")
        if str(n) in ovr and "evidence" in ovr[str(n)]["note"]: evidence.append("owner-decision/verified note (overrides.json)")
        if state in ("CLOSED", "LEGACY-CLOSED") and n < 265:
            if evidence:
                state = "LEGACY-CLOSED"
            else:
                state = "REOPENED-UNVERIFIED"; reopened.append(n)
                note = (note + "; " if note else "") + "D-4: no code ref, no file-level validation note, no IA/plan → needs QA pass"
        if state == "UNCLASSIFIED": violations.append(f"CR-{n}: status cell has no legend emoji and no override")
        counts[state] += 1
        link = lambda fs: ", ".join(f"`{f}`" for f in fs) if fs else "—"
        rows.append((GATE_ORDER.index(state) if state in GATE_ORDER else 99, n,
                     f"| CR-{n} | {title} | **{state}** | {prio} | {link(brief[:2])} | {link(ia[:1])} | {link(plan[:1])} | "
                     f"{'✅ ' + ', '.join(crefs[:2]) + (' …' if len(crefs) > 2 else '') if crefs else '—'} | "
                     f"{'; '.join(evidence) if evidence else '—'} | {'R0 (assumed)' if state in ('LEGACY-CLOSED','CLOSED') else '—'} | {note} |"))
    rows.sort()
    today = date.today().isoformat()
    hdr = [f"# TRACEABILITY MATRIX — single source of truth for CR state",
           f"", f"**Generated:** {today} by `scripts/gov/build_matrix.py` from `CR_INTAKE_REGISTER.md` + `/app/memory/CR-*.md` + code comments + `scripts/gov/overrides.json`.",
           "**Rule:** state changes are made by editing `overrides.json` (with a decision reference) or by adding gate artefacts, then re-running the script. Never hand-edit this file.",
           "**Chain per CR:** Intake doc → Investigation (inside intake doc) → IA → Plan → Approval (inside CR doc) → Implementation (commit `CR-n:`) → QA (test report) → Release (`RELEASES.md`).", "",
           "## Counts", "", "| State | Count |", "|---|---|"] + \
          [f"| {s} | {counts[s]} |" for s in GATE_ORDER if counts.get(s)] + [f"| **Total** | **{len(rows)}** |", ""]
    if reopened:
        hdr += ["## REOPENED-UNVERIFIED (D-4) — were CLOSED, no evidence found; need a QA pass before closing again", "",
                ", ".join(f"CR-{n}" for n in reopened), ""]
    if violations:
        hdr += ["## Violations", ""] + [f"- {v}" for v in violations] + [""]
    hdr += ["## Approvals log", "", "| CR | Date | Owner text (verbatim) | Plan version |", "|---|---|---|---|",
            "| — | — | (no approvals recorded since governance start 2026-09-13) | — |", "",
            "## Matrix", "", "Sorted by gate (active first). Columns: Brief = intake/brief doc(s); IA; Plan; Code = `CR-n` comment found in source; Evidence = D-4 light retro-evidence; Release = production release containing it.", "",
            "| CR | Title | State | Prio | Brief | IA | Plan | Code ref | Evidence | Release | Note |",
            "|---|---|---|---|---|---|---|---|---|---|---|"]
    open(f"{GOV}/TRACEABILITY_MATRIX.md", "w").write("\n".join(hdr + [r[2] for r in rows]) + "\n")
    print(dict(counts)); print("reopened:", reopened); print("violations:", violations)

if __name__ == "__main__":
    main()
