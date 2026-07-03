"""
Dynamic entity extraction — queries ERP system tables to discover
products, machines, users, etc. at runtime.

How Dynamic Lookup Works:
1. On startup (and every N seconds via scheduler), we query
   INFORMATION_SCHEMA + business tables to collect entity names.
2. spaCy PhraseMatcher is rebuilt with these phrases.
3. User messages are matched against the matcher — new products
   or machines added to the ERP are immediately recognized
   without any code change.
"""

import re
from typing import Dict, List, Any
from database.connection import db
from nlp.engine import entity_registry


def discover_products() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        "SELECT id, name, type, unit, cost_price, selling_price, min_stock "
        "FROM products ORDER BY name"
    )
    return rows


def discover_machines() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        "SELECT id, name, status FROM machines ORDER BY name"
    )
    return rows


def discover_users() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        'SELECT id, "firstName" AS first_name, "lastName" AS last_name, email FROM "user" ORDER BY "firstName"'
    )
    return rows


def discover_customers() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        "SELECT id, name, phone, balance FROM customers ORDER BY name"
    )
    return rows


def discover_suppliers() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        "SELECT id, name, phone, balance FROM suppliers ORDER BY name"
    )
    return rows


def discover_molds() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        "SELECT id, name, product_id, cavities, status FROM molds ORDER BY name"
    )
    return rows


def discover_manufacturing_orders() -> List[Dict[str, Any]]:
    rows = db.fetch_all(
        "SELECT id, product_id, quantity_required, quantity_produced, status "
        "FROM manufacturing_orders ORDER BY id DESC LIMIT 200"
    )
    return rows


def build_entity_map() -> Dict[str, List[str]]:
    """Collect all entity phrases from ERP tables into a flat map."""
    entity_map: Dict[str, List[str]] = {
        "PRODUCT": [],
        "MACHINE": [],
        "CUSTOMER": [],
        "SUPPLIER": [],
        "MOLD": [],
        "USER": [],
    }

    for p in discover_products():
        name = p.get("name", "").strip()
        if name:
            entity_map["PRODUCT"].append(name)

    for m in discover_machines():
        name = m.get("name", "").strip()
        if name:
            entity_map["MACHINE"].append(name)
            entity_map["MACHINE"].append(str(m["id"]))

    for c in discover_customers():
        name = c.get("name", "").strip()
        if name:
            entity_map["CUSTOMER"].append(name)

    for s in discover_suppliers():
        name = s.get("name", "").strip()
        if name:
            entity_map["SUPPLIER"].append(name)

    for ml in discover_molds():
        name = ml.get("name", "").strip()
        if name:
            entity_map["MOLD"].append(name)

    for u in discover_users():
        first = (u.get("first_name") or "").strip()
        last = (u.get("last_name") or "").strip()
        full = f"{first} {last}".strip()
        if full:
            entity_map["USER"].append(full)

    return entity_map


def refresh_entities():
    """Rebuild the PhraseMatcher from live ERP data."""
    entity_map = build_entity_map()
    entity_registry.rebuild(entity_map)
    total = sum(len(v) for v in entity_map.values())
    print(f"[Entities] Loaded {total} phrases from ERP ({len(entity_map)} categories)")


_NUMBER_RE = re.compile(r"(\d+(?:[.,]\d+)?)")


def extract_numbers(text: str) -> List[float]:
    return [float(n.replace(",", "")) for n in _NUMBER_RE.findall(text)]


def normalize_arabic(text: str) -> str:
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
    text = re.sub(r"\u0640", "", text)
    text = re.sub(r"[إأآا]", "ا", text)
    text = text.replace("ة", "ه").replace("ى", "ي")
    return text


_DOC_NAME_RE = re.compile(r"(?:ملف|مستند|ورقه|ورقة)\s+(\S+(?:\.\w+)?)", re.IGNORECASE)
_QUERY_RE = re.compile(r"(?:دور|ابحث|فبش|قش)\s*(?:عن|على|في)?\s+(.+?)$", re.IGNORECASE)
_STRIP_DOC_WORDS = re.compile(r"^(?:في|على|عن)?\s*(?:المستندات|الملفات|البيانات)\s*(?:عن|على|في)?\s*", re.IGNORECASE)
_STRIP_DOC_WORDS_END = re.compile(r"\s*(?:في|على)?\s*(?:المستندات|الملفات|البيانات)\s*$", re.IGNORECASE)


def extract_entities(text: str) -> Dict[str, Any]:
    """
    Returns a dict of recognised entity categories mapped to matched values,
    plus any extracted numeric values.
    """
    normalized = normalize_arabic(text)
    result: Dict[str, Any] = {
        "products": [],
        "machines": [],
        "customers": [],
        "suppliers": [],
        "molds": [],
        "users": [],
        "numbers": extract_numbers(text),
        "order_id": None,
        "document_name": None,
        "document_query": None,
    }

    for label, value in entity_registry.match(normalized):
        key = label.lower() + "s"
        if key in result and value not in result[key]:
            result[key].append(value)

    order_match = re.search(r"(?:رقم\s*)?(?:أمر\s*)?(\d+)", normalized)
    if order_match:
        result["order_id"] = int(order_match.group(1))

    doc_match = _DOC_NAME_RE.search(normalized)
    if doc_match:
        result["document_name"] = doc_match.group(1)

    if not result["document_name"]:
        qm = _QUERY_RE.search(text)
        if qm:
            q = qm.group(1).strip()
            q = _STRIP_DOC_WORDS.sub("", q).strip()
            q = _STRIP_DOC_WORDS_END.sub("", q).strip()
            if len(q) > 2:
                result["document_query"] = q

    return result
