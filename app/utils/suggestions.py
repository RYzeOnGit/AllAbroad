from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class University:
    id: str
    name: str
    country: str
    city: str
    languages: list[str]
    degree_levels: list[str]
    subjects: list[str]
    fees_per_year_usd_est: Optional[int]
    ranking_band: Optional[str]
    internships: bool
    placements_strength: str
    notes: list[str]


def _repo_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_universities() -> list[University]:
    path = os.path.join(_repo_root(), "data", "universities_seed.json")
    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)
    unis: list[University] = []
    for u in payload.get("universities", []):
        unis.append(
            University(
                id=str(u["id"]),
                name=str(u["name"]),
                country=str(u["country"]),
                city=str(u.get("city", "")),
                languages=[str(x) for x in u.get("languages", [])],
                degree_levels=[str(x).lower() for x in u.get("degree_levels", [])],
                subjects=[str(x).lower() for x in u.get("subjects", [])],
                fees_per_year_usd_est=u.get("fees_per_year_usd_est"),
                ranking_band=u.get("ranking_band"),
                internships=bool(u.get("internships", False)),
                placements_strength=str(u.get("placements_strength", "unknown")),
                notes=[str(x) for x in u.get("notes", [])],
            )
        )
    return unis


def _score_ranking_band(band: Optional[str]) -> float:
    if not band:
        return 0.0
    mapping = {
        "top_50": 1.0,
        "top_100": 0.85,
        "top_150": 0.7,
        "top_200": 0.6,
    }
    return mapping.get(band, 0.5)


def _normalize(s: str) -> str:
    return " ".join(s.strip().lower().split())


def score_university(
    uni: University,
    *,
    target_country: str,
    degree_level: Optional[str],
    subject: Optional[str],
    budget_usd_per_year: Optional[int],
    language: Optional[str],
) -> tuple[float, list[str], list[str]]:
    """
    Deterministic scoring + explainability (MVP). Returns (score, why, highlights).
    """
    why: list[str] = []
    highlights: list[str] = []

    score = 0.0

    # Country match (hard filter should happen earlier, but keep as signal too)
    if _normalize(uni.country) == _normalize(target_country):
        score += 3.0
        why.append(f"Located in your target country ({uni.country}).")

    # Degree match
    if degree_level:
        if degree_level.lower() in uni.degree_levels:
            score += 1.5
            why.append(f"Offers {degree_level.lower()} programs.")
        else:
            score -= 0.75

    # Subject match
    if subject:
        subj = _normalize(subject)
        if any(subj in s for s in uni.subjects):
            score += 1.5
            why.append(f"Strong fit for {subject} programs.")
        else:
            score -= 0.5

    # Budget fit (soft)
    if budget_usd_per_year is not None and uni.fees_per_year_usd_est is not None:
        if uni.fees_per_year_usd_est <= budget_usd_per_year:
            score += 1.2
            why.append(f"Estimated tuition fits your budget (≈ ${uni.fees_per_year_usd_est:,}/yr).")
            highlights.append("Budget-friendly")
        else:
            # penalize if far over budget
            over = uni.fees_per_year_usd_est - budget_usd_per_year
            score -= min(1.5, over / max(1, budget_usd_per_year) * 1.5)
            why.append(f"Tuition may be above your budget (≈ ${uni.fees_per_year_usd_est:,}/yr).")

    # Language preference
    if language:
        lang = _normalize(language)
        if any(_normalize(l) == lang for l in uni.languages):
            score += 0.6
            why.append(f"Instruction available in {language}.")

    # Ranking / reputation
    rb = _score_ranking_band(uni.ranking_band)
    if rb > 0:
        score += 1.5 * rb
        if uni.ranking_band:
            why.append(f"Ranking band: {uni.ranking_band.replace('_', ' ')}.")
            highlights.append("Strong ranking")

    # Outcomes: internships + placements
    if uni.internships:
        score += 0.7
        why.append("Good internship access / industry links.")
        highlights.append("Internships")

    if uni.placements_strength == "high":
        score += 0.9
        why.append("Strong graduate outcomes/placements signal.")
        highlights.append("Placements")
    elif uni.placements_strength == "medium":
        score += 0.4

    # Notes
    for n in uni.notes[:2]:
        highlights.append(n)

    return score, why[:5], highlights[:5]


def suggest(
    universities: list[University],
    *,
    target_country: str,
    degree_level: Optional[str],
    subject: Optional[str],
    budget_usd_per_year: Optional[int],
    language: Optional[str],
    max_results: int,
    include_alternatives: bool,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    tc = _normalize(target_country)
    subject_n = _normalize(subject) if subject else None
    lang_n = _normalize(language) if language else None

    # Primary pool: target country
    primary = [u for u in universities if _normalize(u.country) == tc]
    alt_pool = [u for u in universities if _normalize(u.country) != tc]

    def to_item(u: University) -> dict[str, Any]:
        sc, why, highlights = score_university(
            u,
            target_country=target_country,
            degree_level=degree_level,
            subject=subject_n,
            budget_usd_per_year=budget_usd_per_year,
            language=lang_n,
        )
        return {
            "id": u.id,
            "name": u.name,
            "country": u.country,
            "city": u.city,
            "score": round(sc, 2),
            "why": why,
            "highlights": highlights,
            "fees_per_year_usd_est": u.fees_per_year_usd_est,
            "ranking_band": u.ranking_band,
        }

    primary_items = sorted([to_item(u) for u in primary], key=lambda x: x["score"], reverse=True)[:max_results]

    alternatives: list[dict[str, Any]] = []
    if include_alternatives:
        # “Alternative with stronger features”: pick top by ranking + placements + internships
        alt_items = [to_item(u) for u in alt_pool]
        alternatives = sorted(alt_items, key=lambda x: x["score"], reverse=True)[: min(6, max_results)]

        # Add a framing line for alternatives
        for a in alternatives:
            a["why"] = (["Alternative option with strong features even outside your target country."] + a["why"])[:6]

    return primary_items, alternatives


