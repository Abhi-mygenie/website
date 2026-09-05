# CR-185 Line-by-Line Implementation Plan — Small Text Labels (<12px)
**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT

---

## Files Changed: 3 | Total changes: 20

| # | File | Changes | Lines |
|---|---|---|---|
| 1 | `src/components/home/Hero.jsx` | 5 | L82, L87, L91, L95, L98 |
| 2 | `src/pages/RestaurantBillingSoftware.jsx` | 2 | L75, L134 |
| 3 | `src/pages/PetpoojaAlternative.jsx` | 13 | L386, L412, L416, L543, L568, L602, L603, L604, L624, L755, L820, L898, L983 |

**Rule:** `text-[9px]` → `text-xs` · `text-[10px]` → `text-xs` · `text-[11px]` → `text-xs`
`text-xs` = 12px in Tailwind. Only size class changes — weight, colour, tracking unchanged.

---

## FILE 1 — `src/components/home/Hero.jsx` (5 changes)

### Change H1 — Line 82
**BEFORE:**
```jsx
            <span className="text-[11px] text-brand-muted font-semibold uppercase tracking-wide mr-1">
```
**AFTER:**
```jsx
            <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide mr-1">
```

### Change H2 — Line 87
**BEFORE:**
```jsx
              <span className="text-[11px] font-bold" style={{ color: "#FC8019" }}>Swiggy</span>
```
**AFTER:**
```jsx
              <span className="text-xs font-bold" style={{ color: "#FC8019" }}>Swiggy</span>
```

### Change H3 — Line 91
**BEFORE:**
```jsx
              <span className="text-[11px] font-bold" style={{ color: "#E23744" }}>Zomato</span>
```
**AFTER:**
```jsx
              <span className="text-xs font-bold" style={{ color: "#E23744" }}>Zomato</span>
```

### Change H4 — Line 95
**BEFORE:**
```jsx
              <span className="text-[11px] font-bold" style={{ color: "#3395FF" }}>Razorpay</span>
```
**AFTER:**
```jsx
              <span className="text-xs font-bold" style={{ color: "#3395FF" }}>Razorpay</span>
```

### Change H5 — Line 98
**BEFORE:**
```jsx
              <span className="text-[11px] font-bold text-[#15803d]">GST-ready</span>
```
**AFTER:**
```jsx
              <span className="text-xs font-bold text-[#15803d]">GST-ready</span>
```

---

## FILE 2 — `src/pages/RestaurantBillingSoftware.jsx` (2 changes)

### Change R1 — Line 75
**BEFORE:**
```jsx
                {plan.pop && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[9px] font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">Most Popular</span>}
```
**AFTER:**
```jsx
                {plan.pop && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">Most Popular</span>}
```

### Change R2 — Line 134
**BEFORE:**
```jsx
                      <div className="text-[11px] text-brand-muted mt-1 leading-tight">{label}</div>
```
**AFTER:**
```jsx
                      <div className="text-xs text-brand-muted mt-1 leading-tight">{label}</div>
```

---

## FILE 3 — `src/pages/PetpoojaAlternative.jsx` (13 changes)

### Change P1 — Line 386
**BEFORE:**
```jsx
      <span className="inline-block bg-orange-50 border border-orange-200 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
```
**AFTER:**
```jsx
      <span className="inline-block bg-orange-50 border border-orange-200 text-brand-orange text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
```

### Change P2 — Line 412
**BEFORE:**
```jsx
                <div className="text-[11px] text-brand-muted mt-1 leading-tight">leakage caught in 2 weeks</div>
```
**AFTER:**
```jsx
                <div className="text-xs text-brand-muted mt-1 leading-tight">leakage caught in 2 weeks</div>
```

### Change P3 — Line 416
**BEFORE:**
```jsx
                <div className="text-[11px] text-brand-muted mt-1 leading-tight">lower fixed costs</div>
```
**AFTER:**
```jsx
                <div className="text-xs text-brand-muted mt-1 leading-tight">lower fixed costs</div>
```

### Change P4 — Line 543
**BEFORE:**
```jsx
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] mb-4">
```
**AFTER:**
```jsx
              <div className="text-xs font-bold uppercase tracking-widest text-[#5B7A68] mb-4">
```

### Change P5 — Line 568
**BEFORE:**
```jsx
              <div className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow mb-4">
```
**AFTER:**
```jsx
              <div className="text-xs font-bold uppercase tracking-widest text-brand-yellow mb-4">
```

### Change P6 — Line 602
**BEFORE:**
```jsx
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] bg-[#0c2a1a] w-[45%]">Feature</th>
```
**AFTER:**
```jsx
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[#5B7A68] bg-[#0c2a1a] w-[45%]">Feature</th>
```

### Change P7 — Line 603
**BEFORE:**
```jsx
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-brand-green text-center bg-[#0d3318] w-[27.5%]">MyGenie</th>
```
**AFTER:**
```jsx
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-green text-center bg-[#0d3318] w-[27.5%]">MyGenie</th>
```

### Change P8 — Line 604
**BEFORE:**
```jsx
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[27.5%]">Petpooja</th>
```
**AFTER:**
```jsx
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[27.5%]">Petpooja</th>
```

### Change P9 — Line 624
**BEFORE:**
```jsx
                        <td colSpan={3} className="px-5 py-2 bg-[#0e1e14] text-[10px] font-bold uppercase tracking-widest text-[#3d5e4a]">
```
**AFTER:**
```jsx
                        <td colSpan={3} className="px-5 py-2 bg-[#0e1e14] text-xs font-bold uppercase tracking-widest text-[#3d5e4a]">
```

### Change P10 — Line 755
**BEFORE:**
```jsx
                <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">
```
**AFTER:**
```jsx
                <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">
```

### Change P11 — Line 820
**BEFORE:**
```jsx
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4 ${
```
**AFTER:**
```jsx
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4 ${
```

### Change P12 — Line 898
**BEFORE:**
```jsx
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[9px] font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">
```
**AFTER:**
```jsx
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">
```

### Change P13 — Line 983
**BEFORE:**
```jsx
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] mb-3">
```
**AFTER:**
```jsx
                <div className="text-xs font-bold uppercase tracking-widest text-[#5B7A68] mb-3">
```

---

## Verification Gate (after build)

```bash
python3 -c "
import subprocess, sys

files = [
    '/app/frontend/src/components/home/Hero.jsx',
    '/app/frontend/src/pages/RestaurantBillingSoftware.jsx',
    '/app/frontend/src/pages/PetpoojaAlternative.jsx',
]
import re
all_ok = True
for f in files:
    src = open(f).read()
    bad = re.findall(r'text-\[(?:9|10|11)px\]', src)
    if bad:
        all_ok = False
        print(f'FAIL  {f.split(\"/\")[-1]}: still has {bad}')
    else:
        print(f'OK    {f.split(\"/\")[-1]}: no sub-12px text classes')
print()
print('ALL PASS' if all_ok else 'SOME FAILING')
"
```

---

## Build Command
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-02. 3 files, 20 class changes. Zero content approval needed.*
