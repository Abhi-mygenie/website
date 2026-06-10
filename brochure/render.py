import asyncio, qrcode
from playwright.async_api import async_playwright

# 1) QR code -> booking
img = qrcode.make("https://www.mygenie.online")
img.save("/app/brochure/qr.png")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"])
        page = await b.new_page()
        await page.goto("file:///app/brochure/master.html", wait_until="networkidle")
        await page.wait_for_timeout(2500)  # let webfonts settle
        await page.pdf(
            path="/app/brochure/MyGenie_Brochure_Master.pdf",
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
        )
        await b.close()
    print("PDF generated")

asyncio.run(main())
