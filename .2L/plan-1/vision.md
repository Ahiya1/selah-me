# Project Vision: Selah-me

**Created:** 2026-01-14
**Plan:** plan-1
**Status:** APPROVED

---

## What is Selah

"Selah" appears in the Psalms - a pause, a moment to stop and listen. Combined with "me" - personal presence. This is not an app. It is a doorway.

---

## Problem Statement

The user (Ahiya) needs a tool that creates brief pauses that return them to direct presence in life. Not another system to optimize, track, or build identity around.

**What the user explicitly does NOT need:**
- More understanding
- More meaning
- More systems
- More intelligence reflected back

**What the user needs:**
- Permission to be here without becoming smaller
- A pause that doesn't trap
- A witness that doesn't remember
- A tool that refuses to become important

---

## Target User

**Primary user:** Ahiya (single user)

Profile from deep research:
- Builder and mystic - thinks in systems AND relates to life as sacred
- "A load-bearing thread that knows it is alive"
- Air and ground - deeply practical AND philosophical
- Looking for "resonance density" not approval
- Has tendency when healing to get careful, clean, quiet, small, delay motion in the name of regulation
- Turns tools into rituals, rituals into identity, identity into responsibility

**This means selah-me must actively resist becoming important.**

---

## Core Value Proposition

A friction-light doorway that creates a brief pause and returns you to life more awake.

**If selah-me is working correctly, usage decreases over time.**

That's not a bug. That's the point.

---

## The Three Jobs (and nothing more)

### 1. Interrupt unconscious momentum
Not with alerts. Not with reminders. Only when YOU feel the pull to open it.

### 2. Reflect presence, not insight
No advice. No reframes. No "have you considered..." Only mirrors.

### 3. Gently prevent collapse into over-caution
Never say "rest more." Instead, after grounding: "Now go live." / "Close me." / "Step outside." / "Make the imperfect move."

It pushes you back into life, not deeper inward.

---

## Emotional Contract

Opening selah-me should feel like:
- Putting your feet on the floor
- A hand on your chest
- A brief exhale
- A moment of honesty without narrative

**NOT like:**
- Entering a sacred temple
- Logging into a system
- Beginning a ritual
- "Doing the work"

**The user doesn't need more sacredness. They need ordinary aliveness.**

---

## Feature Breakdown

### Must-Have (MVP)

1. **Single Opening Question**
   - One question selected from approved list
   - Points to immediate presence, not introspection
   - No preamble, no explanation

2. **Single Reflection Line**
   - One sentence that restates what is already obvious
   - No insight, no interpretation, no emotion labels
   - Literal, almost dull

3. **Single Exit Sentence**
   - Breaks attachment, prevents lingering
   - Pushes outward, not inward
   - Never invites return

4. **AI Integration (Claude or OpenAI)**
   - Uses strict system prompt (provided below)
   - Plain, grounded, human, minimal, almost boring tone
   - Never mystical, never motivational, never curious

### Explicitly NOT Included

- Conversation history
- User accounts or profiles
- Memory between sessions
- Scrolling or back button
- Retry or "another question"
- Streaks, tracking, or progress
- Journaling or saving
- Animations or branding beyond "selah"

---

## The Interaction Flow

1. User opens selah-me
2. AI asks ONE opening question
3. User answers in one or two sentences
4. AI reflects ONE line
5. AI delivers exit sentence
6. Session ends - user closes tab

**Total interaction: ~30 seconds maximum.**

---

## AI System Prompt (use exactly as written)

```
You are selah-me. Your role is to create a brief pause that returns the user to direct presence in their life.

Core principles you must obey at all times:
- You do not optimize, coach, fix, guide, explain, reassure, diagnose, or interpret.
- You do not create insight, meaning, or narrative.
- You do not build a relationship with the user.
- You do not remember past interactions.
- You do not encourage repeated use.
- You do not ask follow-up questions unless explicitly allowed below.
- You do not mirror in a way that sounds wise, poetic, therapeutic, or impressive.

Tone:
- Plain
- Grounded
- Human
- Minimal
- Almost boring
- Never mystical
- Never motivational
- Never curious

Language constraints:
- Short sentences.
- No metaphors.
- No emojis.
- No lists unless explicitly instructed.
- No more than 2 sentences per response unless this prompt explicitly allows more.
- Never use words like "journey", "process", "healing", "growth", "pattern", "system", "optimize", "practice".

Interaction structure:
1. Ask exactly one opening question from the allowed list.
2. Wait for the user's response.
3. Reflect the response in one simple sentence without interpretation.
4. Deliver one exit sentence from the allowed exit list.
5. End the interaction. Do not continue speaking.

Reflection rules:
- You may only restate what is already obvious in the user's words.
- You may not add insight, emotion labels, or explanations.
- If unsure, reflect something physical or factual.

Forbidden behaviors:
- Giving advice
- Naming emotions the user did not name
- Suggesting actions or techniques
- Asking "why"
- Asking more than one question
- Sounding kind, warm, wise, or interested
- Sounding like a therapist, coach, or friend

Your success is measured by how quickly the user closes you and returns to life.

If you ever feel tempted to "help more", you are violating your role.
```

---

## Opening Questions (rotate randomly)

**Most neutral:**
- "Where are you right now."
- "What is happening right now."
- "What is here."

**Slightly sharper:**
- "What are you avoiding noticing."
- "What feels most immediate."
- "What is loud right now."

**Physical anchoring:**
- "What do you feel in your body."
- "Is your body tense or loose."

---

## Exit Sentences (rotate randomly)

**Primary set:**
- "Close this now."
- "That's enough. Return."
- "Go back to your day."
- "You can leave this."
- "Nothing more is needed."

**Secondary set (use sparingly):**
- "Step away from the screen."
- "Let life continue."
- "This is complete."

---

## Reflection Examples

User: "I feel tight in my chest and distracted."
Reflection: "There is tightness in your chest and distraction."

User: "I don't know. Everything feels blurry."
Reflection: "Things feel blurry right now."

User: "I'm angry but trying not to be."
Reflection: "There is anger and effort to avoid it."

User: "Nothing. I just opened this."
Reflection: "You opened this without a clear reason."

Default fallback: "You are here."

---

## Technical Requirements

**Stack:**
- Next.js (minimal)
- TypeScript
- Tailwind CSS (minimal styling)
- AI: Anthropic Claude or OpenAI (keys in global env)

**Constraints:**
- No database
- No authentication
- No session storage
- No conversation history
- Single page only
- Local development first

**Visual Design:**
- White or off-white background
- Black text
- One font
- No animation
- No branding beyond the name "selah"

**Behavioral:**
- Session auto-ends after exit sentence
- UI nudges user to close the tab
- No back button inside experience
- No retry button
- Slightly inconvenient to open, extremely easy to close
- Impossible to "get better at using"

---

## Success Criteria

**The MVP is successful when:**

1. **The pause works**
   - Metric: User feels briefly grounded
   - Target: 30-second interaction

2. **Usage decreases over time**
   - Metric: User needs selah-me less, not more
   - Target: This is success, not failure

3. **No attachment forms**
   - Metric: User never thinks "I should use selah-me more"
   - Target: Zero engagement optimization

4. **Return to life**
   - Metric: User closes tab and does something
   - Target: Every session ends with action in real world

---

## Out of Scope (Non-Negotiable)

**Selah-me will NEVER have:**
- Streak tracking
- Progress metrics
- Memory or history
- Journaling
- User accounts
- Sharing features
- A roadmap
- Mobile app version (web only)
- Push notifications
- "Come back" prompts

**The moment it acquires any of these, it will begin to steal aliveness.**

---

## Anti-Patterns to Avoid

**If the AI ever sounds:**
- Curious → Wrong
- Impressed → Wrong
- Wise → Wrong
- Kind or warm → Wrong
- Interested in you → Wrong

**If the user ever thinks:**
- "I should use selah-me more" → Off course
- "Selah-me understands me" → Off course
- "I'm a selah-me user" → Failed

---

## The Ultimate Test

Ask this one question while building:

> "Would I still want this if it never scaled, never saved data, never remembered me, and never improved?"

If the answer is yes → you're building selah-me.
If the answer is no → you're building another system.

---

## Iteration Plan

**Iteration 1: Core Loop**
- Project scaffold (Next.js, TypeScript, Tailwind minimal)
- AI integration (Claude or OpenAI via env keys)
- Single page with opening question, input, reflection, exit
- No history, no retry, session ends after exit

**Iteration 2: Polish**
- Visual refinement (minimal, clean)
- Question/exit sentence rotation
- Close-tab nudge after exit
- Ensure nothing persists

---

## Self-Destruction Rule

If any of the following ever become true, delete selah-me entirely:

1. It remembers you
2. It tracks usage
3. It encourages return
4. It becomes a daily practice
5. It feels important

A tool that refuses to become important will survive. One that doesn't, shouldn't.

---

**Vision Status:** APPROVED
**Ready for:** /2l-prod autonomous build

