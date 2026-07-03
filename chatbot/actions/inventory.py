"""
Action handlers for inventory / stock-related intents.
"""

from typing import Any, Dict

from database.connection import db
from actions.registry import register


@register("QUERY_STOCK")
async def handle_query_stock(entities: Dict[str, Any], user_id: int) -> str:
    products = entities.get("products", [])

    if products:
        return await _query_specific_stock(products[0])
    return await _query_all_stock_summary()


async def _query_specific_stock(product_name: str) -> str:
    product = db.fetch_one(
        "SELECT id, name, unit, min_stock FROM products WHERE name = %s",
        (product_name,),
    )
    if not product:
        return f"المنتج '{product_name}' غير موجود."

    stocks = db.fetch_all(
        "SELECT w.name AS warehouse, COALESCE(s.quantity, 0) AS qty "
        "FROM warehouses w "
        "LEFT JOIN stock s ON s.warehouse_id = w.id AND s.product_id = %s "
        "ORDER BY w.name",
        (product["id"],),
    )

    total_qty = sum(float(s["qty"]) for s in stocks)
    min_stock = float(product["min_stock"]) if product["min_stock"] else 0

    lines = [
        f"📦 {product['name']} ({product.get('unit', 'قطعة')})",
        f"💰 إجمالي المخزون: {total_qty:.2f}",
    ]
    if min_stock > 0 and total_qty < min_stock:
        lines.append(f"⚠️ تحت حد الأمان! الحد الأدنى: {min_stock:.2f}")

    for s in stocks:
        qty = float(s["qty"])
        if qty > 0:
            lines.append(f"  • {s['warehouse']}: {qty:.2f}")
    return "\n".join(lines)


async def _query_all_stock_summary() -> str:
    summary = db.fetch_all(
        """
        SELECT p.name, COALESCE(SUM(s.quantity), 0) AS qty,
               p.min_stock, p.unit
        FROM products p
        LEFT JOIN stock s ON s.product_id = p.id
        GROUP BY p.id, p.name, p.min_stock, p.unit
        ORDER BY p.name
        """
    )
    if not summary:
        return "لا توجد منتجات في قاعدة البيانات."

    total_products = len(summary)
    low_stock = [r for r in summary if r["min_stock"] and float(r["qty"]) < float(r["min_stock"])]

    lines = [
        f"📊 ملخص المخزون ({total_products} منتج):",
    ]
    for r in summary[:15]:
        qty = float(r["qty"])
        flag = "⚠️" if r["min_stock"] and qty < float(r["min_stock"]) else ""
        lines.append(f"  {flag} {r['name']}: {qty:.2f} {r.get('unit', '')}")
    if len(summary) > 15:
        lines.append(f"  ... و {len(summary) - 15} منتجات أخرى")

    if low_stock:
        lines.append(f"\n⚠️ {len(low_stock)} منتجات تحت حد الأمان")
    return "\n".join(lines)


@register("LOW_STOCK_ALERTS")
async def handle_low_stock_alerts(entities: Dict[str, Any], user_id: int) -> str:
    low = db.fetch_all(
        """
        SELECT p.id, p.name, p.unit, p.min_stock,
               COALESCE(SUM(s.quantity), 0) AS qty
        FROM products p
        LEFT JOIN stock s ON s.product_id = p.id
        WHERE p.min_stock IS NOT NULL
        GROUP BY p.id, p.name, p.unit, p.min_stock
        HAVING COALESCE(SUM(s.quantity), 0) < p.min_stock
        ORDER BY (COALESCE(SUM(s.quantity), 0)::decimal / p.min_stock) ASC
        """
    )
    if not low:
        return "✅ جميع المنتجات ضمن الحدود الآمنة. لا توجد إنذارات."

    lines = [f"⚠️ إنذار مخزون: {len(low)} منتجات تحت حد الأمان:"]
    for r in low:
        qty = float(r["qty"])
        min_stk = float(r["min_stk"])
        deficiency = min_stk - qty
        pct = (qty / min_stk) * 100 if min_stk > 0 else 0
        lines.append(
            f"  • {r['name']}: {qty:.2f} / {min_stk:.2f} "
            f"(نقص {deficiency:.2f}, {pct:.1f}%)"
        )
    return "\n".join(lines)


@register("CREATE_PURCHASE_ORDER")
async def handle_create_purchase_order(entities: Dict[str, Any], user_id: int) -> str:
    products = entities.get("products", [])
    suppliers = entities.get("suppliers", [])
    numbers = entities.get("numbers", [])

    if not products:
        return "يرجى تحديد المنتج المطلوب شراؤه."

    product_name = products[0]
    product = db.fetch_one(
        "SELECT id, name, unit FROM products WHERE name = %s",
        (product_name,),
    )
    if not product:
        return f"المنتج '{product_name}' غير موجود."

    quantity = numbers[0] if numbers else 0
    if quantity <= 0:
        return "يرجى تحديد الكمية المطلوب شراؤها."

    supplier_id = None
    if suppliers:
        supplier = db.fetch_one(
            "SELECT id FROM suppliers WHERE name = %s",
            (suppliers[0],),
        )
        if supplier:
            supplier_id = supplier["id"]

    db.execute(
        """
        INSERT INTO purchase_orders
            (supplier_id, total_amount, status, notes)
        VALUES (%s, 0, 'PENDING', %s)
        """,
        (supplier_id, f"تم الإنشاء عن طريق المساعد الذكي (مستخدم #{user_id})"),
    )

    order_id = db.fetch_one("SELECT lastval() AS id")["id"]

    db.execute(
        """
        INSERT INTO purchase_order_items
            (order_id, product_id, quantity, price, total)
        VALUES (%s, %s, %s, 0, 0)
        """,
        (order_id, product["id"], quantity),
    )

    lines = [
        f"✅ تم إنشاء أمر شراء #{order_id}!",
        f"📦 المنتج: {product['name']}",
        f"⚖️ الكمية: {quantity}",
    ]
    if suppliers:
        lines.append(f"🏢 المورد: {suppliers[0]}")
    return "\n".join(lines)
