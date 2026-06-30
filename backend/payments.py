"""CR-10 — Razorpay payment integration.

Routes (all under /api/payments via server.py):
  POST /api/payments/razorpay/order    — create order, save to Mongo
  POST /api/payments/razorpay/verify   — client-side sig verify → mark paid
  POST /api/payments/razorpay/webhook  — server-side source of truth
  GET  /api/payments/order/{order_id}  — fetch order for PaymentSuccess page
"""
import os
import hmac
import hashlib
import uuid
import json
import logging
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import razorpay
import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

import freshsales
import storage as cms_storage

logger = logging.getLogger(__name__)

KEY_ID     = os.environ.get("RAZORPAY_KEY_ID", "")
KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

# GST invoice config
GST_SELLER_NAME    = os.environ.get("GST_SELLER_NAME", "MyGenie POS")
GST_SELLER_GSTIN   = os.environ.get("GST_SELLER_GSTIN", "")
GST_SELLER_ADDRESS = os.environ.get("GST_SELLER_ADDRESS", "")
INVOICE_PREFIX     = os.environ.get("GST_INVOICE_PREFIX", "MG_2026_27_JUNE")

# Brand colours for PDF
PDF_ORANGE  = "#f26b33"
PDF_GREEN   = "#329937"
PDF_DARK    = "#111827"
PDF_GREY    = "#9ca3af"
PDF_LGREY   = "#f3f4f6"
PDF_OBGTINT = "#fff7f0"
PDF_OBORDER = "#fdd9c8"

# Seller state code (from GSTIN first 2 digits)
SELLER_STATE_CODE = GST_SELLER_GSTIN[:2] if GST_SELLER_GSTIN else "09"

# Logo path
LOGO_PATH = Path(__file__).parent.parent / "frontend" / "public" / "brand" / "logo.svg"

# Freshsales payment stage IDs (looked up 2026-06-21)
FS_LIFECYCLE_CUSTOMER = os.environ.get("FRESHSALES_LIFECYCLE_CUSTOMER_ID")
FS_STATUS_WON         = os.environ.get("FRESHSALES_STATUS_WON_ID")
FS_STATUS_PAYMENT_AWAITED = os.environ.get("FRESHSALES_STATUS_PAYMENT_AWAITED", "402001783018")

# SMS panel (same credentials as OTP)
SMS_BASE_URL    = os.environ.get("SMS_BASE_URL", "")
SMS_USERNAME    = os.environ.get("SMS_USERNAME", "")
SMS_API_KEY     = os.environ.get("SMS_API_KEY", "")
SMS_SENDER      = os.environ.get("SMS_SENDER", "HSEGNI")
SMS_ROUTE       = os.environ.get("SMS_ROUTE", "TRANS")


def _rzp():
    return razorpay.Client(auth=(KEY_ID, KEY_SECRET))


# ── Pydantic models ────────────────────────────────────────────────────────────

class OrderCreateRequest(BaseModel):
    plan_id: str
    plan_name: str
    plan_price: float
    addon_ids: list[str] = []
    addon_names: list[str] = []
    addon_prices: list[float] = []
    name: str
    phone: str
    email: str | None = None
    business_name: str | None = None
    city: str | None = None
    gstin: str | None = None
    attribution: dict | None = None
    outlet_type: str | None = None
    was_recommended: bool = False


class VerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str          # our internal order id


# ── Router factory (db injected from server.py) ────────────────────────────────

def make_payments_router(db) -> APIRouter:
    router = APIRouter(prefix="/payments")

    # ── 1. Create order ────────────────────────────────────────────────────────
    @router.post("/razorpay/order")
    async def create_order(payload: OrderCreateRequest):
        subtotal_mo = payload.plan_price + sum(payload.addon_prices)
        subtotal_yr = subtotal_mo * 12
        gst          = round(subtotal_yr * 0.18)
        total        = subtotal_yr + gst
        amount_paise = int(total * 100)

        # Create Razorpay order
        try:
            rzp_order = _rzp().order.create({
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": 1,
                "notes": {
                    "plan": payload.plan_name,
                    "customer": payload.name,
                    "phone": payload.phone,
                },
            })
        except Exception as e:
            logger.error("Razorpay order creation failed: %s", e)
            raise HTTPException(status_code=502, detail="Payment gateway error. Please try again.")

        order_id = str(uuid.uuid4())
        invoice_no = await _next_invoice_no(db)

        doc = {
            "id": order_id,
            "invoice_no": invoice_no,
            "razorpay_order_id": rzp_order["id"],
            "razorpay_payment_id": None,
            "razorpay_signature": None,
            "plan_id": payload.plan_id,
            "plan_name": payload.plan_name,
            "plan_price": payload.plan_price,
            "addon_ids": payload.addon_ids,
            "addon_names": payload.addon_names,
            "addon_prices": payload.addon_prices,
            "subtotal": subtotal_yr,
            "gst": gst,
            "amount_total": total,
            "amount_paise": amount_paise,
            "currency": "INR",
            "billing": "annual",
            "status": "created",
            "customer": {
                "name": payload.name,
                "phone": payload.phone,
                "email": payload.email,
                "business_name": payload.business_name,
                "city": payload.city,
                "gstin": payload.gstin,
                "outlet_type": payload.outlet_type,
            },
            "attribution": payload.attribution,
            "was_recommended": payload.was_recommended,
            "invoice_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "paid_at": None,
        }
        await db.orders.insert_one(doc)

        # Best-effort: set Freshsales contact to Payment Awaited
        await freshsales.upsert_contact(
            name=payload.name, email=payload.email, phone=payload.phone,
            external_id=f"web_{payload.phone[-10:]}",
            city=payload.city, job_title=payload.business_name,
            tags=["Buy Online"],
            extra_fields={
                "contact_status_id": int(FS_STATUS_PAYMENT_AWAITED)
            } if FS_STATUS_PAYMENT_AWAITED else {},
        )

        return {
            "order_id": order_id,
            "razorpay_order_id": rzp_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": KEY_ID,
            "customer": {"name": payload.name, "email": payload.email or "", "phone": payload.phone},
        }

    # ── 2. Verify payment (client-side callback) ───────────────────────────────
    @router.post("/razorpay/verify")
    async def verify_payment(payload: VerifyRequest):
        _verify_payment_sig(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature)

        order = await db.orders.find_one({"id": payload.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.get("status") == "paid":
            return {"success": True, "order_id": payload.order_id, "invoice_url": order.get("invoice_url")}

        invoice_url = await _complete_payment(db, order, payload.razorpay_payment_id)
        return {"success": True, "order_id": payload.order_id, "invoice_url": invoice_url}

    # ── 3. Webhook (source of truth) ───────────────────────────────────────────
    @router.post("/razorpay/webhook")
    async def razorpay_webhook(request: Request):
        body = await request.body()
        sig  = request.headers.get("X-Razorpay-Signature", "")
        _verify_webhook_sig(body, sig)

        try:
            data = json.loads(body)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON")

        event = data.get("event")
        if event == "payment.captured":
            p = data.get("payload", {}).get("payment", {}).get("entity", {})
            rzp_order_id  = p.get("order_id")
            rzp_payment_id = p.get("id")
            order = await db.orders.find_one({"razorpay_order_id": rzp_order_id})
            if order and order.get("status") != "paid":
                await _complete_payment(db, order, rzp_payment_id)

        elif event == "payment.failed":
            p = data.get("payload", {}).get("payment", {}).get("entity", {})
            rzp_order_id = p.get("order_id")
            await db.orders.update_one(
                {"razorpay_order_id": rzp_order_id},
                {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )

        return {"status": "ok"}

    # ── 4. Fetch order (for PaymentSuccess page) ───────────────────────────────
    @router.get("/order/{order_id}")
    async def get_order(order_id: str):
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

    # ── 5. Regenerate invoice (if generation failed on payment) ───────────────
    @router.post("/order/{order_id}/regenerate-invoice")
    async def regenerate_invoice(order_id: str):
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.get("invoice_url"):
            return {"invoice_url": order["invoice_url"]}
        if order.get("status") != "paid":
            raise HTTPException(status_code=400, detail="Order not paid yet")
        rzp_payment_id = order.get("razorpay_payment_id", "")
        try:
            invoice_url = _generate_invoice(order, rzp_payment_id)
            if invoice_url:
                await db.orders.update_one({"id": order_id}, {"$set": {"invoice_url": invoice_url}})
                return {"invoice_url": invoice_url}
        except Exception as e:
            logger.error("Regenerate invoice error: %s", e)
        raise HTTPException(status_code=500, detail="Invoice generation failed")

    # ── 6. Download invoice with correct filename ─────────────────────────────
    @router.get("/order/{order_id}/invoice-download")
    async def download_invoice(order_id: str):
        from fastapi.responses import Response
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        invoice_url = order.get("invoice_url")
        if not invoice_url:
            raise HTTPException(status_code=404, detail="Invoice not ready yet")
        # Extract filename from stored URL path: /api/cms/media/{uuid}.pdf
        stored_name = invoice_url.split("/")[-1]
        try:
            data, _ = cms_storage.get_storage().read_with_type(stored_name)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Invoice file not found")
        invoice_no = order.get("invoice_no", order_id)
        safe_name = invoice_no.replace("/", "_").replace(" ", "_") + ".pdf"
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}"'}
        )

    # ── 7. Menu upload on thank you page ──────────────────────────────────────
    @router.post("/order/{order_id}/menu-upload")
    async def upload_menu(order_id: str, request: Request):
        from fastapi import UploadFile, File, Form
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        form = await request.form()
        uploaded = []
        for key in form:
            field = form[key]
            if hasattr(field, "filename") and field.filename:
                data = await field.read()
                ext = field.filename.rsplit(".", 1)[-1].lower() if "." in field.filename else "bin"
                if ext not in ("jpg", "jpeg", "png", "pdf", "webp"):
                    continue
                url = cms_storage.get_storage().save(data, ext)
                uploaded.append({
                    "url": url,
                    "filename": field.filename,
                    "size": len(data),
                    "uploaded_at": datetime.now(timezone.utc).isoformat(),
                })
        if not uploaded:
            raise HTTPException(status_code=400, detail="No valid files uploaded")
        await db.orders.update_one(
            {"id": order_id},
            {"$push": {"menu_files": {"$each": uploaded}}}
        )
        return {"uploaded": len(uploaded), "files": uploaded}

    return router


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _verify_payment_sig(order_id: str, payment_id: str, signature: str):
    msg = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(KEY_SECRET.encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")


def _verify_webhook_sig(body: bytes, signature: str):
    if not WEBHOOK_SECRET:
        return  # dev mode — skip
    expected = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")


PLAN_HSN_MAP = {
    "starter": "998311",
    "growth":  "998312",
    "pro":     "998313",
    "custom":  "998314",
}

async def _next_invoice_no(db) -> str:
    result = await db.order_seq.find_one_and_update(
        {"_id": "invoice_counter"},
        {"$inc": {"seq": 1}},
        upsert=True, return_document=True
    )
    n = result.get("seq", 1)
    return f"{INVOICE_PREFIX}_{n:05d}"


async def _complete_payment(db, order: dict, razorpay_payment_id: str) -> str | None:
    """Mark order paid, generate invoice PDF, send SMS, update Freshsales."""
    # 1. Update order
    invoice_url = None
    try:
        invoice_url = _generate_invoice(order, razorpay_payment_id)
        if invoice_url:
            await db.orders.update_one(
                {"id": order["id"]},
                {"$set": {"invoice_url": invoice_url}}
            )
    except Exception as e:
        logger.warning("Invoice generation failed (non-fatal): %s", e)

    await db.orders.update_one(
        {"id": order["id"]},
        {"$set": {
            "status": "paid",
            "razorpay_payment_id": razorpay_payment_id,
            "paid_at": datetime.now(timezone.utc).isoformat(),
        }}
    )

    # 2. Send SMS with invoice link
    customer = order.get("customer", {})
    phone = customer.get("phone", "")
    if invoice_url and phone:
        await _send_invoice_sms(phone, customer.get("name", ""), order["invoice_no"], invoice_url)

    # 3. Update Freshsales — Customer/Won + Paid Online tag
    try:
        extra = {}
        if FS_LIFECYCLE_CUSTOMER:
            extra["lifecycle_stage_id"] = int(FS_LIFECYCLE_CUSTOMER)
        if FS_STATUS_WON:
            extra["contact_status_id"] = int(FS_STATUS_WON)
        await freshsales.upsert_contact(
            name=customer.get("name", ""),
            email=customer.get("email"),
            phone=phone,
            external_id=f"web_{phone[-10:]}",
            city=customer.get("city"),
            job_title=customer.get("business_name"),
            tags=["Paid Online", "Buy Online"],
            extra_fields=extra,
        )
    except Exception as e:
        logger.warning("Freshsales mark_paid failed (non-fatal): %s", e)

    return invoice_url


def _generate_invoice(order: dict, razorpay_payment_id: str) -> str | None:
    """Generate branded GST invoice PDF matching approved mockup. Saves via storage.py."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib import colors
        from reportlab.platypus import Image as RLImage

        # ── helpers ──────────────────────────────────────────────────────────
        def hex_color(h):
            return colors.HexColor(h)

        def _draw_chip(c, x, y, text, w=60*mm, h=5.5*mm,
                       bg="#fff7f0", border="#fdd9c8", fg="#c45a22"):
            c.setFillColor(hex_color(bg))
            c.setStrokeColor(hex_color(border))
            c.roundRect(x, y, w, h, 1.5*mm, fill=1, stroke=1)
            c.setFillColor(hex_color(fg))
            c.setFont("Helvetica-Bold", 8)
            c.drawString(x + 2.5*mm, y + 1.5*mm, text)

        def _addr_lines(addr):
            """Split address into 2 balanced lines."""
            mid = len(addr) // 2
            split = addr.rfind(",", 0, mid + 15)
            if split == -1:
                return [addr[:40], addr[40:]]
            return [addr[:split + 1].strip(), addr[split + 1:].strip()]

        def _tax_type(buyer_gstin):
            if buyer_gstin and len(buyer_gstin) >= 2:
                return "cgst_sgst" if buyer_gstin[:2] == SELLER_STATE_CODE else "igst"
            return "igst"

        def _state_name(gstin):
            _map = {"01":"Jammu & Kashmir","02":"Himachal Pradesh","03":"Punjab",
                    "04":"Chandigarh","05":"Uttarakhand","06":"Haryana","07":"Delhi",
                    "08":"Rajasthan","09":"Uttar Pradesh","10":"Bihar","11":"Sikkim",
                    "12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur",
                    "15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam",
                    "19":"West Bengal","20":"Jharkhand","21":"Odisha","22":"Chhattisgarh",
                    "23":"Madhya Pradesh","24":"Gujarat","27":"Maharashtra","29":"Karnataka",
                    "30":"Goa","31":"Lakshadweep","32":"Kerala","33":"Tamil Nadu",
                    "34":"Puducherry","35":"Andaman & Nicobar","36":"Telangana",
                    "37":"Andhra Pradesh"}
            code = gstin[:2] if gstin and len(gstin) >= 2 else ""
            name = _map.get(code, "")
            return f"{name} ({code})" if name else "—"

        # ── canvas setup ─────────────────────────────────────────────────────
        buf = BytesIO()
        c = rl_canvas.Canvas(buf, pagesize=A4)
        W, H = A4

        # Register NotoSans for ₹ symbol support
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        _noto = "/usr/share/fonts/truetype/noto-sans-regular.ttf"
        try:
            pdfmetrics.registerFont(TTFont("NotoSans", _noto))
            _rf = "NotoSans"
        except Exception:
            _rf = "Helvetica"

        def _money(val):
            return f"\u20b9{val:,.0f}"

        customer    = order.get("customer", {})
        invoice_no  = order.get("invoice_no", "")
        paid_at_raw = order.get("paid_at", datetime.now(timezone.utc).isoformat())
        paid_at     = paid_at_raw[:10]
        buyer_gstin = customer.get("gstin", "") or ""
        tax_type    = _tax_type(buyer_gstin)
        plan_name   = order.get("plan_name", "")
        plan_price  = order.get("plan_price", 0)
        addon_names = order.get("addon_names", [])
        addon_prices= order.get("addon_prices", [])
        plan_hsn    = PLAN_HSN_MAP.get(order.get("plan_id", ""), "998311")
        subtotal    = order.get("subtotal", 0)
        gst_amt     = order.get("gst", 0)
        total       = order.get("amount_total", 0)

        # ── TOP STRIP (orange → green) ────────────────────────────────────────
        strip_h = 3.5 * mm
        steps = 60
        for i in range(steps):
            t = i / steps
            r = int(0xf2 + (0x32 - 0xf2) * t)
            g = int(0x6b + (0x99 - 0x6b) * t)
            b = int(0x33 + (0x37 - 0x33) * t)
            c.setFillColor(colors.Color(r/255, g/255, b/255))
            c.rect(i * W/steps, H - strip_h, W/steps + 0.5, strip_h, fill=1, stroke=0)

        # ── HEADER ────────────────────────────────────────────────────────────
        header_top = H - strip_h
        header_h   = 32 * mm
        header_bot = header_top - header_h

        # Logo
        logo_drawn = False
        try:
            from svglib.svglib import svg2rlg
            from reportlab.graphics import renderPDF
            if LOGO_PATH.exists():
                drawing = svg2rlg(str(LOGO_PATH))
                if drawing:
                    scale = (28 * mm) / drawing.height
                    drawing.width  *= scale
                    drawing.height *= scale
                    drawing.transform = (scale, 0, 0, scale, 0, 0)
                    renderPDF.draw(drawing, c, 15*mm, header_bot + (header_h - 28*mm)/2)
                    logo_drawn = True
        except Exception as logo_err:
            logger.warning("SVG logo render failed, using text fallback: %s", logo_err)

        if not logo_drawn:
            c.setFillColor(hex_color(PDF_ORANGE))
            c.setFont("Helvetica-Bold", 20)
            c.drawString(15*mm, header_bot + 16*mm, "MyGenie POS")

        # Doc type + ORIGINAL badge
        c.setFillColor(hex_color(PDF_GREY))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(15*mm, header_bot + 5*mm, "GST TAX INVOICE")

        badge_x = 15*mm + 33*mm
        badge_w = 18*mm
        badge_h = 4.5*mm
        c.setFillColor(hex_color(PDF_GREEN))
        c.roundRect(badge_x, header_bot + 4*mm, badge_w, badge_h, 1*mm, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(badge_x + badge_w/2, header_bot + 5.5*mm, "ORIGINAL")

        # Invoice details (right side)
        c.setFillColor(hex_color(PDF_ORANGE))
        c.setFont("Helvetica-Bold", 15)
        c.drawRightString(W - 15*mm, header_bot + 22*mm, invoice_no)

        c.setFillColor(hex_color(PDF_DARK))
        c.setFont("Helvetica-Bold", 9)
        c.drawRightString(W - 15*mm, header_bot + 14*mm, f"Date: {paid_at}")

        c.setFillColor(hex_color(PDF_GREY))
        c.setFont("Helvetica", 7.5)
        c.drawRightString(W - 15*mm, header_bot + 7.5*mm, f"Txn ID: {razorpay_payment_id}")

        # Header bottom border
        c.setStrokeColor(hex_color("#f0f0f0"))
        c.setLineWidth(0.5)
        c.line(0, header_bot, W, header_bot)

        # ── PARTIES ──────────────────────────────────────────────────────────
        parties_top = header_bot - 3*mm
        mid_x = W / 2

        # Divider between parties
        c.setStrokeColor(hex_color("#f0f0f0"))
        c.line(mid_x, parties_top - 34*mm, mid_x, parties_top - 1*mm)

        # BILLED FROM label
        c.setFillColor(hex_color(PDF_ORANGE))
        c.setFont("Helvetica-Bold", 7)
        c.drawString(15*mm, parties_top - 5*mm, "BILLED FROM")

        # Seller name (brand)
        c.setFillColor(hex_color(PDF_DARK))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(15*mm, parties_top - 11*mm, "MyGenie POS")

        # Legal name
        c.setFillColor(hex_color(PDF_GREY))
        c.setFont("Helvetica", 8)
        c.drawString(15*mm, parties_top - 16*mm, GST_SELLER_NAME)

        # Address (2 lines)
        addr_lines = _addr_lines(GST_SELLER_ADDRESS)
        c.setFillColor(hex_color(PDF_DARK))
        c.setFont("Helvetica", 9)
        c.drawString(15*mm, parties_top - 22*mm, addr_lines[0])
        c.drawString(15*mm, parties_top - 27*mm, addr_lines[1])

        # Seller GSTIN chip
        _draw_chip(c, 15*mm, parties_top - 34*mm, f"GSTIN: {GST_SELLER_GSTIN}", w=58*mm)

        # BILLED TO label
        c.setFillColor(hex_color(PDF_ORANGE))
        c.setFont("Helvetica-Bold", 7)
        c.drawString(mid_x + 7*mm, parties_top - 5*mm, "BILLED TO")

        # Buyer name
        c.setFillColor(hex_color(PDF_DARK))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(mid_x + 7*mm, parties_top - 11*mm, customer.get("name", ""))

        # Buyer business
        c.setFont("Helvetica", 9)
        row = parties_top - 17*mm
        if customer.get("business_name"):
            c.drawString(mid_x + 7*mm, row, customer["business_name"])
            row -= 5.5*mm
        c.drawString(mid_x + 7*mm, row, f"Phone: {customer.get('phone', '')}")
        row -= 5.5*mm
        if customer.get("email"):
            c.drawString(mid_x + 7*mm, row, customer["email"])
            row -= 5.5*mm

        # Buyer GSTIN chip (if available)
        if buyer_gstin:
            _draw_chip(c, mid_x + 7*mm, parties_top - 34*mm, f"GSTIN: {buyer_gstin}", w=58*mm)

        # Parties bottom border
        parties_bot = parties_top - 37*mm
        c.setStrokeColor(hex_color("#f0f0f0"))
        c.line(0, parties_bot, W, parties_bot)

        # ── META ROW ─────────────────────────────────────────────────────────
        meta_h    = 11*mm
        meta_bot  = parties_bot - meta_h
        meta_bg   = hex_color("#fafafa")
        c.setFillColor(meta_bg)
        c.rect(0, meta_bot, W, meta_h, fill=1, stroke=0)

        # Place of Supply
        if buyer_gstin:
            pos_val = _state_name(buyer_gstin)
        else:
            pos_val = "— (B2C)"

        supply_type = "Intra-State" if tax_type == "cgst_sgst" else "Inter-State"

        meta_items = [
            ("PLACE OF SUPPLY", pos_val),
            ("REVERSE CHARGE", "No"),
            ("BILLING PERIOD", "Annual · 1 Outlet"),
            ("SUPPLY TYPE", supply_type),
        ]
        col_w = W / len(meta_items)
        for i, (label, val) in enumerate(meta_items):
            x = i * col_w + 7*mm
            c.setFillColor(hex_color(PDF_GREY))
            c.setFont("Helvetica-Bold", 6.5)
            c.drawString(x, meta_bot + 6.5*mm, label)
            c.setFillColor(hex_color(PDF_DARK))
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(x, meta_bot + 2*mm, val)
            if i > 0:
                c.setStrokeColor(hex_color("#f0f0f0"))
                c.setLineWidth(0.5)
                c.line(i * col_w, meta_bot + 1*mm, i * col_w, meta_bot + meta_h - 1*mm)

        c.setStrokeColor(hex_color("#f0f0f0"))
        c.line(0, meta_bot, W, meta_bot)

        # ── LINE ITEMS TABLE ──────────────────────────────────────────────────
        table_top = meta_bot - 3*mm
        lm, rm = 15*mm, W - 15*mm
        tw = rm - lm

        # Column x positions (proportional)
        cx = {
            "desc":   lm,
            "hsn":    lm + tw * 0.42,
            "qty":    lm + tw * 0.58,
            "rate":   lm + tw * 0.70,
            "amount": rm,
        }

        # Table header
        th_h = 7.5*mm
        c.setFillColor(hex_color(PDF_DARK))
        c.rect(lm, table_top - th_h, tw, th_h, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8)
        hdr_y = table_top - th_h + 2.5*mm
        c.drawString(cx["desc"]  + 2*mm, hdr_y, "DESCRIPTION")
        c.drawString(cx["hsn"]   + 2*mm, hdr_y, "HSN / SAC")
        c.drawCentredString(cx["qty"] + 6*mm, hdr_y, "QTY")
        c.drawRightString(cx["rate"]  + 14*mm, hdr_y, "RATE / MO")
        c.drawRightString(cx["amount"], hdr_y, "AMOUNT / YR (Rs.)")

        # Build rows: plan + addons
        items = [(plan_name, plan_hsn, 1, plan_price, plan_price * 12, False)]
        for n, p in zip(addon_names, addon_prices):
            items.append((n, plan_hsn, 1, p, p * 12, True))

        row_h   = 9*mm
        cur_y   = table_top - th_h
        zebra   = hex_color("#fffaf7")

        for idx, (name, hsn, qty, rate, amt, is_addon) in enumerate(items):
            cur_y -= row_h
            if idx % 2 == 1:
                c.setFillColor(zebra)
                c.rect(lm, cur_y, tw, row_h, fill=1, stroke=0)

            row_text_y = cur_y + 3.5*mm

            # Description
            c.setFillColor(hex_color(PDF_DARK))
            if is_addon:
                # Orange dot
                c.setFillColor(hex_color(PDF_ORANGE))
                c.circle(cx["desc"] + 3.5*mm, row_text_y + 1.5*mm, 1.3*mm, fill=1, stroke=0)
                c.setFillColor(hex_color(PDF_DARK))
                c.setFont("Helvetica", 9)
                c.drawString(cx["desc"] + 7*mm, row_text_y, name)
                c.setFillColor(hex_color(PDF_GREY))
                c.setFont("Helvetica", 7.5)
                c.drawString(cx["desc"] + 7*mm, cur_y + 1*mm, "Add-on · Annual")
            else:
                c.setFont("Helvetica-Bold", 10)
                c.drawString(cx["desc"] + 2*mm, row_text_y, name)
                c.setFillColor(hex_color(PDF_GREY))
                c.setFont("Helvetica", 7.5)
                c.drawString(cx["desc"] + 2*mm, cur_y + 1*mm, "Annual subscription · 1 outlet")

            # HSN
            c.setFillColor(hex_color(PDF_DARK))
            c.setFont("Helvetica", 9)
            c.drawString(cx["hsn"] + 2*mm, row_text_y, hsn)

            # Qty
            c.drawCentredString(cx["qty"] + 6*mm, row_text_y, str(qty))

            # Rate
            c.setFont(_rf, 9)
            c.drawRightString(cx["rate"] + 14*mm, row_text_y, _money(rate))

            # Amount
            c.setFont(_rf, 9)
            c.drawRightString(cx["amount"], row_text_y, _money(amt))

            # Row bottom border
            c.setStrokeColor(hex_color("#f3f4f6"))
            c.setLineWidth(0.3)
            c.line(lm, cur_y, rm, cur_y)

        # ── TOTALS BOX ────────────────────────────────────────────────────────
        totals_top = cur_y - 5*mm
        box_w = 75*mm
        box_x = rm - box_w

        def _total_row(y, label, val, bold=False, orange_bg=False):
            row_h2 = 7*mm
            if orange_bg:
                c.setFillColor(hex_color(PDF_ORANGE))
                c.rect(box_x, y - row_h2, box_w, row_h2, fill=1, stroke=0)
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 11)
                c.drawString(box_x + 4*mm, y - row_h2 + 2*mm, label)
                c.drawRightString(rm, y - row_h2 + 2*mm, val)
            else:
                c.setFillColor(hex_color(PDF_DARK) if bold else hex_color(PDF_GREY))
                c.setFont("Helvetica-Bold" if bold else "Helvetica", 9)
                c.drawString(box_x + 4*mm, y - row_h2 + 2*mm, label)
                c.setFillColor(hex_color(PDF_DARK))
                c.setFont(_rf, 9)
                c.drawRightString(rm, y - row_h2 + 2*mm, val)
                c.setStrokeColor(hex_color("#f0f0f0"))
                c.setLineWidth(0.3)
                c.line(box_x, y - row_h2, rm, y - row_h2)
            return y - row_h2

        ty = totals_top
        # Draw box border
        n_rows = 4 if tax_type == "cgst_sgst" else 3
        box_h = n_rows * 7*mm
        c.setStrokeColor(hex_color("#f0f0f0"))
        c.setLineWidth(0.5)
        c.roundRect(box_x, totals_top - box_h, box_w, box_h, 2*mm, fill=0, stroke=1)

        ty = _total_row(ty, "Subtotal", _money(subtotal), bold=True)
        if tax_type == "cgst_sgst":
            half_gst = round(gst_amt / 2)
            ty = _total_row(ty, "CGST @ 9%", _money(half_gst))
            ty = _total_row(ty, "SGST @ 9%", _money(half_gst))
        else:
            ty = _total_row(ty, "IGST @ 18%", _money(gst_amt))

        # Total row uses NotoSans for ₹
        row_h2 = 7*mm
        c.setFillColor(hex_color(PDF_ORANGE))
        c.rect(box_x, ty - row_h2, box_w, row_h2, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(box_x + 4*mm, ty - row_h2 + 2*mm, "Total Payable")
        c.setFont(_rf, 11)
        c.drawRightString(rm, ty - row_h2 + 2*mm, _money(total))

        # Tax note
        if tax_type == "cgst_sgst":
            tax_note = f"* CGST & SGST — Buyer and Seller both in UP (State Code {SELLER_STATE_CODE})"
        elif buyer_gstin:
            tax_note = f"* IGST — Buyer ({_state_name(buyer_gstin)}) and Seller (UP-{SELLER_STATE_CODE}) in different states"
        else:
            tax_note = "* IGST — B2C, buyer state not specified"

        c.setFillColor(hex_color(PDF_GREY))
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawRightString(rm, totals_top - box_h - 4*mm, tax_note)

        # ── FOOTER ────────────────────────────────────────────────────────────
        footer_y = 22*mm
        c.setStrokeColor(hex_color("#f0f0f0"))
        c.setLineWidth(0.5)
        c.line(lm, footer_y, rm, footer_y)

        c.setFillColor(hex_color(PDF_GREY))
        c.setFont("Helvetica", 8)
        c.drawString(lm, footer_y - 5*mm, "This is a computer-generated invoice. No physical signature required.")
        c.drawString(lm, footer_y - 10*mm, "Annual subscription — non-refundable after activation.")
        c.drawString(lm, footer_y - 15*mm, "For queries: support@mygenie.in  |  mygenie.in")

        c.setFont("Helvetica", 7)
        c.setFillColor(hex_color("#d1d5db"))
        c.drawString(lm, footer_y - 20*mm, f"{GST_SELLER_NAME}  ·  GSTIN: {GST_SELLER_GSTIN}")

        # Computer generated stamp circle
        cx_stamp = rm - 12*mm
        cy_stamp = footer_y - 12*mm
        c.setStrokeColor(hex_color(PDF_ORANGE))
        c.setFillColor(colors.white)
        c.setLineWidth(1)
        c.circle(cx_stamp, cy_stamp, 12*mm, fill=1, stroke=1)
        c.setFillColor(hex_color(PDF_ORANGE))
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(cx_stamp, cy_stamp + 3*mm, "COMPUTER")
        c.drawCentredString(cx_stamp, cy_stamp - 1*mm, "GENERATED")
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(cx_stamp, cy_stamp - 5*mm, "NO SIG REQ.")

        # ── BOTTOM STRIP (green → orange) ─────────────────────────────────────
        bstrip_h = 3.5*mm
        for i in range(steps):
            t = i / steps
            r = int(0x32 + (0xf2 - 0x32) * t)
            g = int(0x99 + (0x6b - 0x99) * t)
            b = int(0x37 + (0x33 - 0x37) * t)
            c.setFillColor(colors.Color(r/255, g/255, b/255))
            c.rect(i * W/steps, 0, W/steps + 0.5, bstrip_h, fill=1, stroke=0)

        # ── SAVE ──────────────────────────────────────────────────────────────
        c.save()
        buf.seek(0)
        url = cms_storage.get_storage().save(buf.read(), "pdf")
        return url

    except Exception as e:
        logger.error("Invoice generation error: %s", e)
        return None


async def _send_invoice_sms(phone: str, name: str, invoice_no: str, invoice_url: str):
    """Send invoice download link via existing SMS panel (best-effort)."""
    if not (SMS_BASE_URL and SMS_API_KEY):
        logger.info("[Invoice SMS mock] phone=%s invoice=%s url=%s", phone, invoice_no, invoice_url)
        return
    # Build absolute URL for the invoice file
    backend_url = os.environ.get("APP_URL", "")
    full_url = f"{backend_url}{invoice_url}" if invoice_url.startswith("/api") else invoice_url
    message = (
        f"Hi {name.split()[0]}, your MyGenie invoice {invoice_no} is ready. "
        f"Download: {full_url} "
        f"Team MyGenie HOSIGENIE"
    )
    params = {
        "username": SMS_USERNAME,
        "apikey": SMS_API_KEY,
        "apirequest": "Text",
        "sender": SMS_SENDER,
        "route": SMS_ROUTE,
        "mobile": phone,
        "message": message,
        "format": "JSON",
    }
    try:
        async with httpx.AsyncClient(verify=False, timeout=8.0) as client:
            r = await client.get(SMS_BASE_URL, params=params)
        logger.info("Invoice SMS sent to %s: http %s", phone, r.status_code)
    except Exception as e:
        logger.warning("Invoice SMS failed (non-fatal): %s", e)
