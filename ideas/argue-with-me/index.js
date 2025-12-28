#!/usr/bin/env node

/**
 * Argue With Me
 * An AI that takes the opposite position on anything you say.
 *
 * For now: pattern-based counterarguments.
 * Future: Could integrate with actual AI API for real steelmanning.
 */

import * as readline from 'readline';

const counterpoints = {
  // Absolute statements
  always: "Always? Can you think of a single exception? Because if there's one, your universal claim falls apart.",
  never: "Never is a strong word. Has there truly been zero instances, or just few enough that you've dismissed them?",
  everyone: "Everyone? Even the people you haven't met? Even the ones with completely different life circumstances?",
  "no one": "No one at all? What about the person who might exist but you haven't encountered?",
  obvious: "Obvious to whom? What looks obvious often just means 'familiar to people like me.'",

  // Common opinions
  "remote work": "What about the junior employee who learns by watching others? Or the person whose home life makes focus impossible? Or the spontaneous collaboration that happens in hallways?",
  "office work": "But what about the two hours of commuting that could be spent with family? The performative busyness? The interruptions that kill deep work?",
  "social media": "You're using a broad brush. The person who reconnected with a childhood friend, the activist who organized a movement, the artist who found their audience - are they all wrong?",
  "capitalism": "And yet you're using a device made possible by market incentives, having this conversation over infrastructure built by competing companies. What's your alternative that matches this scale?",
  "socialism": "Who decides what's fair? The committee? History suggests concentrations of power corrupt regardless of stated ideology. How do you solve the calculation problem?",

  // Value statements
  better: "Better by what metric? And who chose that metric? 'Better' is doing a lot of heavy lifting in that sentence.",
  worse: "Worse for whom? Sometimes what's worse for one group is better for another. Which perspective are you privileging?",
  should: "Says who? Where does that 'should' come from - tradition, utility, intuition? And why is that source authoritative?",
  must: "Must, or else what? What happens if someone doesn't? Sometimes 'must' just means 'I strongly prefer.'",

  // Certainty
  certain: "How certain? 90%? 99%? What evidence would change your mind? If nothing would, that's faith, not certainty.",
  wrong: "Wrong by what standard? And are you applying that standard consistently to your own positions?",
  right: "Right according to whom? You, your culture, some universal truth? How do you distinguish between them?",

  // Thinking patterns
  "i think": "You think, but have you stress-tested it? What's the strongest argument against your position?",
  "i believe": "Belief is a starting point, not a conclusion. What would make you update this belief?",
  "i feel": "Feelings are data, but they're not always accurate data. What might you be missing because of how you feel?",
};

const socraticQuestions = [
  "What's the strongest argument against what you just said?",
  "If someone you respect disagreed, what might they say?",
  "What would have to be true for the opposite position to be correct?",
  "Who benefits from this being true? Who loses?",
  "Is this something you've thought through, or something you absorbed?",
  "What's the evidence? And what evidence would change your mind?",
  "Are you describing how things are, or how you want them to be?",
  "What are you assuming that you haven't stated?",
  "If you're wrong, how would you know?",
  "What's the cost of being wrong about this?",
];

function findCounterpoint(input) {
  const lower = input.toLowerCase();

  // Check for keyword matches
  for (const [keyword, response] of Object.entries(counterpoints)) {
    if (lower.includes(keyword)) {
      return response;
    }
  }

  // Default to a Socratic question
  return socraticQuestions[Math.floor(Math.random() * socraticQuestions.length)];
}

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log();
  console.log("  Argue With Me");
  console.log("  -------------");
  console.log("  Say something you believe. I'll push back.");
  console.log("  Type 'quit' to exit.");
  console.log();

  const prompt = () => {
    rl.question("  You: ", (input) => {
      if (input.toLowerCase() === 'quit') {
        console.log();
        console.log("  Good talk. Keep questioning.");
        console.log();
        rl.close();
        return;
      }

      if (input.trim() === '') {
        prompt();
        return;
      }

      const response = findCounterpoint(input);
      console.log();
      console.log(`  Me: ${response}`);
      console.log();
      prompt();
    });
  };

  prompt();
}

main();
