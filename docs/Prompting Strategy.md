---
title: Prompting Strategy
type: Documentation
---
# Prompting Strategy

## LLM Usage in MoodSync
The core functionality of MoodSync relies on Large Language Models (LLMs) to interpret user emotional state from collective emoji inputs and map them to musical attributes. This ensures that the generated playlists accurately reflect the "vibe" of the room.

### Current Implementation
- **Model:** Google Gemini 1.5 Flash (and previously exploring 2.5 Flash).
- **Function:** Analyzes emoji combinations and converts them into song attributes (e.g., valence, energy, danceability).
- **Status:** Functional, but identified as a potential high-cost center for production-scale deployments.

## Cost Optimization & Model Exploration
To ensure the long-term sustainability and scalability of MoodSync, we are exploring more cost-effective LLM alternatives.

### Problem Statement
While Gemini 1.5 Flash is highly capable, the per-token cost for a high-volume real-time application like MoodSync can become significant. As we move toward production and full release, reducing inference costs is a priority.

### Target Model: Gemma 3
We are currently researching and planning tests for **Gemma 3**, Google's latest open-weight model family.

#### Gemma 3 Capabilities:
- **Multimodality:** Native support for both text and image processing (starting from 4B parameters), which could allow for future enhancements (e.g., analyzing user-uploaded photos for mood).
- **Efficiency:** Optimized to run on minimal hardware (as small as a single GPU/TPU), making it ideal for cost-efficient self-hosting or cheaper inference services.
- **Performance:** Benchmarks show that Gemma 3 (particularly 12B and 27B) can outperform Gemini 1.5 Flash in specific reasoning and task-oriented benchmarks.
- **Context Window:** Up to 128,000 tokens, more than sufficient for our current emoji-to-attribute mapping.
- **Multilingual Support:** Support for 140+ languages, ensuring MoodSync remains globally accessible.

### Transition Plan
1.  **Benchmarking:** Conduct direct comparisons between Gemini 1.5 Flash and Gemma 3 (specifically the 4B or 12B variants) using current MoodSync prompt sets.
2.  **Accuracy Verification:** Ensure the mood mapping remains accurate and "human-like" under the smaller model.
3.  **Infrastructure Assessment:** Evaluate the cost-benefit ratio of hosting Gemma 3 vs. using an API service.
4.  **Phased Rollout:** If successful, migrate non-critical background tasks first, followed by the core playlist generation engine.

---
**Related Documents:**
- [Architecture & Tech Stack](./Architecture & Tech Stack.md)
- [Features & Limitations](./Features & Limitations.md)
