# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

_Inferred from repository evidence: the product is an Astro website delivered through a Vercel adapter._

## Users

Students and independent learners use the site to study structured technical notes. They need to find a topic quickly, build understanding in sequence, and revisit material without visual friction.

## Product Purpose

Notes is a static academic reference organised by semester and module. It turns concise Markdown source material into accessible, navigable study pages with equations, worked examples, diagrams, and downloadable supporting material.

## Positioning

_Inferred from repository evidence:_ Notes is a source-authored study reference that makes a degree's learning sequence explicit through module structure, prerequisites, and links between notes. Its note corpus is validated as part of the build rather than treated as unstructured page copy.

## Operating Context

_Inferred from repository evidence:_ Readers browse material by semester, module, and prerequisite path, use search to return to a topic, and can retain previously visited notes for offline reading. Contributors write Markdown or MDX files in `docs/`; their filenames determine note order and URLs, while automated checks protect structure, links, and writing conventions.

## Capabilities and Constraints

_Inferred from repository evidence:_

- Astro 7 renders the static note corpus from content collections.
- Notes support KaTeX mathematics, MDX components, prerequisite links, diagrams, and worked solutions.
- A custom validator checks note style, structure, filenames, links, prerequisites, and notebook references during development and builds.
- The site provides full-text search, a graph of note relationships, and offline caching for visited pages.
- Notes can credit multiple authors and offer companion Wolfram notebooks for download.

## Brand Commitments

_Inferred from the existing product record and repository copy:_ The site is named Notes and should remain precise, scholarly, and calm. It is a maintained personal knowledge base, not a generic documentation portal or a course-selling product. Its source is published on GitHub and it welcomes collaborators who contribute notes.

## Evidence on Hand

_Inferred from repository evidence:_ The `docs/` corpus, its associated illustrations in `src/components/illustrations/`, and Wolfram notebooks under `docs/**/notebooks/` are real study material. The homepage describes the notes' origin and ongoing contributions. Future work must not fabricate testimonials, learner outcomes, course accreditation, or institutional affiliation.

## Product Principles

- Put comprehension before ornament.
- Make a topic's place in a learning sequence easy to discover.
- Preserve a stable, low-friction environment for long technical reading.
- Treat authored notes and their links as structured material that deserves validation.
- Keep contribution and source authoring simple while allowing rich explanations.

## Accessibility & Inclusion

Meet WCAG 2.2 AA contrast and keyboard-access expectations. Preserve semantic headings, tables, captions, and text alternatives. Respect reduced-motion preferences. Do not rely on colour alone to communicate a distinction.
