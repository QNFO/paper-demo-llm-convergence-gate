import assert from "node:assert/strict";
import test from "node:test";
import { posteriorN, minPanel, sensitivity, stepK, bayesFactor, effPb, simulate, PAPER, odds, prob } from "./math.js";
const near = (a, b, tol = 5e-4) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
test("section 4 results", () => {
  near(posteriorN(0.1, 8, 2), 8 / 17); near(posteriorN(0.1, 8, 3), 64 / 73); near(posteriorN(0.1, 8, 4), 512 / 521);
  assert.equal(minPanel(0.1, 8, 0.95), 4);
  near(posteriorN(0.1, PAPER.KT, 2), 0.001232, 1e-6);
  near(posteriorN(0.1, 1, 5), 0.1);
});
test("sensitivity table", () => {
  const s = sensitivity();
  [0.689655, 0.470588, 0.307692, 0.181818].forEach((v, i) => near(s[i].P2, v, 1e-5));
});
test("E.1 correlated errors", () => {
  near(effPb(0.05, 0.1), 0.145, 1e-9);
  const K = bayesFactor(0.4, 0.05, 0.1); near(K, 2.75862, 1e-4);
  near(posteriorN(0.1, K, 2), 0.234597, 1e-5);
  assert.equal(minPanel(0.1, K, 0.95), 7);
});
test("E.2 step model and E.3 low prior", () => {
  near(stepK(0.8, 0.6, 5), 1024 / 243, 1e-12); // paper E.2 prints 4.21488; exact value is 4.21399
  near(posteriorN(0.1, stepK(0.8, 0.6, 5), 2), 0.318904, 1e-5); // paper prints 0.318944
  near(posteriorN(0.01, 8, 2), 0.0747664, 1e-6);
});
test("simulation matches the closed form", () => {
  const r = simulate({ p0: 0.1, pc: 0.4, pbEff: 0.05, N: 3, trials: 400000, seed: 7 });
  near(r.empirical, 64 / 73, 0.015);
});
test("odds/prob invert", () => near(prob(odds(0.37)), 0.37, 1e-12));
