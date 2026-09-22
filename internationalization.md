# Internationalization

## Goal

Every string a person reads is localized, in every supported locale, respecting the conventions of each language. A missing translation is not a cosmetic defect: it is a raw key rendered to a customer.

Localization is not a feature that gets added later. A string written in the code is a string nobody will find again.

## What Counts as In Scope

Apply this standard to any change that produces text a person reads:

- interface copy, labels, placeholders, empty states, validation messages, tooltips, page titles;
- content rendered outside the application — transactional email, exported document, notification;
- anything derived from stored data that becomes words on a screen: a status, a role, a permission, a category;
- adding a locale, adding a key, or changing how text is resolved.

Out of scope: log lines, internal error identifiers, and developer-facing tooling output.

## The Supported Locales Are ONE List

**There is exactly one place that says which locales exist, and everything else derives from it.** Declaring them a second time anywhere is how a locale comes to exist halfway.

**The second list does not have to be code.** This is the part that gets missed, and it is worth stating plainly: prose counts. A sentence in a contributing guide that says "the three supported languages" is a second list, and it is the worst kind, because no test can fail on a sentence. It goes stale in silence while the code moves on, and the language that was added last ends up half-implemented because nobody ever read about it in an instruction.

**If you write a number of locales, you have created the second list.** Write "every locale in the list" and name the list, never "all three" and never an enumeration.

**Where the list lives matters.** It belongs where every consumer can read it and none of them owns it — not inside the frontend, not inside one service. And it has to be reachable from the tests: a list that can only be reached through a global mock is a list no test can check. If importing the real list from a test is impossible for a technical reason, that reason is a defect in where the list lives, not a fact to work around.

## Adding a Locale

**Enumerate every place that does not derive from the list.** The ones that derive are safe; the ones that do not are where a locale ends up half-supported. Typical offenders: a regular expression matching locale segments in a URL, a label per language in a picker, strings rendered outside the localization provider (an error boundary, a maintenance page), and a second service that keeps its own list of accepted languages.

Whatever that inventory is for a project, it belongs in the project's documentation and it must be kept exhaustive. Prefer removing entries from it by making them derive from the list.

**A test that names a locale to mean "unsupported" breaks the day you support it** — and it may stop being able to fail rather than turning red, which is worse than a failure. Use a code that cannot ever become supported: `zz` is not an ISO 639-1 language code, so `zz-ZZ` is safe forever.

## Keys Are Typed, and a Missing Key Does Not Compile

**The catalogue of keys is a type, and the type is the source of truth.** A locale missing a key fails the typecheck, before anyone sees it.

This is the whole reason to prefer typed catalogues over runtime lookups with a fallback: a fallback turns a missing translation into a silent downgrade, and silence is exactly what let it ship. Fail loudly at build time instead.

**Do not build keys by concatenation.** `t("status." + value)` defeats static analysis, the type system and every tool that finds unused or missing keys. Resolve the value through an explicit, exhaustive mapping written key by key, so a new case fails to compile instead of rendering a raw identifier.

## One Concept, One Catalogue, One Resolver

**Every concept that becomes words has exactly one catalogue entry and exactly one thing that resolves it.** Not one per screen, not one per component, not "the same strings, also here".

The alternative has been measured in this organization. Twelve module names and their descriptions were copied into three catalogues with four hand-written mappings, and they drifted: one module answered to **three different names in the same language** — one where you buy it, another where you renew it, a third where it is granted — and one of the copies attributed a feature to the wrong module.

**A key stops identifying anything the moment two places are allowed to turn it into words.**

Write the resolver exhaustively over the set of values, so a value without copy fails to compile instead of rendering a raw identifier to a customer. Then adding a new value means adding its strings to that one catalogue and to that one resolver, and nothing else.

## The Database Stores Keys, Never Display Text

System reference data — permissions, modules, statuses, roles, categories — stores a **stable key**. The text comes from the catalogues, like every other string.

- The stored value is an identifier, not a sentence. It never changes because the wording changed.
- Adding a value means adding the key, adding its strings in every locale, and adding it to the resolver.
- Do not add `name` or `description` columns to hold display text.

A `name` column is a translation that only exists in one language, and it is the language of whoever wrote the migration.

## Messages Are Whole, Not Assembled

**A sentence is the unit of translation.** Never concatenate translated fragments: word order, agreement and punctuation differ per language, and a translator handed three pieces cannot fix a sentence they never see.

```
// No — the order is a property of the language, not of the code
t("you.have") + " " + count + " " + t("unread.messages")

// Yes — one message, with its parameters
t("unread.messages", { count })
```

**Plurals go through the message format, never through an `if`.** `count === 1` is an English rule. Arabic has six plural categories, Polish four, Japanese one. The message format knows them; your conditional does not.

**Gendered or otherwise varying text goes through a select**, for the same reason.

**Text with inline formatting** — a link, a bold fragment, an embedded component — is one message with tags, not a sentence split around markup. Place the tags on the semantically equivalent words in each language, which is rarely the same position.

## The ICU Apostrophe Trap

In ICU MessageFormat, a straight apostrophe `'` **opens an escape sequence** when the next character is `{`. So the natural French spelling of `l'{organizationName}` silently swallows the placeholder.

Use the typographic apostrophe `’`, which cannot open an escape sequence. In French this is also the correct character typographically, so the rule costs nothing — but it is not a style question, it is a correctness one.

This applies to every stack that speaks ICU MessageFormat, which is most of them.

## Language Conventions Are Part of the Translation

A translation that is literally correct and typographically wrong is not finished:

- **Spanish does not use Title Case** in headings and titles. Sentence case.
- **French** uses a **non-breaking** space before `: ; ! ?` and inside `« »`, and the typographic apostrophe `’`.
- **German** compounds and expands: the same string can grow by a third or more.

Give the translator context. A key whose value is `Open` can be a verb or an adjective, and the translator cannot tell from the string. Name keys for the concept and the place, and add a description where the tooling allows it.

## Format With the Locale, Never by Hand

Numbers, dates, currencies, lists and relative times are formatted by the platform's locale-aware APIs — `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.ListFormat`, `Intl.RelativeTimeFormat` or their equivalents — never assembled with string operations.

- A decimal separator, a thousands separator, a date order and a currency position are all properties of the locale.
- Sorting uses a locale-aware collator, not string comparison. `ä`, `ñ` and `ø` do not sort where their code points say.
- A locale is not a language: `es-MX` and `es-ES` differ in number and date formatting, and in vocabulary.
- Do not use flags to represent languages. A flag is a country.

Temporal values themselves follow the project's temporal standards; this section is only about turning them into text for a person.

## Layout Follows the Language

- Use **logical CSS properties** — `margin-inline-start`, `padding-inline-end`, `text-align: start` — instead of `left` and `right`. Right-to-left support then costs a `dir` attribute instead of a rewrite.
- **Design for expansion.** A layout that only fits the shortest language breaks in the others; fixed widths on labels and buttons are where this shows first.
- Set `lang` correctly on the document and on any fragment in another language. It drives hyphenation, quotation marks and screen-reader pronunciation — see [Accessibility](accessibility.md).

## Review Questions

When reading or reviewing a change that produces text, ask:

- Is every visible string in the catalogues, in every locale the list declares?
- Does anything in this change — code **or prose** — state which locales exist, or how many?
- Is any sentence built by concatenation, or any plural decided by a conditional?
- Does any key get built at runtime from a value?
- Does this concept already have a catalogue and a resolver somewhere else?
- Does any new column store display text instead of a key?
- Are numbers, dates and lists formatted through the locale APIs?
- If a test names a locale, does it name a real one to mean "unsupported"?

## Report the Outcome

When finishing the task, state:

- which keys were added, and that they exist in every locale the list declares;
- which catalogue and which resolver own any new concept;
- any language convention you applied deliberately, and any you could not verify;
- any place you found that declares the locales a second time, whether or not you fixed it.
