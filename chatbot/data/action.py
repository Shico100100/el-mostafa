"""
Action handler for document Q&A — searches user-uploaded files
and answers questions based on their content.
"""

import os
from typing import Any, Dict

from actions.registry import register
from data.loader import search_documents, list_documents


@register("QUERY_DOCUMENTS")
async def handle_document_query(entities: Dict[str, Any], user_id: int) -> str:
    query = entities.get("document_query", "")
    doc_name = entities.get("document_name", "")

    if doc_name:
        from data.loader import get_document
        doc = get_document(doc_name)
        if not doc:
            return f"📄 المستند `{doc_name}` مش موجود. الموجودين: " + ", ".join(
                d["name"] for d in list_documents()
            )
        text = doc["text"]
        if query:
            lines = [l.strip() for l in text.split("\n") if query in l.lower()]
            preview = "\n".join(lines[:5]) if lines else text[:500]
        else:
            preview = text[:500]
        return f"📄 **{doc_name}** ({len(text)} حرف):\n\n{preview}"

    if query:
        results = search_documents(query)
        if not results:
            doc_list = list_documents()
            if doc_list:
                names = "، ".join(d["name"] for d in doc_list)
                return f"🔍 ملقيتش حاجة عن `{query}` في المستندات. المستندات الموجودة: {names}"
            return "📂 مفيش مستندات في البيانات حالياً. ضيف ملفات في `chatbot/data/`."

        lines = [f"• **{r['name']}** (تطابق {r['score']} مرة)" for r in results]
        best = results[0]
        snippet = best["text"][:300]
        lines.append(f"\n📝 **مقتطف من `{best['name']}`:**\n{snippet}")
        return "\n".join(lines)

    docs = list_documents()
    if not docs:
        return "📂 مفيش مستندات في البيانات حالياً. ضيف ملفات في `chatbot/data/`."
    names = "\n".join(f"  📄 {d['name']} ({d['size']} حرف)" for d in docs)
    return f"📚 **المستندات الموجودة ({len(docs)}):**\n{names}"
