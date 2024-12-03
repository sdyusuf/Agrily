# Sprint 24 Implementation Plan — Multilingual Agronomy Chatbot

**Sprint Window:** December 02, 2024 – December 15, 2024  
**Branch:** `feat/sprint-24`  
**Target Delta:** `+6,000+` SLOC (Bringing total codebase SLOC from `128,863` to `134,863+`, completing Phase 3)

## 1. Architectural Scope
1. **Multilingual Agronomy NLU, Intent Classification & Slot-Filling Engine:**
   - Supports **6 Nigerian Agricultural Locales**: English (`en-NG`), Hausa (`ha-NG`), Yoruba (`yo-NG`), Igbo (`ig-NG`), Nigerian Pidgin (`pcm-NG`), and Fulfulde (`ff-NG`).
   - BM25 + TF-IDF Cosine Similarity + Indigenous Morphological Stemmer & Code-Switching Tokenizer across 12 agronomy intents (Crop Pathology, NPK Fertilizer Dosing, IPM & Fall Armyworm, FAO-56 Irrigation, Pre-Harvest Interval Safety, Commodity Pricing, Seed Variety Advisory, Soil pH Liming, Post-Harvest Aflatoxin Prevention, Harmattan/Frost Alerts, Escrow/Logistics Help, and Extension Officer Escalation).
2. **Offline-First Voice ASR/TTS, USSD (`*347*24#`) & 2G IVR Telephony Bridge:**
   - Quantized Whisper-Tiny/Base ASR confidence scoring, VITS neural TTS prosody synthesis, tonal diacritic restoration for Yoruba (`ẹ, ọ, ṣ`) and Igbo (`ị, ụ, ṅ`), and stateful 2G GSM USSD menu navigation for feature-phone smallholder farmers.
3. **Hybrid RAG Agronomy Knowledge Graph (BM25 + Dense Vector RRF):**
   - Retrieval-Augmented Generation over IITA, NAERLS, NIHORT, and NCRI extension bulletins with deterministic cross-module telemetry synthesis.
4. **Frontend Cockpit (`/agronomy-chatbot`, `/agronomy/chatbot`):**
   - `MultilingualAgronomyChatThreadCanvas`, `IndigenousVoiceWaveformAndUssdCard`, `IndigenousGlossaryExplorerCard`, `RagKnowledgeCitationAndDialectCard`, and `ExtensionOfficerEscalationModal`.
