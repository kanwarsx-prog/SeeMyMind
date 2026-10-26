"""Local PII Pseudonymization & Rehydration Engine.

Provides deterministic client-side / local tokenization for Zero-LLM PII boundaries.
Sensitive student identities, parent contacts, emails, and school names are replaced
with synthetic tokens before external AI calls and re-hydrated prior to rendering.
"""

import re
from typing import Any


class PIIAnonymizer:
    @staticmethod
    def extract_entity_tokens(
        pupil_name: str | None = None,
        guardian_names: list[str] | None = None,
        school_name: str | None = None,
        extra_entities: dict[str, str] | None = None,
    ) -> dict[str, str]:
        """Builds a replacement dictionary mapping real sensitive values to generic tokens."""
        mapping: dict[str, str] = {}

        if pupil_name and pupil_name.strip():
            clean_name = pupil_name.strip()
            mapping[clean_name] = "[PUPIL_NAME]"
            parts = clean_name.split()
            if len(parts) > 1:
                # Also redact first name individually if > 2 chars
                if len(parts[0]) >= 3:
                    mapping[parts[0]] = "[PUPIL_FIRST_NAME]"
                if len(parts[-1]) >= 3:
                    mapping[parts[-1]] = "[PUPIL_LAST_NAME]"

        if guardian_names:
            for i, g_name in enumerate(guardian_names, start=1):
                if g_name and g_name.strip():
                    mapping[g_name.strip()] = f"[GUARDIAN_{i}]"

        if school_name and school_name.strip():
            mapping[school_name.strip()] = "[SCHOOL_NAME]"

        if extra_entities:
            for real_val, token in extra_entities.items():
                if real_val and real_val.strip():
                    mapping[real_val.strip()] = token

        return mapping

    @classmethod
    def anonymize_text(cls, text: str, entity_mapping: dict[str, str]) -> tuple[str, dict[str, str]]:
        """Replaces entities and common PII patterns (UK phone numbers, emails) with tokens.

        Returns (anonymized_text, reverse_rehydration_map).
        """
        if not text:
            return text, {}

        anonymized = text
        rehydration_map: dict[str, str] = {}

        # 1. Replace explicit entity names (longest match first to avoid partial collision)
        sorted_entities = sorted(entity_mapping.keys(), key=len, reverse=True)
        for entity in sorted_entities:
            token = entity_mapping[entity]
            pattern = re.compile(rf"\b{re.escape(entity)}\b", re.IGNORECASE)
            if pattern.search(anonymized):
                anonymized = pattern.sub(token, anonymized)
                rehydration_map[token] = entity

        # 2. Redact email addresses
        email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
        emails_found = email_pattern.findall(anonymized)
        for i, email in enumerate(emails_found, start=1):
            token = f"[EMAIL_{i}]"
            anonymized = anonymized.replace(email, token)
            rehydration_map[token] = email

        # 3. Redact UK phone numbers (e.g. 020 7946 0192, 07123 456789, +44 ...)
        phone_pattern = re.compile(r"(?:\+44\s?\(?0\)?\s?|0)(?:\d\s?){9,10}\b")
        phones_found = phone_pattern.findall(anonymized)
        for i, phone in enumerate(phones_found, start=1):
            clean_phone = phone.strip()
            token = f"[PHONE_{i}]"
            anonymized = anonymized.replace(clean_phone, token)
            rehydration_map[token] = clean_phone

        return anonymized, rehydration_map

    @classmethod
    def anonymize_messages(
        cls,
        messages: list[dict[str, Any]],
        entity_mapping: dict[str, str],
    ) -> tuple[list[dict[str, Any]], dict[str, str]]:
        """Processes an entire chat conversation history, scrubbing PII from content."""
        anonymized_messages = []
        combined_rehydration_map: dict[str, str] = {}

        for msg in messages:
            msg_copy = dict(msg)
            content = msg_copy.get("content")
            if isinstance(content, str):
                anon_content, r_map = cls.anonymize_text(content, entity_mapping)
                msg_copy["content"] = anon_content
                combined_rehydration_map.update(r_map)
            anonymized_messages.append(msg_copy)

        return anonymized_messages, combined_rehydration_map

    @staticmethod
    def rehydrate_text(text: str, rehydration_map: dict[str, str]) -> str:
        """Restores real names and values into the final response text."""
        if not text or not rehydration_map:
            return text

        rehydrated = text
        # Replace tokens back with real entities
        for token, original in rehydration_map.items():
            rehydrated = rehydrated.replace(token, original)

        # Catch common fallback tokens if pupil name wasn't dynamically assigned
        if "[PUPIL_NAME]" in rehydrated:
            rehydrated = rehydrated.replace("[PUPIL_NAME]", rehydration_map.get("[PUPIL_NAME]", "the pupil"))
        if "[PUPIL_FIRST_NAME]" in rehydrated:
            rehydrated = rehydrated.replace("[PUPIL_FIRST_NAME]", rehydration_map.get("[PUPIL_FIRST_NAME]", "the pupil"))

        return rehydrated
