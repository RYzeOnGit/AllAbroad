"""Seed default content for the public site (destinations, testimonials, why-us, etc.).

Runs automatically on backend startup if content tables are empty.
Also runnable: python -m app.seed_content
"""
import asyncio
import logging
from sqlmodel import select

from app.database import init_db, async_session_maker
from app.models.content import (
    Destination,
    Testimonial,
    WhyUsCard,
    CtaTrustItem,
    HeroStat,
    SiteContent,
)

logger = logging.getLogger(__name__)

DESTINATIONS = [
    ("UK", "GB", "🇬🇧", "London, Edinburgh, Manchester", "Undergraduate, Postgraduate, Pathway", "from-indigo-900 to-slate-800", "coral"),
    ("Australia", "AU", "🇦🇺", "Sydney, Melbourne, Brisbane", "Undergraduate, Postgraduate, Research", "from-teal-800 to-slate-800", "coral"),
    ("Canada", "CA", "🇨🇦", "Toronto, Vancouver, Montreal", "Undergraduate, Postgraduate, Co-op", "from-rose-900 to-slate-800", "coral"),
    ("Germany", "DE", "🇩🇪", "Berlin, Munich, Frankfurt", "Undergraduate, Postgraduate, STEM", "from-amber-900/90 to-slate-800", "coral"),
    ("Japan", "JP", "🇯🇵", "Tokyo, Kyoto, Osaka", "Undergraduate, Postgraduate, Language", "from-rose-800 to-slate-800", "coral"),
    ("Netherlands", "NL", "🇳🇱", "Amsterdam, Rotterdam, Utrecht", "Undergraduate, Postgraduate, English-taught", "from-orange-900/80 to-slate-800", "coral"),
]

# (quote, name, detail, rating, image_emoji). image can be "" for default GraduationCap icon.
TESTIMONIALS = [
    ("AllAbroad didn't just help me get into my dream program—they made the entire process feel like an adventure. From visa prep to finding flatmates in London, they were there every step of the way.", "Sarah Chen", "Business, London • 2023", 5, "🎓"),
    ("I was nervous about studying in a new country. My advisor walked me through every step and even helped me with cultural tips. Best decision I ever made.", "Sofia Martinez", "International Relations, Amsterdam • 2023", 5, "🌍"),
    ("The personalized program matching was incredible. I found options I'd never considered, and the visa support was flawless. 10/10 would recommend.", "James Okonkwo", "MBA, Toronto • 2024", 5, "💡"),
    ("From navigating the Tube to landing an internship at a fintech startup, they helped me discover a version of myself I never knew existed.", "Marcus Williams", "Data Science, London • 2023", 5, "🎓"),
]

WHY_US = [
    ("Compass", "Personalized Paths", "We match you with programs that fit your goals, budget, and dreams."),
    ("Shield", "Visa Expertise", "98% success rate. We guide you through every step of the process."),
    ("Users", "Dedicated Advisors", "One-on-one support from application to arrival and beyond."),
    ("Sparkles", "Beyond the Brochure", "Real insights on campuses, cities, and life abroad."),
    ("Globe", "50+ Countries", "From classic destinations to emerging hubs—your options are global."),
    ("Heart", "Students First", "We're dreamers and travelers who put your journey at the center."),
]

CTA_TRUST = ["Free consultation", "No obligation", "98% visa success"]

HERO_STATS = [("15K+", "Students"), ("98%", "Visa Success"), ("4.9", "Rating")]

SITE_COPY = {
    "hero_badge": "50+ Countries • 200+ Universities",
    "hero_headline_1": "Your Next Chapter",
    "hero_headline_2": "Starts Abroad",
    "hero_description": "Discover world-class education and life-changing adventures. We help thousands of students find the right program and make their study abroad dreams a reality.",
    "hero_card_title": "Ready for Adventure?",
    "hero_card_subtitle": "500+ students joined us this month. Start your journey today.",
    "cta_heading": "Your Adventure Awaits",
    "cta_description": "Get tailored program recommendations and expert guidance. Start with a free consultation—no strings attached.",
}


async def seed_content() -> None:
    """Seed destinations, testimonials, why-us, CTA trust, hero stats, and copy if tables are empty."""
    await init_db()

    async with async_session_maker() as session:
        r = await session.execute(select(Destination).limit(1))
        if r.scalar_one_or_none() is not None:
            logger.info("Content already seeded (destinations present); skipping.")
            return

        for i, (country, code, flag, cities, programs, image, accent) in enumerate(DESTINATIONS):
            session.add(
                Destination(
                    country=country,
                    country_code=code,
                    flag=flag,
                    cities=cities,
                    programs=programs,
                    image=image,
                    accent=accent,
                    sort_order=i,
                )
            )

        for i, (quote, name, detail, rating, image) in enumerate(TESTIMONIALS):
            session.add(
                Testimonial(quote=quote, name=name, detail=detail, rating=rating, image=image or "", is_active=True, sort_order=i)
            )

        for i, (icon, title, text) in enumerate(WHY_US):
            session.add(WhyUsCard(icon=icon, title=title, text=text, sort_order=i))

        for i, label in enumerate(CTA_TRUST):
            session.add(CtaTrustItem(label=label, sort_order=i))

        for i, (value, label) in enumerate(HERO_STATS):
            session.add(HeroStat(value=value, label=label, sort_order=i))

        for key, value in SITE_COPY.items():
            session.add(SiteContent(key=key, value=value))

        await session.commit()
        logger.info("Content seeded: destinations, testimonials, why-us, cta_trust, hero_stats, site copy.")


if __name__ == "__main__":
    asyncio.run(seed_content())
