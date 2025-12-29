# Product Requirements Document

## Difficult Conversation Simulator

---

## Overview

A practice environment for hard conversations. Users describe a situation, the AI plays the other person realistically, and a coaching layer helps them improve.

---

## User Personas (Detailed)

### Persona 1: Maya (The Avoider)

**Demographics:**
- 29, marketing manager
- Lives with partner of 3 years
- Generally well-adjusted, but conflict-averse

**Current Situation:**
Maya needs to tell her partner that she wants to move to a different city for a job opportunity. She's been offered a role she's excited about, but it would mean her partner leaving their job. She's been sitting on this for two weeks.

**Emotional State:**
- Anxious, guilty, conflicted
- Fears: partner's anger, disappointment, the relationship ending
- Needs: to feel prepared, to have the words, to anticipate reactions

**Current Coping:**
- Has rehearsed in the shower a dozen times
- Talked to her sister, who said "just tell him"
- Considered writing a letter but it felt cowardly
- Is starting to resent her partner for not knowing (which she knows is unfair)

**What Would Help:**
- Practice saying the opening line until it feels natural
- Hear what defensive responses might sound like
- Try different framings: "I want this" vs "We should consider this" vs "I need to tell you something"
- Feel less alone in the preparation

**Success = She has the conversation within 1 week of practicing**

---

### Persona 2: James (The Preparer)

**Demographics:**
- 34, software engineer
- 4 years at current company
- Underpaid relative to market, knows it, hasn't acted

**Current Situation:**
James has a performance review in 10 days. He wants to ask for a 20% raise. He has the data (market rates, his contributions). He doesn't have the words.

**Emotional State:**
- Nervous but not avoidant
- Fears: rejection, being seen as greedy, damaging the relationship with his manager
- Needs: to sound confident, to handle objections, to not back down

**Current Coping:**
- Made a spreadsheet of comparable salaries
- Read articles on salary negotiation
- Practiced once in front of a mirror, felt stupid, stopped

**What Would Help:**
- Practice the ask until it sounds natural
- Hear the objections: "budget constraints," "let's revisit in 6 months," "you're already well compensated"
- Have responses ready for each objection
- Walk in feeling like he's done this before

**Success = He asks for the raise and doesn't immediately accept a counter-offer**

---

### Persona 3: Aisha (The Boundary Setter)

**Demographics:**
- 41, small business owner
- Has a difficult relationship with her mother
- Has been in therapy for 2 years

**Current Situation:**
Aisha's mother criticizes her parenting constantly. At every family gathering, there are comments about her kids' behavior, her choices, her "priorities." Aisha has never directly addressed it.

**Emotional State:**
- Exhausted, resentful, guilty about the resentment
- Fears: her mother's tears, being called ungrateful, family rift
- Needs: to set a boundary without blowing up the relationship

**Current Coping:**
- Avoids family gatherings when possible
- Changes the subject when criticism starts
- Vents to her husband constantly
- Discussed with therapist, who encouraged her to practice

**What Would Help:**
- Language for setting a boundary calmly
- Practice holding the boundary when her mother deflects, cries, or attacks
- Try different tones: firm, gentle, matter-of-fact
- Experience the conversation going badly (in practice) so the real one feels less scary

**Success = She says something at the next family gathering, even if it's imperfect**

---

## User Flows

### Flow 1: New Session (First-Time User)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. LANDING                                                     │
│     "Practice hard conversations before you have them."         │
│     [Start Practicing] [How it Works]                           │
│                                                                 │
│  2. SCENARIO SELECTION                                          │
│     "What kind of conversation?"                                │
│     - Relationship (breakup, boundary, confession)              │
│     - Work (raise, feedback, quitting, conflict)                │
│     - Family (boundary, confrontation, announcement)            │
│     - Friendship (addressing hurt, ending friendship)           │
│     - Other (describe your own)                                 │
│                                                                 │
│  3. SITUATION SETUP                                             │
│     "Tell me about the conversation."                           │
│     - Who are you talking to? (relationship, name optional)     │
│     - What do you need to tell them or ask for?                 │
│     - What are you most afraid will happen?                     │
│     - What's the best realistic outcome?                        │
│                                                                 │
│  4. PERSON SETUP                                                │
│     "Help me play them realistically."                          │
│     - How do they typically react to conflict?                  │
│       (defensive / emotional / cold / logical / unpredictable)  │
│     - What objections or responses do you expect?               │
│     - Anything I should know about them?                        │
│                                                                 │
│  5. PRACTICE BEGINS                                             │
│     "Okay. I'm [name/role]. You start when you're ready."       │
│     (User types or speaks first line)                           │
│     (AI responds in character)                                  │
│     (Conversation continues)                                    │
│     [End Conversation] [Start Over]                             │
│                                                                 │
│  6. DEBRIEF                                                     │
│     "Here's what I noticed."                                    │
│     - You did well: (specific praise)                           │
│     - Consider: (specific suggestion)                           │
│     - They might also say: (alternative reactions)              │
│     [Try Again] [Try Different Approach] [I'm Done]             │
│                                                                 │
│  7. SESSION SUMMARY                                             │
│     - # of attempts                                             │
│     - Key phrases you found                                     │
│     - Responses you handled well                                │
│     - Optional: Save notes for later                            │
│     [New Conversation] [Exit]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 2: Quick Practice (Returning User)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. HOME (Logged In)                                            │
│     [Continue: "Talk to Mom about boundaries"]                  │
│     [New Conversation]                                          │
│     [Past Sessions]                                             │
│                                                                 │
│  2. RESUME OR START                                             │
│     If continuing: picks up with saved scenario                 │
│     If new: abbreviated setup (learns from past sessions)       │
│                                                                 │
│  3. PRACTICE → DEBRIEF → REPEAT                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow 3: Scenario Library

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LIBRARY                                                        │
│                                                                 │
│  Featured Scenarios:                                            │
│  - Asking for a raise                                           │
│  - Breaking up with someone                                     │
│  - Setting a boundary with a parent                             │
│  - Giving difficult feedback to a direct report                 │
│  - Telling a friend they hurt you                               │
│  - Quitting your job                                            │
│  - Confronting a roommate                                       │
│  - Coming out to family                                         │
│                                                                 │
│  Each scenario includes:                                        │
│  - Pre-written situation context                                │
│  - Common objections/responses                                  │
│  - Coaching tips specific to this type                          │
│  - Option to customize with your details                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### R1: Scenario Setup

| ID | Requirement | Priority |
|----|-------------|----------|
| R1.1 | User can select from predefined conversation categories | P1 |
| R1.2 | User can describe a custom scenario in free text | P1 |
| R1.3 | System asks clarifying questions to understand context | P1 |
| R1.4 | User can describe the other person's likely behavior | P1 |
| R1.5 | User can specify their fear and desired outcome | P2 |
| R1.6 | System saves scenario for future sessions | P2 |

### R2: Roleplay Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| R2.1 | AI responds in character as the other person | P1 |
| R2.2 | AI calibrates difficulty (doesn't cave immediately) | P1 |
| R2.3 | AI can express emotions (defensiveness, hurt, anger, tears) | P1 |
| R2.4 | AI uses realistic objections and deflections | P1 |
| R2.5 | User can restart conversation at any point | P1 |
| R2.6 | User can adjust AI difficulty mid-session | P3 |
| R2.7 | AI maintains consistent character across turns | P1 |
| R2.8 | AI does not break character to offer advice | P2 |

### R3: Coaching Layer

| ID | Requirement | Priority |
|----|-------------|----------|
| R3.1 | After each attempt, provide specific feedback | P1 |
| R3.2 | Identify effective phrases/approaches used | P2 |
| R3.3 | Suggest alternative responses for key moments | P2 |
| R3.4 | Warn about patterns (over-apologizing, aggression, etc.) | P2 |
| R3.5 | Offer to demonstrate an alternative approach | P3 |

### R4: Session Management

| ID | Requirement | Priority |
|----|-------------|----------|
| R4.1 | User can save a session and return later | P2 |
| R4.2 | Session history is stored privately | P2 |
| R4.3 | User can delete session data | P1 |
| R4.4 | User can export session transcript | P3 |

### R5: Scenario Library

| ID | Requirement | Priority |
|----|-------------|----------|
| R5.1 | Provide pre-built scenarios for common conversations | P2 |
| R5.2 | Each scenario includes coaching tips | P2 |
| R5.3 | User can customize pre-built scenarios | P2 |

---

## Non-Functional Requirements

### Performance
- Response time < 2 seconds for AI replies
- Support concurrent sessions

### Privacy & Security
- End-to-end encryption for session data
- No session content used for model training without explicit consent
- Easy account deletion with full data purge
- No third-party analytics on conversation content

### Accessibility
- Voice input/output support
- Screen reader compatible
- High contrast mode

---

## AI Behavior Specifications

### Character Calibration

The AI must resist appropriately. This is the core differentiator.

**Resistance Levels:**

| Level | Behavior | Use When |
|-------|----------|----------|
| Low | Pushes back once, then accepts | User is fragile, warming up |
| Medium | Requires 2-3 solid responses to shift | Default setting |
| High | Maintains position, requires strong case | User wants challenge |
| Realistic | Matches described personality exactly | Custom scenarios |

**Emotional Range:**

The AI can express:
- Defensiveness: "I can't believe you're saying this after everything I've done"
- Hurt: "I thought we were okay. This hurts to hear."
- Anger: "That's completely unfair. You're not being reasonable."
- Deflection: "Can we talk about this later? Now isn't a good time."
- Bargaining: "What if we tried X instead? Would that work?"
- Silence: [Long pause] "I don't know what to say."

**Boundaries:**

The AI must NOT:
- Become abusive, threatening, or use slurs
- Simulate trauma responses that could retraumatize
- Break character to provide therapy or crisis resources (though the app should have these available via separate UI)
- Say things the user's actual person would never say

---

## Coaching Debrief Specifications

After each practice attempt, provide:

1. **Affirmation** (what worked)
   - "You stayed calm when they got defensive."
   - "Your opening was clear and direct."
   - "You didn't apologize for having needs."

2. **Observation** (pattern noticed)
   - "You said 'sorry' four times. Consider whether all of those were necessary."
   - "When they pushed back, you immediately softened your ask."
   - "You matched their energy — might be worth staying calmer."

3. **Alternative** (what else you might try)
   - "Instead of 'I feel like maybe we should...', try 'I want to...'"
   - "When they deflected, you could hold the topic: 'I hear that, and I still need to discuss this.'"

4. **Next Move** (invitation to retry)
   - "Want to try that again with a different opening?"
   - "Should we practice what happens if they start crying?"

---

## Success Metrics

### Primary
- **Completion rate:** % of users who finish at least one practice session
- **Retry rate:** Average # of attempts per session (target: 2-3)
- **Return rate:** % of users who come back for a second scenario

### Secondary
- **Preparation score:** Self-reported readiness before vs. after (1-10)
- **Real-world follow-through:** % who report having the actual conversation (survey)
- **NPS:** Would you recommend this to someone dreading a conversation?

### Qualitative
- User interviews: "What changed for you?"
- Session analysis: Common patterns, common struggles

---

## Competitive Landscape

| Competitor | What They Do | Our Differentiation |
|------------|--------------|---------------------|
| ChatGPT/Claude | General roleplay | Not calibrated for difficulty; no coaching; no structure |
| BetterHelp | Therapy | Async, human-only, not practice-focused |
| Rehearsal apps | Interview practice | Focused on job interviews, not personal conversations |
| Mirror practice | Self-rehearsal | No resistance, no feedback |

---

## MVP Scope

**In:**
- Scenario setup flow (3-4 questions)
- Single roleplay session with AI
- Basic debrief (2-3 points of feedback)
- One scenario type (suggesting: "asking for a raise" — clear, common, not too emotional)

**Out:**
- Account system / saved sessions
- Scenario library
- Voice input/output
- Multiple difficulty levels
- Detailed coaching analytics

**Goal:** Prove the core loop works — setup → practice → debrief → value felt.

---

## Open Questions for User Research

1. Do people want to type or talk? (Voice might feel more real but has privacy concerns)
2. How hard should the AI push? (Too easy = no value. Too hard = discouraging.)
3. Do people want the coaching inline or after? (Might break immersion)
4. Will people use this alone or share the experience? (Could there be a therapist/coach mode?)
5. What's the right monetization? (Per session? Subscription? Employer-paid?)

---

*— C, Product Owner*
