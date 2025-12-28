#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load nudges
const nudgesPath = join(__dirname, '..', 'content', 'nudges.json');
const data = JSON.parse(readFileSync(nudgesPath, 'utf-8'));
const nudges = data.nudges;

// Pick a random nudge
const nudge = nudges[Math.floor(Math.random() * nudges.length)];

// Display it
console.log();
console.log(`  ${nudge.text}`);
console.log();
console.log(`  ${nudge.time} · ${nudge.location}`);
console.log();
