// Closed-form Bayesian gate-check from the paper (sections 3-4, E.1-E.3). Pure functions, no DOM.
export const odds = (p) => p / (1 - p);
export const prob = (o) => o / (1 + o);
export const effPb = (pb, rho) => pb + rho * (1 - pb);
export const bayesFactor = (pc, pb, rho = 0) => pc / effPb(pb, rho);
/** Posterior after N agreeing models: O_N = O_0 * K^(N-1). */
export const posteriorN = (p0, K, N) => prob(odds(p0) * Math.pow(K, N - 1));
/** Smallest N with posterior >= target, or null when K <= 1 (never). */
export function minPanel(p0, K, target, cap = 200) {
  if (K <= 1) return null;
  for (let n = 1; n <= cap; n++) if (posteriorN(p0, K, n) >= target) return n;
  return null;
}
export const stepK = (qc, qb, s) => Math.pow(qc / qb, s);
export function sensitivity(p0 = 0.1, pc = 0.4, pbs = [0.02, 0.05, 0.1, 0.2]) {
  return pbs.map((pb) => ({ pb, K: pc / pb, P2: posteriorN(p0, pc / pb, 2) }));
}
/** Direct-K scenarios (trap, retrieval) need probabilities that realise K for the simulator. */
export function probsForK(K) {
  return K >= 1 ? { pc: 0.8, pb: 0.8 / K } : { pc: 0.9 * K, pb: 0.9 };
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Monte Carlo of the same generative story: claims are true with p0; each of the N-1 agreement events
 *  happens with pc (true) or pbEff (false). Returns how often a claim is true given all N agree. */
export function simulate({ p0, pc, pbEff, N, trials = 200000, seed = 1 }) {
  const rnd = mulberry32(seed);
  let agree = 0, agreeTrue = 0, truth = 0;
  for (let i = 0; i < trials; i++) {
    const isTrue = rnd() < p0;
    if (isTrue) truth++;
    const p = isTrue ? pc : pbEff;
    let all = true;
    for (let k = 1; k < N && all; k++) all = rnd() < p;
    if (all) { agree++; if (isTrue) agreeTrue++; }
  }
  return { trials, truth, agree, agreeTrue, empirical: agree ? agreeTrue / agree : NaN };
}
export const PAPER = { p0: 0.1, pc: 0.4, pb: 0.05, KS: 8, KT: 0.0111 };
export const fmt = (x, d = 3) => (x < 0.001 && x > 0 ? x.toExponential(2) : x.toFixed(d));
