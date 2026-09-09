"""CR-19 Phase 3 — Ad Spend CSV parsers.

Supports:
  - Meta Ads Manager export (Campaign + Ad Set level, period-total)
  - Google Ads Campaign report export (Campaign level, period-total)

Auto-detects platform from column headers.
"""
import csv
import io
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class SpendRow:
    campaign:     str
    ad_set:       Optional[str]
    spend:        float
    impressions:  Optional[int]
    clicks:       Optional[int]
    meta_results: Optional[int]   # Meta's own "Results" — NOT used for CPL
    currency:     str = "INR"
    # CR-19 Phase B
    keyword:      Optional[str] = None
    # CR-24 new optional fields
    search_term:  Optional[str] = None
    match_type:   Optional[str] = None
    headline:     Optional[str] = None
    placement:    Optional[str] = None
    age_range:    Optional[str] = None
    gender:       Optional[str] = None
    reach:        Optional[int] = None
    frequency:    Optional[float] = None
    ad_name:      Optional[str] = None


@dataclass
class ParseResult:
    source: str                    # "google" | "meta"
    period_start: Optional[str]    # YYYY-MM-DD
    period_end: Optional[str]      # YYYY-MM-DD
    rows: list = field(default_factory=list)
    total_spend: float = 0.0
    row_count: int = 0
    warnings: list = field(default_factory=list)


def _to_float(val: str) -> float:
    if not val or val.strip() in ("", "-", "--"):
        return 0.0
    return float(val.replace(",", "").strip())


def _to_int(val: str) -> Optional[int]:
    if not val or val.strip() in ("", "-", "--"):
        return None
    try:
        return int(float(val.replace(",", "").strip()))
    except ValueError:
        return None


def _strip_bom(content: bytes) -> tuple[str, str]:
    """Decode content handling UTF-8 BOM, UTF-16 LE/BE. Returns (text, delimiter)."""
    # UTF-16 LE/BE BOM (Google Ads exports)
    if content[:2] in (b"\xff\xfe", b"\xfe\xff"):
        text = content.decode("utf-16", errors="replace")
        # Check any of first 5 lines for tab delimiter
        delim = "\t" if any("\t" in ln for ln in text.splitlines()[:5]) else ","
        return text, delim
    # UTF-8 BOM (Meta exports sometimes)
    if content.startswith(b"\xef\xbb\xbf"):
        content = content[3:]
    return content.decode("utf-8", errors="replace"), ","


def detect_platform(content: bytes) -> str:
    """Return platform key based on column headers."""
    text, _ = _strip_bom(content)
    sample = "\n".join(text.splitlines()[:10]).lower()

    # Google Search Terms: has "search term" column
    if "search term" in sample and ("campaign" in sample or "ad group" in sample):
        return "google_search_terms"
    # Google Ads ad copy: has "headline 1" or "final url" + "campaign"
    if ("headline 1" in sample or "final url" in sample or "ad type" in sample) and "campaign" in sample:
        return "google_ads"
    # Meta breakdown (placement/demographic)
    if "amount spent" in sample and ("placement" in sample or "age" in sample or "gender" in sample):
        return "meta_breakdown"
    # Meta ad-level: has "reach" AND "frequency"
    if "amount spent" in sample and "reach" in sample and "frequency" in sample:
        return "meta_ad"
    # Existing: Meta campaign/adset
    if "amount spent" in sample:
        return "meta"
    # Keywords report — check BEFORE campaign
    if "keyword" in sample and ("ad group" in sample or "match type" in sample):
        return "google_keywords"
    if "campaign status" in sample:
        return "google"
    return "unknown"


def parse_meta_csv(content: bytes) -> ParseResult:
    """Parse Meta Ads Manager campaign + ad set report CSV."""
    text, delimiter = _strip_bom(content)
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)

    result = ParseResult(source="meta", period_start=None, period_end=None)
    headers = reader.fieldnames or []

    # Locate spend column (handle currency variants)
    spend_col = next(
        (h for h in headers if "amount spent" in h.lower()),
        None,
    )
    if not spend_col:
        raise ValueError("Could not find 'Amount spent' column in Meta CSV")

    for row in reader:
        campaign = (row.get("Campaign name") or "").strip()
        # Skip footer / summary rows
        if not campaign or campaign.lower() in ("total", ""):
            continue

        spend = _to_float(row.get(spend_col, "0"))
        ad_set = (row.get("Ad set name") or "").strip() or None

        # Auto-detect period from first non-empty row
        if result.period_start is None:
            result.period_start = (row.get("Reporting starts") or "").strip() or None
            result.period_end   = (row.get("Reporting ends")   or "").strip() or None

        r = SpendRow(
            campaign=campaign,
            ad_set=ad_set,
            spend=spend,
            impressions=_to_int(row.get("Impressions", "")),
            clicks=None,
            meta_results=_to_int(row.get("Results", "")),
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No data rows found in Meta CSV")

    logger.info("parse_meta_csv: %d rows, total spend=%.2f, period=%s–%s",
                result.row_count, result.total_spend,
                result.period_start, result.period_end)
    return result


def parse_google_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Campaign report CSV (UTF-16 LE, tab-separated, no date column)."""
    text, delimiter = _strip_bom(content)

    # Google CSVs have metadata rows before the actual header.
    # Header row contains "Campaign status" and "Campaign".
    lines = text.splitlines()
    header_idx = None
    for i, line in enumerate(lines):
        cols = [c.strip() for c in line.split(delimiter)]
        if "Campaign status" in cols and "Campaign" in cols:
            header_idx = i
            break

    if header_idx is None:
        raise ValueError("Could not locate header row in Google Ads CSV. "
                         "Expected a row containing 'Campaign status' and 'Campaign'.")

    cleaned = "\n".join(lines[header_idx:])
    reader = csv.DictReader(io.StringIO(cleaned), delimiter=delimiter)
    result = ParseResult(
        source="google",
        period_start=period_start,
        period_end=period_end,
    )

    for row in reader:
        campaign = (row.get("Campaign") or "").strip()
        # Skip footer / summary rows
        if not campaign or campaign.lower() in ("total", "") or campaign == "--":
            continue

        cost_raw = row.get("Cost", "0")
        spend = _to_float(cost_raw)

        # Skip truly zero-spend rows (paused campaigns)
        if spend == 0:
            continue

        currency = (row.get("Currency code") or "INR").strip()
        r = SpendRow(
            campaign=campaign,
            ad_set=None,
            spend=spend,
            impressions=_to_int(row.get("Impr.", "")),
            clicks=_to_int(row.get("Clicks", "")),
            meta_results=None,
            currency=currency,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No non-zero spend rows found in Google Ads CSV")

    logger.info("parse_google_csv: %d rows, total spend=%.2f, period=%s–%s",
                result.row_count, result.total_spend, period_start, period_end)
    return result


def parse_google_keywords_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Keywords Performance report CSV.

    Expected columns include: Keyword, Campaign, Ad group, Match type,
    Clicks, Impr., Cost, Currency code.
    """
    text, delimiter = _strip_bom(content)
    lines = text.splitlines()

    # Find header row — contains "Keyword" and ("Ad group" or "Match type")
    header_idx = None
    for i, line in enumerate(lines):
        cols_lower = [c.strip().lower() for c in line.split(delimiter)]
        if "keyword" in cols_lower and ("ad group" in cols_lower or "match type" in cols_lower):
            header_idx = i
            break

    if header_idx is None:
        raise ValueError("Could not locate header row in Google Ads Keywords CSV. "
                         "Expected a row containing 'Keyword' and 'Ad group'.")

    cleaned = "\n".join(lines[header_idx:])
    reader = csv.DictReader(io.StringIO(cleaned), delimiter=delimiter)
    result = ParseResult(
        source="google_keywords",
        period_start=period_start,
        period_end=period_end,
    )

    for row in reader:
        kw = (row.get("Keyword") or row.get("Search term") or "").strip()
        campaign = (row.get("Campaign") or "").strip()
        # Skip footer / summary / empty rows
        if not kw or kw.lower() in ("total", "") or kw == "--":
            continue
        if not campaign or campaign.lower() in ("total", ""):
            continue

        cost_raw = row.get("Cost", "0")
        spend = _to_float(cost_raw)

        # Skip zero-spend keywords (paused or no impressions)
        if spend == 0:
            continue

        currency = (row.get("Currency code") or "INR").strip()
        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad group") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impr.", "")),
            clicks=_to_int(row.get("Clicks", "")),
            meta_results=None,
            currency=currency,
            keyword=kw,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No non-zero spend keywords found in Google Ads Keywords CSV")

    logger.info("parse_google_keywords_csv: %d rows, total spend=%.2f, period=%s–%s",
                result.row_count, result.total_spend, period_start, period_end)
    return result


def parse_google_search_terms_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Search Terms Performance report.
    Expected columns: Search term, Campaign, Ad group, Match type, Clicks, Impr., Cost, Currency code.
    """
    text, delimiter = _strip_bom(content)
    lines = text.splitlines()

    header_idx = None
    for i, line in enumerate(lines):
        cols_lower = [c.strip().lower() for c in line.split(delimiter)]
        if "search term" in cols_lower and "campaign" in cols_lower:
            header_idx = i
            break

    if header_idx is None:
        raise ValueError("Could not locate header row. Expected 'Search term' and 'Campaign' columns.")

    cleaned = "\n".join(lines[header_idx:])
    reader  = csv.DictReader(io.StringIO(cleaned), delimiter=delimiter)
    result  = ParseResult(source="google_search_terms", period_start=period_start, period_end=period_end)

    for row in reader:
        st       = (row.get("Search term") or "").strip()
        campaign = (row.get("Campaign") or "").strip()
        if not st or st.lower() in ("total", "", "--"):
            continue
        if not campaign or campaign.lower() in ("total", ""):
            continue
        spend = _to_float(row.get("Cost", "0"))
        if spend == 0:
            continue
        currency   = (row.get("Currency code") or "INR").strip()
        match_type = (row.get("Match type") or "").strip() or None
        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad group") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impr.", "")),
            clicks=_to_int(row.get("Clicks", "")),
            meta_results=None,
            currency=currency,
            keyword=st,
            search_term=st,
            match_type=match_type,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No non-zero spend search terms found in Google Ads Search Terms CSV")

    logger.info("parse_google_search_terms_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result


def parse_google_ads_csv(content: bytes, period_start: str, period_end: str) -> ParseResult:
    """Parse Google Ads Ad Performance report.
    Expected columns: Ad, Campaign, Ad group, Headline 1, Headline 2, Clicks, Impr., Cost.
    """
    text, delimiter = _strip_bom(content)
    lines = text.splitlines()

    header_idx = None
    for i, line in enumerate(lines):
        cols_lower = [c.strip().lower() for c in line.split(delimiter)]
        if ("headline 1" in cols_lower or "final url" in cols_lower) and "campaign" in cols_lower:
            header_idx = i
            break

    if header_idx is None:
        raise ValueError("Could not locate header. Expected 'Headline 1' or 'Final URL' and 'Campaign' columns.")

    cleaned = "\n".join(lines[header_idx:])
    reader  = csv.DictReader(io.StringIO(cleaned), delimiter=delimiter)
    result  = ParseResult(source="google_ads", period_start=period_start, period_end=period_end)

    for row in reader:
        campaign = (row.get("Campaign") or "").strip()
        if not campaign or campaign.lower() in ("total", "", "--"):
            continue
        spend = _to_float(row.get("Cost", "0"))
        if spend == 0:
            continue
        h1 = (row.get("Headline 1") or "").strip()
        h2 = (row.get("Headline 2") or "").strip()
        headline = " | ".join(p for p in [h1, h2] if p) or None
        currency = (row.get("Currency code") or "INR").strip()
        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad group") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impr.", "")),
            clicks=_to_int(row.get("Clicks", "")),
            meta_results=None,
            currency=currency,
            headline=headline,
            ad_name=(row.get("Ad") or "").strip() or None,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No non-zero spend ads found in Google Ads Ad Performance CSV")

    logger.info("parse_google_ads_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result


def parse_meta_ad_csv(content: bytes) -> ParseResult:
    """Parse Meta Ads Manager Ad-level report with Reach and Frequency.
    Expected: Campaign name, Ad set name, Ad name, Amount spent, Impressions, Reach, Frequency.
    Frequency > 4.0 = creative fatigue signal.
    """
    text, delimiter = _strip_bom(content)
    reader  = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    result  = ParseResult(source="meta_ad", period_start=None, period_end=None)
    headers = reader.fieldnames or []

    spend_col = next((h for h in headers if "amount spent" in h.lower()), None)
    if not spend_col:
        raise ValueError("Could not find 'Amount spent' column in Meta Ad CSV")

    for row in reader:
        campaign = (row.get("Campaign name") or "").strip()
        if not campaign or campaign.lower() in ("total", ""):
            continue
        if result.period_start is None:
            result.period_start = (row.get("Reporting starts") or "").strip() or None
            result.period_end   = (row.get("Reporting ends")   or "").strip() or None

        spend     = _to_float(row.get(spend_col, "0"))
        reach     = _to_int(row.get("Reach", ""))
        freq_raw  = row.get("Frequency", "")
        frequency = None
        if freq_raw and freq_raw.strip() not in ("", "-", "--"):
            try:
                frequency = float(freq_raw.replace(",", "").strip())
            except ValueError:
                pass
        if frequency is None:
            impr = _to_int(row.get("Impressions", ""))
            if impr and reach and reach > 0:
                frequency = round(impr / reach, 2)

        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad set name") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impressions", "")),
            clicks=None,
            meta_results=_to_int(row.get("Results", "")),
            reach=reach,
            frequency=frequency,
            ad_name=(row.get("Ad name") or "").strip() or None,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No data rows found in Meta Ad CSV")

    logger.info("parse_meta_ad_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result


def parse_meta_breakdown_csv(content: bytes) -> ParseResult:
    """Parse Meta Ads Manager breakdown report (Placement or Age/Gender).
    Detects breakdown dimension from headers automatically.
    """
    text, delimiter = _strip_bom(content)
    reader  = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    result  = ParseResult(source="meta_breakdown", period_start=None, period_end=None)
    headers = reader.fieldnames or []

    spend_col = next((h for h in headers if "amount spent" in h.lower()), None)
    if not spend_col:
        raise ValueError("Could not find 'Amount spent' column in Meta Breakdown CSV")

    placement_col = next((h for h in headers if "placement" in h.lower()), None)
    age_col       = next((h for h in headers if h.lower() in ("age", "age range")), None)
    gender_col    = next((h for h in headers if "gender" in h.lower()), None)

    for row in reader:
        campaign = (row.get("Campaign name") or "").strip()
        if not campaign or campaign.lower() in ("total", ""):
            continue
        if result.period_start is None:
            result.period_start = (row.get("Reporting starts") or "").strip() or None
            result.period_end   = (row.get("Reporting ends")   or "").strip() or None

        spend     = _to_float(row.get(spend_col, "0"))
        placement = (row.get(placement_col) or "").strip() if placement_col else None
        age_range = (row.get(age_col) or "").strip()       if age_col       else None
        gender    = (row.get(gender_col) or "").strip()    if gender_col    else None

        r = SpendRow(
            campaign=campaign,
            ad_set=(row.get("Ad set name") or "").strip() or None,
            spend=spend,
            impressions=_to_int(row.get("Impressions", "")),
            clicks=None,
            meta_results=_to_int(row.get("Results", "")),
            placement=placement or None,
            age_range=age_range or None,
            gender=gender or None,
        )
        result.rows.append(r)
        result.total_spend += spend

    result.row_count = len(result.rows)
    if result.row_count == 0:
        raise ValueError("No data rows found in Meta Breakdown CSV")

    logger.info("parse_meta_breakdown_csv: %d rows, total=%.2f", result.row_count, result.total_spend)
    return result


def parse_csv(content: bytes, period_start: str = "", period_end: str = "") -> ParseResult:
    """Auto-detect platform and parse. Supports 7 report types."""
    platform = detect_platform(content)
    if platform == "google_search_terms":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads Search Terms CSV")
        return parse_google_search_terms_csv(content, period_start, period_end)
    if platform == "google_ads":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads Ad Performance CSV")
        return parse_google_ads_csv(content, period_start, period_end)
    if platform == "meta_ad":
        return parse_meta_ad_csv(content)
    if platform == "meta_breakdown":
        return parse_meta_breakdown_csv(content)
    if platform == "meta":
        return parse_meta_csv(content)
    if platform == "google_keywords":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads Keywords CSV")
        return parse_google_keywords_csv(content, period_start, period_end)
    if platform == "google":
        if not period_start or not period_end:
            raise ValueError("period_start and period_end are required for Google Ads CSV")
        return parse_google_csv(content, period_start, period_end)
    raise ValueError(
        "Unrecognised CSV format. Supported: Google Campaign, Keywords, Search Terms, Ad Performance; "
        "Meta Campaign+AdSet, Ad (with Reach/Frequency), Placement/Demographic breakdown."
    )
