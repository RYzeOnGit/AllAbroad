"""Content models for public site: destinations, testimonials, why-us, CTA, hero."""
from typing import Optional
from sqlmodel import SQLModel, Field


class Destination(SQLModel, table=True):
    """Destination/country card for the Destinations section."""

    __tablename__ = "destinations"

    id: Optional[int] = Field(default=None, primary_key=True)
    country: str = Field(max_length=120, index=True)
    country_code: str = Field(max_length=10, index=True)  # e.g. GB, AU, CA
    flag: str = Field(max_length=20, default="")  # emoji or icon identifier
    cities: str = Field(max_length=500, default="")  # comma-separated
    programs: str = Field(max_length=500, default="")  # comma-separated
    image: str = Field(max_length=200, default="from-indigo-900 to-slate-800")  # Tailwind gradient classes
    accent: str = Field(max_length=50, default="coral")
    sort_order: int = Field(default=0, index=True)


class Testimonial(SQLModel, table=True):
    """Student testimonial for the Student Stories carousel."""

    __tablename__ = "testimonials"

    id: Optional[int] = Field(default=None, primary_key=True)
    quote: str = Field(max_length=2000)
    name: str = Field(max_length=200)
    detail: str = Field(max_length=200, default="")  # e.g. "Business, London • 2023"
    rating: int = Field(default=5)  # 1–5
    image: str = Field(max_length=20, default="")  # optional emoji for avatar (e.g. 🎓, 💡). If DB lacks this column: ALTER TABLE testimonials ADD COLUMN image VARCHAR(20) DEFAULT '';
    is_active: bool = Field(default=True, index=True)
    sort_order: int = Field(default=0, index=True)


class WhyUsCard(SQLModel, table=True):
    """Feature card for the Why Us section."""

    __tablename__ = "why_us_cards"

    id: Optional[int] = Field(default=None, primary_key=True)
    icon: str = Field(max_length=80)  # lucide icon name: Compass, Shield, Users, etc.
    title: str = Field(max_length=200)
    text: str = Field(max_length=1000)
    sort_order: int = Field(default=0, index=True)


class CtaTrustItem(SQLModel, table=True):
    """Trust/bullet item under the CTA block (e.g. Free consultation, No obligation)."""

    __tablename__ = "cta_trust_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    label: str = Field(max_length=200)
    sort_order: int = Field(default=0, index=True)


class HeroStat(SQLModel, table=True):
    """Statistic in the Hero section (e.g. 15K+ Students, 98% Visa Success)."""

    __tablename__ = "hero_stats"

    id: Optional[int] = Field(default=None, primary_key=True)
    value: str = Field(max_length=80)  # e.g. "15K+", "98%", "4.9"
    label: str = Field(max_length=120)  # e.g. "Students", "Visa Success"
    sort_order: int = Field(default=0, index=True)


class SiteContent(SQLModel, table=True):
    """Key-value store for section copy (hero, CTA, etc.)."""

    __tablename__ = "site_content"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(max_length=120, unique=True, index=True)
    value: str = Field(max_length=4000)
