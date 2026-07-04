# Textile Intelligence V2 Roadmap

## Goal

Upgrade the current MVP from a conversation capture tool into a sharper textile-business intelligence system that can:

1. understand Gujarati conversations,
2. return business feedback in English,
3. detect machinery and sourcing opportunities,
4. detect marketing strategy advice,
5. show evidence for major insights,
6. build memory across conversations,
7. turn analysis into clear business decisions.

## Confirmed Client Updates

### 1. Gujarati audio in, English intelligence out

Desired behavior:

- Audio can be mostly Gujarati or Gujarati mixed with English business terms.
- Transcript should preserve spoken content accurately.
- Analysis, summary, tasks, and recommendations should be written in English.

Why this matters:

- The current pipeline is language-agnostic at the schema level, but the transcription request should stop behaving like English-first by default.
- AssemblyAI's prerecorded async speech-to-text supports Gujarati and also allows setting a `language_code` when we know the language ahead of time.

Implementation direction:

- Add a capture-level language selector with `Gujarati`, `English`, and `Auto-detect`.
- Default the production workflow to `Gujarati` for this client account unless changed.
- Continue sending the raw transcript to analysis, but explicitly instruct the model to answer only in English.

Current files to update:

- `src/components/capture-workspace.tsx`
- `src/lib/validation/conversation.ts`
- `src/lib/vendors/assemblyai.ts`
- `src/lib/vendors/openrouter-analysis.ts`
- `src/lib/types.ts`
- `supabase/migrations/...` for a new `source_language` field if we want it stored

Acceptance criteria:

- Gujarati audio transcribes correctly.
- Mixed Gujarati + English business vocabulary remains usable.
- Final summary and business recommendations are always in English.

### 2. Machinery and sourcing opportunity detection

Desired behavior:

- If someone suggests a new machine, factory capability, production method, import lead, or country-specific sourcing edge, the app should flag it as a business opportunity.

Examples the model should catch:

- "I saw a machine in China not yet available in India."
- "This machine can reduce labor cost."
- "You should import this before the market catches up."
- "This supplier can give faster finishing or special weaving."

Implementation direction:

- Extend the AI schema with dedicated fields instead of hiding this inside `newOpportunities`.
- Add structured categories for:
  - `machineryOpportunities`
  - `sourcingOpportunities`
  - `operationalEfficiencyIdeas`
  - `investmentSignals`

Suggested output shape:

```ts
machineryOpportunities: string[]
sourcingOpportunities: string[]
operationalEfficiencyIdeas: string[]
investmentSignals: string[]
```

Trend system update:

- Add new trend categories:
  - `machinery`
  - `sourcing`
  - `operations`

Current files to update:

- `src/lib/types.ts`
- `src/lib/validation/ai-analysis.ts`
- `src/lib/vendors/openrouter-analysis.ts`
- `src/lib/transforms/trend-normalization.ts`
- `src/components/review-editor.tsx`
- `src/app/trends/page.tsx`

Acceptance criteria:

- Machinery suggestions appear in a dedicated review section.
- Sourcing/import opportunities are visible on the conversation page.
- Repeated machinery or sourcing themes show up in trends.

### 3. Marketing strategy advice detection

Desired behavior:

- If a client or advisor suggests changing marketing strategy, the app should identify it as strategic advice, not casual talk.

Examples the model should catch:

- "You should do more physical marketing than digital."
- "Use exhibitions instead of Instagram ads."
- "Your branding should feel more premium."
- "Your salespeople should visit stores directly."

Implementation direction:

- Add dedicated schema fields:

```ts
marketingStrategySuggestions: string[]
salesStrategySuggestions: string[]
brandPositioningSuggestions: string[]
distributionSuggestions: string[]
```

- Add a review section called `Strategy Shifts Suggested`.
- Show them in the dashboard spotlight if they are high-confidence or repeated.

Current files to update:

- `src/lib/types.ts`
- `src/lib/validation/ai-analysis.ts`
- `src/lib/vendors/openrouter-analysis.ts`
- `src/components/review-editor.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/trends/page.tsx`

Acceptance criteria:

- Strategy advice is visible separately from the generic summary.
- Marketing and sales recommendations can be tracked across conversations.

## Recommended High-Value Upgrades

These are the three strongest upgrades beyond the client’s direct asks.

### 4. Evidence-backed insight cards

Product idea:

- Every important insight should show:
  - the insight,
  - why it matters,
  - the transcript snippet or timestamp that supports it.

Why this is high-value:

- Makes the app feel trustworthy and premium.
- Lets the owner verify that the AI did not invent something.
- Improves confidence during client reviews and sales meetings.

Suggested schema addition:

```ts
evidenceHighlights: Array<{
  topic: string
  quote: string
  speaker?: string | null
  startMs?: number | null
  endMs?: number | null
}>
```

UI impact:

- Add `Evidence` chips under major opportunities and strategy suggestions.

### 5. Strategic memory across conversations

Product idea:

- Build higher-level memory that detects repeated business signals across many conversations.

Examples:

- the same machinery suggestion appears in 3 conversations,
- maroon and rust shades keep repeating,
- multiple buyers mention offline marketing,
- the same sourcing country keeps coming up,
- the same concern keeps blocking orders.

Why this is high-value:

- This is where the product starts behaving like an executive intelligence system instead of a note-taking app.
- It creates real defensibility for the app.

Implementation direction:

- Add normalized memory records for recurring strategic topics.
- Build ranking logic for repeated mentions over time.
- Create a `Strategic Memory` block on the trends page.

Suggested trend categories to add:

- `machinery`
- `sourcing`
- `marketing_strategy`
- `sales_strategy`
- `brand_positioning`
- `operations`

### 6. Decision inbox

Product idea:

- The app should not only say what happened. It should say what to do next.

Suggested sections:

- `Act This Week`
- `Investment Opportunities`
- `Marketing Changes To Test`
- `High-Confidence Opportunities`
- `Wait And Watch`

Why this is high-value:

- It turns intelligence into action.
- It feels much more founder-friendly and leadership-friendly.

Suggested schema addition:

```ts
decisionInbox: {
  actThisWeek: string[]
  investmentOpportunities: string[]
  marketingChangesToTest: string[]
  highConfidenceOpportunities: string[]
  waitAndWatch: string[]
}
```

UI impact:

- Add a compact decision panel to the dashboard.
- Add a conversation-level decision box in review.

## Recommended Build Order

### Phase 1: Client-critical intelligence

Build first:

1. Gujarati transcription support
2. English-only analysis output
3. Machinery and sourcing opportunity detection
4. Marketing strategy detection

Why first:

- These are direct client asks.
- They materially improve the product's usefulness without requiring a large system rewrite.

### Phase 2: Trust and explainability

Build next:

1. Evidence-backed insights
2. Better transcript-to-insight linking
3. Better trend normalization for strategy and machinery

Why next:

- This makes the product feel professional and reliable.

### Phase 3: Executive intelligence layer

Build after:

1. Strategic memory across conversations
2. Decision inbox
3. Priority ranking for repeated strategic signals

Why last:

- These upgrades are extremely valuable, but they depend on cleaner structured data from phase 1.

## Concrete Schema Evolution

### Current analysis schema

The current schema in `src/lib/validation/ai-analysis.ts` is strong for textile product insight, but it is too narrow for strategic business advice.

### Proposed V2 schema additions

Add:

```ts
conversationLanguage: string
machineryOpportunities: string[]
sourcingOpportunities: string[]
operationalEfficiencyIdeas: string[]
investmentSignals: string[]
marketingStrategySuggestions: string[]
salesStrategySuggestions: string[]
brandPositioningSuggestions: string[]
distributionSuggestions: string[]
evidenceHighlights: Array<{
  topic: string
  quote: string
  speaker: string | null
  startMs: number | null
  endMs: number | null
}>
decisionInbox: {
  actThisWeek: string[]
  investmentOpportunities: string[]
  marketingChangesToTest: string[]
  highConfidenceOpportunities: string[]
  waitAndWatch: string[]
}
```

Keep existing fields:

- `summary`
- `importantBusinessPoints`
- `clientPreferences`
- `designIdeas`
- `fabricMentions`
- `colorMentions`
- `patternStyleMentions`
- `marketTrendInsights`
- `pricingDiscussion`
- `possibleOrders`
- `followUpTasks`
- `deadlines`
- `clientConcerns`
- `newOpportunities`
- `ignoredCasualTalk`
- `opportunityLevel`
- `nextAction`

## Prompt Upgrade Direction

The analysis prompt in `src/lib/vendors/openrouter-analysis.ts` should explicitly instruct the model to:

1. detect Gujarati or mixed Gujarati-English business language,
2. answer only in English,
3. treat machinery, sourcing, marketing, and business model advice as first-class insights,
4. attach evidence where possible,
5. separate commercial advice from casual social talk.

Prompt additions we should make:

- "The transcript may be Gujarati or Gujarati mixed with English textile/business vocabulary."
- "Return all analysis in English."
- "Flag machinery, sourcing, production, investment, and marketing suggestions as strategic business signals."
- "When possible, support major insights with short transcript evidence."

## UI Changes

### Conversation review page

Add sections for:

- `Machinery Opportunities`
- `Sourcing Opportunities`
- `Marketing Strategy Suggestions`
- `Sales / Distribution Suggestions`
- `Evidence Highlights`
- `Decision Inbox`

### Dashboard

Add cards for:

- `Strategic Advice Captured`
- `Machinery Opportunities`
- `Marketing Changes Suggested`
- `Decision Inbox`

### Trends

Add grouped trend lanes for:

- machinery
- sourcing
- marketing strategy
- sales strategy
- brand positioning
- operations

## Testing Plan

### Unit tests

Add tests for:

- Gujarati-language metadata handling
- new AI schema parsing
- machinery opportunity extraction
- marketing strategy extraction
- evidence highlight validation
- decision inbox serialization

### Integration tests

Add realistic transcripts containing:

- Gujarati textile discussion,
- China machinery discovery,
- physical vs digital marketing advice,
- repeated strategic themes across multiple conversations.

## My Recommendation

The best next implementation step is:

### V2 Sprint 1

1. Gujarati transcription support
2. English-only analysis output
3. Machinery opportunity fields
4. Marketing strategy fields
5. Review-page UI for those new sections

That gives the biggest visible jump in product quality with the lowest risk.

## Source Notes

- AssemblyAI official documentation says its prerecorded async speech-to-text supports Gujarati and allows the optional `language_code` parameter for known spoken audio language.

Reference:

- https://support.assemblyai.com/articles/9106299104-what-languages-do-you-support-

