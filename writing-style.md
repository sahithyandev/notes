# Writing Style Guide

Technical reference documentation style — terse, definitive, structurally dependent. Optimized for lookup, not teaching. Reader is assumed domain-familiar.

## Rules

### Sentence Construction

1. Keep sentences under 15 words. If exceeded, split.
2. Drop the verb in definitions when possible: "Root — the topmost node in a tree."
3. Never use a subordinate clause when two short sentences work.
4. No compound-complex sentences.

### Vocabulary and Tone

5. Use domain-specific terminology without explaining basic terms.
6. Never use metaphors, analogies, or figurative language.
7. Never use intensifiers ("very," "extremely," "quite").
8. Never hedge — no "might," "perhaps," "arguably," "generally speaking."
9. No first-person. No second-person except imperative ("Run the command.").

### Structure and Organization

10. Always lead with the term or concept, never with background or motivation.
11. Use bullet points or numbered lists for any set of properties, types, or examples.
12. Use headers as the only navigational signal — no transitional phrases between sections.
13. Group examples as a cluster under a label; don't intersperse them in prose.

### Mathematical and Notation Style

14. Use LaTeX notation inline without apology or translation.
15. State the formula first; prose clarification (if any) follows.
16. Use "iff" and logical quantifiers (∀, ∃) freely.

### Punctuation

17. End fragments with periods.
18. Use em dashes (—) to restate or elaborate inline.
19. Use "Aka." parenthetically for alternate terminology.
20. Bold key terms on first appearance.

## Stylistic Traits

- Declarative brevity — sentences rarely exceed 15 words
- Fragment-heavy definitions — verbs dropped; noun-phrase construction dominates
- Definition-first ordering — term → definition → properties → examples; never background-first
- No preamble — jumps straight into technical content with zero setup
- No hedging — no "might," "arguably," "could be seen as"; every statement is definitive
- No metaphors or analogies — explanation is always literal and technical
- No first-person — entirely impersonal
- Structure over transitions — headers and bullets replace logical connectors
- Parenthetical alternate terms — "Aka. surge chamber", "(curves upwards in the middle)"
- Em dashes for restatement — used to expand or rephrase in the same breath
- Mathematical notation as prose replacement — equations carry the explanatory load
- Periods on fragments — grammatical fragments end with periods, consistently
- Minimal adjectives — only functional ones ("high," "constant," "small"); nothing evaluative
- Bold for key terms — first occurrence of a technical term is bolded
- `<Note>` blocks for asides — clarifications that don't belong in the main flow

## Reference

| Dimension         | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| Tone              | Formal, neutral, instructional                                           |
| Voice             | Impersonal; no first-person                                              |
| Sentence length   | Short (5–15 words); fragments permitted and common                       |
| Paragraph length  | 2–5 lines; frequently replaced by bullet lists                           |
| Transitions       | None — structure is organizational, not argumentative                    |
| Examples          | List-based, concrete, grouped under a label                              |
| Hedging           | None — all statements are definitive                                     |
| Notation          | Mathematical/logical notation used freely and without translation        |
| Distinctive marks | Em dashes, "Aka.", fragment-with-period, bold key terms, `<Note>` blocks |
| Pacing            | Dense and fast; no padding                                               |

## Example

Cache memory — a small, fast memory layer between the CPU and main memory. Stores frequently accessed data. Reduces average memory access time. Organized into levels: L1 (fastest, smallest), L2, L3 (slowest, largest).

Cache hit: requested data is found in cache. Cache miss: data must be fetched from main memory — expensive. Hit rate $h$ and miss penalty $t_m$ determine effective access time:

$$T_{eff} = h \cdot t_{cache} + (1 - h) \cdot t_m$$

Replacement policies — which block to evict on a miss.

- LRU (Least Recently Used) — evicts the block unused for the longest time.
- FIFO — evicts the oldest block regardless of recency.
- Random — evicts a randomly chosen block. No overhead. Poor locality.

Write-through vs. write-back determines when dirty cache lines are flushed to main memory.
