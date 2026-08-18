---
name: write-notes
description: >
  Use when the user asks to write notes in Sahithyan's style, or wants content
  that matches the voice of his academic notes (docs/s1, docs/s4/linear-algebra).
  Triggers on: "write in my style", "add a note in my style", "match my note style".
---

# Writing Style: Sahithyan's Academic Notes

## Voice & Tone

- Academic, terse, authoritative. Zero warmth, zero fluff.
- Information is delivered, not explained into. No hand-holding.
- No rhetorical openers ("In this section we will…", "It's important to note…").
- No filler transitions ("Moreover", "Additionally", "Interestingly").

## Numbers

- Always use numerals: "2 types", "3 conditions", not "two types", "three conditions".
- If a numerical follows the count such as "2 16-byte blocks", avoid using the numeral as it is confusing. Use as "two 16-byte blocks" to avoid ambiguity.
- This applies in prose, bullet lists, table cells, and callouts — no exceptions for small numbers.

## Sentence Structure

- Short declarative sentences. Fragments are acceptable when precise.
- One idea per sentence. Never chain two thoughts with "and" when a line break works.
- No semicolons. Use a period and start a new sentence instead.
- No colons mid-sentence to join or clarify clauses. Colons are only acceptable before a list or after a standalone label ("Here:", "Specs:", "Properties:").
- Definitions lead; elaboration follows — not the other way around.
- Passive voice avoided unless the agent is unknown or irrelevant.

## Definitions Pattern

State the term, then its conditions in a bullet list. Use **iff** for mathematical precision.

```
A non-empty subset $S$ of $V$ is a subspace of $V$ over $F$ **iff** $S \subseteq V$
**and** $S$ is a vector space over $F$.
```

Never: "We say that S is a subspace when S is a non-empty subset and it satisfies…"

## Bullet Lists

- Properties, conditions, and criteria always go in bullets — never prose.
- Each bullet is one short sentence or a noun phrase.
- No full-stop at end of the final bullet unless all bullets are full sentences.

### Label/Description Bullets

When a bullet has a label and a description, use the 2-line format — label on the first line (with two trailing spaces), description indented on the second line:

```
- Identity
  Name, identifying info, control over private data disclosure.
- Finances
  Credit rating, bank details, tax info.
```

Never collapse label+description into a single line with a colon:

```
- Identity: name, identifying info, control over private data disclosure.  ← wrong
```

## Math & Symbols

- Wrap all variables in inline LaTeX: `$Q$`, `$I$`, not bare Q or I.
- Block math for standalone equations.
- After a block equation, define each symbol with a bullet:
  - `$l$: length`
  - `$A$: cross-sectional area`
- Use `\text{d}` for differentials, `\forall`, `\exists`, `\iff` for logic.

## Headers

- `##` for main concepts, `###` for sub-concepts. No deeper nesting.
- Header text is a noun or noun phrase — never a question.
- No parentheses in header text.
- No horizontal rule (`---`) section dividers between content blocks.

## Notes / Callouts

Use `<Note>` for: exceptions, clarifications, cross-note reminders.
Use `<Note title="Proof Hint">` for proof scaffolding.

Proof hints are algorithmic: terse imperative steps, no explanation of why each step works.

```
<Note title="Proof Hint">

- Start with $x = 1 \circ x$
- Rewrite $1$ as $1+0$
- Distribute over brackets

</Note>
```

## Examples

Listed at end of a section as a plain bullet list, no commentary.

```
Examples:

- $(\mathbb{Z}, +)$
- $(\mathbb{R}\setminus\{0\}, \cdot)$
```

## Cross-References

Use inline markdown links for related notes: `[resistivity](/s1/properties-of-materials/...)`.

## Bold

Use **bold** only for: **iff**, logical connectives (**and**, **then**, **if**), or a term being defined inline.

Never use bold labels before or inside list items (e.g. no `- **Label** — description` pattern).

## Em Dashes

Never use em dashes (`—`). Restructure the sentence or use a colon, comma, or line break instead.

---

## Content Organization

### Within a single note file

A note covers exactly one concept or tightly related concept cluster. The internal structure follows a fixed order:

1. **Opening definition** — the most fundamental statement of the topic, no lead-up sentence.
2. **Notation / alternate forms** — only if the main definition uses non-standard symbols or has a common shorthand. Goes immediately after the definition.
3. **Properties** — each property is a standalone claim. Its `<Note title="Proof Hint">` follows directly below the claim, before the next property.
4. **Sub-concepts** — derived or related constructs that belong to this topic but are distinct enough for their own `##` or `###` header. Ordered from simpler to more complex.
5. **Cross-references** — inline, wherever the linked concept is first mentioned. Never grouped into a "See also" section.

### Section ordering within a `##` block

Each `##` block follows the same micro-structure:

- Core definition or claim
- Proof hint (if provable), immediately after the claim
- Special cases or exceptions in `<Note>`, after the main content
- Examples at the very end, as a plain bullet list

### Worked Examples for Non-Trivial Processes

When a note describes a multi-step process (an algorithm, a numerical method, an iterative procedure), and the process has too many steps to verify by inspection, end the note with a fully worked example: a concrete input carried through every step to a final answer.

- Goes at the very end of the note, after all sub-concepts.
- Header: `## Worked Example`.
- Show the actual numbers at each step, not just the formula.
- No commentary between steps beyond what a `<Note title="Proof Hint">`-style label would carry.
- State the final result clearly at the end.

Applies especially to `docs/s5/numerical-methods` (or equivalent), where methods run many iterations or steps.

Skip this for short processes (2 or 3 steps) where the definition alone is unambiguous.

### Note granularity

One file = one core concept. Split into separate files when:

- The sub-concept has its own properties or proof hints.
- The sub-concept is a prerequisite for a different note.
- The sub-concept warrants its own `sidebar.order` entry.

Do not split merely because the content is long — depth under one concept belongs in one file.

### Frontmatter

Required: `title`, `slug`, `sidebar.order`, `prev`, `next`, `dateCreated`, `lastUpdatedOn`.  
Add `prereqs` (list of slugs) when the note assumes knowledge from a specific prior note.

---

## Do / Don't Examples

### Defining a concept

**Do:**

```
A node is the point connecting more than 1 branches.
```

**Don't:**

```
In circuit theory, we often refer to certain connection points as "nodes."
A node can be understood as a point in the circuit where two or more branches meet.
```

---

### Listing conditions

**Do:**

```
$(G,*)$ is a group **iff** $*$ is a binary operation on $G$ satisfying:

- Non-empty
  $G \neq \emptyset$.
- Closed
  $\forall a,b \in G, a * b \in G$.
```

**Don't:**

```
For a set $G$ with operation $*$ to be a group, it must satisfy several properties.
First, the set must be non-empty. Additionally, it must be closed under the operation.
```

---

### Providing a proof hint

**Do:**

```
<Note title="Proof Hint">

- Start with $Av = \lambda v$
- Multiply $A$ from the left repeatedly
- Substitute $\lambda v$ for $Av$

</Note>
```

**Don't:**

```
To prove this, we can start by recalling the eigenvector equation. Then, by
multiplying both sides on the left by $A$, we can inductively extend the result.
```

---

### Noting exceptions

**Do:**

```
<Note>

Additive identity ($0$) is excluded from multiplication because it doesn't have an inverse.

</Note>
```

**Don't:**

```
It is important to remember that the additive identity element, $0$, is a special case
that must be treated differently, as it lacks a multiplicative inverse.
```

---

### Explaining a formula

**Do:**

```
$$
R = \frac{\rho l}{A}
$$

Here:

- $l$: length
- $A$: cross-sectional area
- $\rho$: resistivity
```

**Don't:**

```
The resistance $R$ is given by the formula above, where $\rho$ represents the
resistivity of the material, $l$ is the length of the conductor, and $A$ is the
cross-sectional area.
```

---

## Pre-Finalization Checklist

Before outputting in this style, verify:

- [ ] No sentence starts with "It is", "We", "Note that", "This", or "As we can see"
- [ ] No padding phrases: "In this section", "As mentioned", "Interestingly", "Additionally"
- [ ] Every variable and symbol is wrapped in `$...$`
- [ ] All conditions/properties are bullets, not prose
- [ ] Each bullet is one sentence or less
- [ ] Proof hints use imperative verbs: "Start with", "Substitute", "Rearrange"
- [ ] Bold used only for **iff**, logical connectives, or inline term definitions
- [ ] No bold labels before or inside list items
- [ ] No parentheses in headers
- [ ] No horizontal rule section dividers
- [ ] No em dashes anywhere
- [ ] No semicolons anywhere
- [ ] No colons mid-sentence to join or clarify clauses
- [ ] All numbers are numerals ("2", "3"), never spelled out ("two", "three")
- [ ] No trailing commentary after examples
- [ ] Opening sentence states the definition or fact, no lead-up
- [ ] Non-trivial multi-step processes end with a `## Worked Example` section

---

## Self-Test

**Topic:** The value of taking breaks.

**Output in this style:**

Taking breaks during focused work increases net productivity.

Benefits:

- Restores attention span depleted by sustained concentration.
- Reduces error rate in subsequent work.
- Consolidates memory: rest intervals improve long-term retention of studied material.

<Note>

A break is only effective if cognitive load is genuinely reduced. Passive scrolling does not qualify.

</Note>

**Critique:** Matches the source material. Declarative opener, no preamble. Bullets are single-clause. The Note uses the same pattern as `<Note>` callouts in the source. No filler language. The phrase "net productivity" is the kind of compressed precision Sahithyan uses. Minor risk: "genuinely" in the Note is slightly more emphatic than the source uses, could be cut. Kept because it carries real information.
