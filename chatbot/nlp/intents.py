"""
Intent definitions and classification for Arabic ERP commands.
Uses regex + keyword heuristics (no spaCy dependency here).
"""

import re

INTENT_CREATE_PRODUCTION_ORDER = "CREATE_PRODUCTION_ORDER"
INTENT_QUERY_STOCK = "QUERY_STOCK"
INTENT_QUERY_ORDER_STATUS = "QUERY_ORDER_STATUS"
INTENT_LOW_STOCK_ALERTS = "LOW_STOCK_ALERTS"
INTENT_GENERATE_REPORT = "GENERATE_REPORT"
INTENT_CHAT_HISTORY = "CHAT_HISTORY"
INTENT_HELP = "HELP"
INTENT_CREATE_PURCHASE_ORDER = "CREATE_PURCHASE_ORDER"
INTENT_QUERY_PRODUCTION = "QUERY_PRODUCTION"
INTENT_QUERY_SALES = "QUERY_SALES"
INTENT_QUERY_DOCUMENTS = "QUERY_DOCUMENTS"
INTENT_UNKNOWN = "UNKNOWN"

# Arabic letter normalization: all alef forms -> bare alef, teh marbouta -> heh, alef maqsura -> yeh
_ALEF_RE = re.compile(r"[إأآا]")
_TEH_MARBOUTA_RE = re.compile(r"ة")
_ALEF_MAQSURA_RE = re.compile(r"ى")
_TASHKEEL_RE = re.compile(r"[\u064B-\u065F\u0670]")  # Fathah, Dammah, Kasrah, etc.
_KASHIDA_RE = re.compile(r"\u0640")  # Tatweel


def normalize_arabic(text: str) -> str:
    text = _TASHKEEL_RE.sub("", text)
    text = _KASHIDA_RE.sub("", text)
    text = _ALEF_RE.sub("ا", text)
    text = _TEH_MARBOUTA_RE.sub("ه", text)
    text = _ALEF_MAQSURA_RE.sub("ي", text)
    return text


PATTERNS: list[tuple[str, str, float]] = [
    # Production order creation
    (r"(اعمل|انشاء|انشئ|عمل)\s*(امر\s*انتاج|امر\s*تصنيع|امر)", INTENT_CREATE_PRODUCTION_ORDER, 0.95),
    (r"(انتاج|تصنيع)\s+\d+", INTENT_CREATE_PRODUCTION_ORDER, 0.90),

    # Stock queries
    (r"(كميه|مخزون|متوفر|رصيد|المخزون)\s", INTENT_QUERY_STOCK, 0.90),
    (r"(كم|ما\s*هو\s*المخزون|عندك\s*من)", INTENT_QUERY_STOCK, 0.85),

    # Order status
    (r"(حاله|تتبع|اين)\s*(امر\s*انتاج|امر|الانتاج)", INTENT_QUERY_ORDER_STATUS, 0.90),
    (r"رقم\s*(امر|الانتاج|الطلب)\s*\d+", INTENT_QUERY_ORDER_STATUS, 0.85),

    # Low stock alerts
    (r"(مواد\s*ناقصه|انذار|تحذير\s*مخزون|المواد\s*المنخفضه|عندك\s*انذارات)", INTENT_LOW_STOCK_ALERTS, 0.90),

    # Reports
    (r"(تقرير|تصدير|Excel|excel|PDF)\s*(عن|لـ|المخزون|الانتاج|المشتريات|المبيعات)?", INTENT_GENERATE_REPORT, 0.90),
    (r"(اعمل|اخرج|حضر)\s*(تقرير|ملف)", INTENT_GENERATE_REPORT, 0.85),

    # Chat history
    (r"(اخر\s*رسايل|السجل|التاريخ|اخر\s*محادثه|وريني\s*اخر)", INTENT_CHAT_HISTORY, 0.90),

    # Purchase order
    (r"(امر\s*شراء|شراء|طلب\s*شراء|اشتري)", INTENT_CREATE_PURCHASE_ORDER, 0.90),

    # Production query
    (r"(انتاج|انتاجيه|ماكينه|منتج)\s", INTENT_QUERY_PRODUCTION, 0.80),

    # Sales query
    (r"(مبيعات|عميل|فاتوره\s*بيع|بيع\s*)", INTENT_QUERY_SALES, 0.80),

    # Document queries
    (r"(مستند|ملف|داتا|بيانات|ورقه|ورقة)\s", INTENT_QUERY_DOCUMENTS, 0.90),
    (r"(فيش\s*مستند|اقرا\s*ملف|شوف\s*ملف|افتح\s*ملف|عندك\s*ملفات|عندك\s*مستندات)", INTENT_QUERY_DOCUMENTS, 0.85),
    (r"(ابحث|دور|فبش|قش).*(المستندات|الملفات|البيانات)", INTENT_QUERY_DOCUMENTS, 0.88),
    (r"(ابحث|دور|فبش|قش)\s*(عن|على|في)\s+\S+", INTENT_QUERY_DOCUMENTS, 0.80),

    # Help
    (r"(مساعدة|مساعد|الاوامر|الصلاحيات|شرح|طريقه)", INTENT_HELP, 0.90),
    (r"(hello|hi|مرحبا|اهلا)", INTENT_HELP, 0.70),
]


def classify_intent(text: str) -> tuple[str, float]:
    """
    Returns (intent_name, confidence) for the given Arabic text.
    """
    normalized = normalize_arabic(text)
    best_intent = INTENT_UNKNOWN
    best_score = 0.0

    for pattern, intent, score in PATTERNS:
        if re.search(pattern, normalized, re.UNICODE | re.IGNORECASE):
            if score > best_score:
                best_score = score
                best_intent = intent

    return best_intent, best_score
