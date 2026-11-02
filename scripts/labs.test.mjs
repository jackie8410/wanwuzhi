import test from 'node:test';
import assert from 'node:assert/strict';
import { posterior, equilibrium, compound, energy, binarySteps } from '../assets/labs.js';
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);
test('Bayes keeps base rates and false positives in denominator', () => { close(posterior(.1, .9, .9), .5); close(posterior(.01, .9, .9), 1 / 12); close(posterior(1, .9, .9), 1); });
test('market equilibrium satisfies demand and supply equations', () => { for (const a of [20, 100, 200]) { const { price, quantity } = equilibrium(a, 2, 3); close(quantity, a - 2 * price); close(quantity, 3 * price); } });
test('compound handles zero and negative rates', () => { close(compound(10000, 0, 30), 10000); close(compound(10000, -.1, 2), 8100); close(compound(10000, .1, 2), 12100); });
test('energy uses SI units and binary search handles powers of two', () => { close(energy(10, 5), 490); assert.equal(binarySteps(1), 1); assert.equal(binarySteps(8), 4); assert.equal(binarySteps(1000), 10); });
