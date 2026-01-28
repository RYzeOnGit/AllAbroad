"""Public content API: destinations, testimonials, why-us, CTA, hero stats, and copy."""
import json
import os
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.content import (
    Destination,
    Testimonial,
    WhyUsCard,
    CtaTrustItem,
    HeroStat,
    SiteContent,
)

router = APIRouter(tags=["content"])

# #region agent log
LOG_PATH = r"c:\Users\anony\Desktop\Others\Studies\Confidential\Software Engineer\AllAbroad\.cursor\debug.log"
def _log(loc, msg, data, hid):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps({"location": loc, "message": msg, "data": data, "hypothesisId": hid, "sessionId": "debug-session"}) + "\n")
    except Exception:
        pass
# #endregion


def _split(s: str) -> List[str]:
    if s is None or not str(s).strip():
        return []
    return [p.strip() for p in str(s).split(",") if p.strip()]


@router.get("/content")
async def get_content(session: AsyncSession = Depends(get_session)) -> dict:
    """
    Return all public site content: destinations, testimonials, why-us cards,
    CTA trust items, hero stats, and copy key-values.
    """
    # #region agent log
    _log("content.py:get_content", "get_content called", {}, "H1")
    # #endregion
    # Destinations
    r = await session.execute(
        select(Destination).order_by(Destination.sort_order, Destination.id)
    )
    dests = r.scalars().all()
    destinations = [
        {
            "id": d.id,
            "country": d.country,
            "country_code": d.country_code,
            "flag": d.flag,
            "cities": _split(d.cities),
            "programs": _split(d.programs),
            "image": d.image or "from-indigo-900 to-slate-800",
            "accent": d.accent or "coral",
        }
        for d in dests
    ]
    # #region agent log
    _log("content.py:get_content", "destinations built", {"count": len(destinations)}, "H2")
    # #endregion

    # Testimonials (active only)
    try:
        r = await session.execute(
            select(Testimonial)
            .where(Testimonial.is_active == True)  # noqa: E712
            .order_by(Testimonial.sort_order, Testimonial.id)
        )
        tests = r.scalars().all()
        testimonials = [
            {
                "id": t.id,
                "quote": t.quote,
                "name": t.name,
                "detail": t.detail or "",
                "rating": t.rating if 1 <= t.rating <= 5 else 5,
                "image": getattr(t, "image", None) or "",
            }
            for t in tests
        ]
        # #region agent log
        _log("content.py:get_content", "testimonials built", {"count": len(testimonials)}, "H2")
        # #endregion
    except Exception as e:
        # #region agent log
        _log("content.py:get_content", "testimonials FAILED", {"error": str(e), "type": type(e).__name__}, "H1")
        # #endregion
        raise

    # Why-us cards
    r = await session.execute(
        select(WhyUsCard).order_by(WhyUsCard.sort_order, WhyUsCard.id)
    )
    cards = r.scalars().all()
    why_us = [
        {"id": c.id, "icon": c.icon, "title": c.title, "text": c.text}
        for c in cards
    ]

    # CTA trust items
    r = await session.execute(
        select(CtaTrustItem).order_by(CtaTrustItem.sort_order, CtaTrustItem.id)
    )
    items = r.scalars().all()
    cta_trust = [{"id": i.id, "label": i.label} for i in items]

    # Hero stats
    r = await session.execute(
        select(HeroStat).order_by(HeroStat.sort_order, HeroStat.id)
    )
    stats = r.scalars().all()
    hero_stats = [{"id": s.id, "value": s.value, "label": s.label} for s in stats]

    # Site copy (key -> value)
    r = await session.execute(select(SiteContent))
    rows = r.scalars().all()
    copy = {row.key: row.value for row in rows}

    return {
        "destinations": destinations,
        "testimonials": testimonials,
        "why_us": why_us,
        "cta_trust": cta_trust,
        "hero_stats": hero_stats,
        "copy": copy,
    }
