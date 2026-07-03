"""
Action handlers for manufacturing-related intents.
"""

from typing import Any, Dict
from datetime import date

from database.connection import db
from actions.registry import register


@register("CREATE_PRODUCTION_ORDER")
async def handle_create_production_order(entities: Dict[str, Any], user_id: int) -> str:
    products = entities.get("products", [])
    numbers = entities.get("numbers", [])
    machines = entities.get("machines", [])

    if not products:
        return "لم أتمكن من تحديد المنتج. يرجى ذكر اسم المنتج المطلوب."

    product_name = products[0]
    product = db.fetch_one(
        "SELECT id, name, unit FROM products WHERE name = %s",
        (product_name,),
    )
    if not product:
        return f"المنتج '{product_name}' غير موجود في قاعدة البيانات."

    quantity = numbers[0] if numbers else 0
    if quantity <= 0:
        return "لم أتمكن من تحديد الكمية المطلوبة."

    machine_name = machines[0] if machines else None
    machine_id = None
    if machine_name:
        machine = db.fetch_one(
            "SELECT id FROM machines WHERE name = %s",
            (machine_name,),
        )
        if machine:
            machine_id = machine["id"]

    db.execute(
        """
        INSERT INTO manufacturing_orders
            (product_id, quantity_required, quantity_produced, status, priority, due_date, notes)
        VALUES (%s, %s, 0, 'PENDING', 'MEDIUM', %s, %s)
        """,
        (product["id"], quantity, date.today().isoformat(),
         f"تم الإنشاء عن طريق المساعد الذكي (مستخدم #{user_id})"),
    )

    lines = [
        f"✅ تم إنشاء أمر إنتاج بنجاح!",
        f"📦 المنتج: {product['name']}",
        f"⚖️ الكمية: {quantity} {product.get('unit', 'قطعة')}",
    ]
    if machine_name:
        lines.append(f"⚙️ الماكينة: {machine_name}")
    return "\n".join(lines)


@register("QUERY_ORDER_STATUS")
async def handle_query_order_status(entities: Dict[str, Any], user_id: int) -> str:
    order_id = entities.get("order_id")
    if not order_id:
        numbers = entities.get("numbers", [])
        order_id = numbers[0] if numbers else None

    if not order_id:
        return "يرجى تحديد رقم أمر الإنتاج. مثال: حالة أمر 42"

    order = db.fetch_one(
        """
        SELECT mo.id, p.name AS product_name, mo.quantity_required,
               mo.quantity_produced, mo.status, mo.priority, mo.due_date
        FROM manufacturing_orders mo
        LEFT JOIN products p ON mo.product_id = p.id
        WHERE mo.id = %s
        """,
        (int(order_id),),
    )
    if not order:
        return f"لم يتم العثور على أمر الإنتاج رقم {order_id}."

    status_map = {
        "PENDING": "قيد الانتظار",
        "IN_PROGRESS": "قيد التنفيذ",
        "COMPLETED": "مكتمل",
        "CANCELLED": "ملغي",
    }
    priority_map = {
        "LOW": "منخفضة",
        "MEDIUM": "متوسطة",
        "HIGH": "عالية",
        "URGENT": "عاجلة",
    }

    return (
        f"📋 أمر إنتاج #{order['id']}\n"
        f"📦 المنتج: {order['product_name']}\n"
        f"📊 الحالة: {status_map.get(order['status'], order['status'])}\n"
        f"⚡ الأولوية: {priority_map.get(order['priority'], order['priority'])}\n"
        f"🎯 المطلوب: {order['quantity_required']}\n"
        f"✅ المنتج: {order['quantity_produced']}\n"
        f"📅 تاريخ الاستحقاق: {order['due_date'] or 'غير محدد'}"
    )


@register("QUERY_PRODUCTION")
async def handle_query_production(entities: Dict[str, Any], user_id: int) -> str:
    machines = entities.get("machines", [])
    products = entities.get("products", [])

    if products:
        product = db.fetch_one(
            "SELECT id, name FROM products WHERE name = %s",
            (products[0],),
        )
        if not product:
            return f"المنتج '{products[0]}' غير موجود."
        total = db.fetch_one(
            "SELECT COALESCE(SUM(quantity_produced), 0) AS total "
            "FROM manufacturing_orders WHERE product_id = %s",
            (product["id"],),
        )
        return f"📊 إجمالي الإنتاج للمنتج '{product['name']}': {total['total']}"

    if machines:
        total = db.fetch_one(
            "SELECT COALESCE(SUM(quantity_produced), 0) AS total "
            "FROM manufacturing_orders mo "
            "JOIN production_schedules ps ON mo.id = ps.mold_id "
            "WHERE ps.machine_id = (SELECT id FROM machines WHERE name = %s)",
            (machines[0],),
        )
        return f"📊 إجمالي الإنتاج على الماكينة '{machines[0]}': {total['total']}"

    # General production summary
    counts = db.fetch_all(
        "SELECT status, COUNT(*) AS cnt FROM manufacturing_orders GROUP BY status"
    )
    lines = ["📊 ملخص الإنتاج:"]
    for c in counts:
        lines.append(f"  • {c['status']}: {c['cnt']}")
    return "\n".join(lines)
