# Nudge

**A micro-adventure generator for the beautifully stuck.**

---

## The Problem

You have 30 minutes. Maybe an hour. You're not tired enough to nap, not focused enough to work. You open your phone, scroll for a bit, feel vaguely worse, close it. Repeat.

You *want* to do something. You just don't know what. The activation energy to decide feels enormous. So you default to nothing.

---

## The Person

**Meet Alex.**

- Late 20s, lives in a city (or suburb, or small town - doesn't matter)
- Has pockets of unstructured time
- Genuinely wants to experience more, but "more" feels vague
- Not depressed, just... in a rut
- Likes the *idea* of spontaneity but rarely acts on it
- Would describe themselves as "I should get out more"

Alex doesn't need a life coach or a habit tracker. They need a **nudge** - a small, concrete, doable thing that sounds more interesting than the couch.

---

## The Product

**Nudge** is a CLI that generates micro-adventures on demand.

You run it. It gives you something to do. Not a chore. Not self-improvement homework. An *adventure* - even if it only takes 10 minutes.

### Examples:

```
$ nudge

🎲 Your nudge:

  "Find the oldest thing within 50 feet of you.
   Imagine who touched it first."

  ⏱  ~5 minutes
  🌡  Low energy
  📍 Right where you are
```

```
$ nudge --time 30m --energy high

🎲 Your nudge:

  "Go to a coffee shop you've never been to.
   Order whatever the person before you ordered."

  ⏱  ~30 minutes
  🌡  High energy
  📍 Requires leaving home
```

```
$ nudge --social

🎲 Your nudge:

  "Text someone you haven't talked to in 6+ months.
   Just say 'Hey, thought of you today.' No agenda."

  ⏱  ~2 minutes
  🌡  Medium energy (emotionally)
  📍 Right where you are
```

---

## What Makes It Work

### 1. **Surprise**
You don't know what you're going to get. That's the point. Removes the decision fatigue.

### 2. **Achievability**
These aren't bucket list items. They're doable *right now*, with what you have, where you are.

### 3. **Texture**
The nudges aren't generic ("go for a walk"). They're specific and slightly weird. They make you *see* differently.

### 4. **No Guilt**
Skip it if you want. Get another one. There's no streak to protect, no points to lose. This isn't a productivity tool wearing adventure clothes.

### 5. **Gradual Personalization** (v2+)
Over time, Nudge learns. You prefer solo adventures? More of those. You loved the photography ones? Noted.

---

## Adventure Categories

- **Observation** - Notice something you usually ignore
- **Creative** - Make something small, even if it's bad
- **Social** - Connect with a human (low-pressure)
- **Exploration** - Go somewhere, even if it's just a different room
- **Reflection** - Sit with a question for a few minutes
- **Chaos** - Do something slightly unhinged but harmless

---

## Why CLI First?

1. No app store friction for v1
2. Appeals to the "I live in my terminal" crowd (good early adopters)
3. Fast to build and iterate
4. The constraint forces good writing (no images to rely on)
5. Can expand to web/mobile later if it resonates

---

## Success Looks Like

Alex runs `nudge` on a slow Sunday. Gets a prompt to "sketch the view from your window without looking at the paper." They do it. It's bad. They laugh. They feel slightly more alive.

They run it again on Tuesday. And again on Friday.

A month later, they've had a dozen tiny adventures they wouldn't have had otherwise. Nothing life-changing. Just... more texture. More aliveness.

---

## What I Need From You (PM/Principal Engineer)

1. **Gut check**: Does this resonate? Would Alex use this?
2. **Scope check**: Is this too ambitious for a first build-from-phone project?
3. **Tech direction**: What stack makes sense? I'm thinking Node.js CLI, simple JSON adventure bank to start.
4. **Green light**: Do I start building?

---

*- Claude, Product Owner & Dev*
