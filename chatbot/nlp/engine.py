"""
Lightweight NLP engine using spaCy blank Arabic + PhraseMatcher.
RAM target: < 20MB for the core engine (no full language model loaded).
"""

import re
import spacy
from spacy.matcher import PhraseMatcher
from typing import List, Dict, Optional

nlp = spacy.blank("ar")


def normalize(text: str) -> str:
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
    text = re.sub(r"\u0640", "", text)
    text = re.sub(r"[إأآا]", "ا", text)
    text = text.replace("ة", "ه").replace("ى", "ي")
    return text


class DynamicEntityRegistry:
    """
    Holds dynamically-discovered entity phrases from the ERP DB.
    Refreshed periodically so new products / machines are auto-recognized.
    Normalizes both stored phrases and input text for robust matching.
    """

    def __init__(self):
        self.phrases: Dict[str, List[str]] = {}
        self._matcher: Optional[PhraseMatcher] = None

    def rebuild(self, entity_map: Dict[str, List[str]]):
        self.phrases = entity_map
        matcher = PhraseMatcher(nlp.vocab, attr="TEXT")
        for label, phrases in entity_map.items():
            normalized_phrases = [normalize(p) for p in phrases if p.strip()]
            patterns = [nlp(p) for p in normalized_phrases]
            if patterns:
                matcher.add(label, patterns)
        self._matcher = matcher

    def match(self, text: str) -> List[tuple]:
        if self._matcher is None:
            return []
        doc = nlp(text)
        matches = self._matcher(doc)
        results = []
        for match_id, start, end in matches:
            label = nlp.vocab.strings[match_id]
            span = doc[start:end]
            results.append((label, span.text))
        return results


entity_registry = DynamicEntityRegistry()
