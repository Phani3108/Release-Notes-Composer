#!/usr/bin/env node
import { seedIfMissing } from "../src/modules/seedData.js";
seedIfMissing();
console.log("[seed] demo data ensured.");
