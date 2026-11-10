import { posteriorN, odds, effPb, minPanel, sensitivity, stepK, simulate, probsForK, PAPER, fmt } from "./math.js";
const $ = (id) => document.getElementById(id);
const pct = (x) => (x * 100).toFixed(x < 0.1 ? 2 : 1) + "%";
const state = { override: null };
const PRESETS = {
  paper: { p0: 10, pc: 40, pb: 5, rho: 0, N: 4, K: null },
  corr: { p0: 10, pc: 40, pb: 5, rho: 10, N: 4, K: null },
  trap: { p0: 10, pc: 40, pb: 5, rho: 0, N: 2, K: PAPER.KT },
  retr: { p0: 10, pc: 40, pb: 5, rho: 0, N: 4, K: 1 },
};
const read = () => ({ p0: +$("p0").value / 100, pc: +$("pc").value / 100, pb: +$("pb").value / 100, rho: +$("rho").value / 100, N: +$("N").value });
const currentK = (v) => state.override ?? v.pc / effPb(v.pb, v.rho);
const clearPresets = () => document.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));

function chart(v, K) {
  const W = 640, H = 260, L = 44, R = 12, T = 12, B = 30, maxN = 10;
  const x = (n) => L + ((n - 1) / (maxN - 1)) * (W - L - R), y = (p) => T + (1 - p) * (H - T - B);
  const path = (k) => Array.from({ length: maxN }, (_, i) => `${i ? "L" : "M"}${x(i + 1)},${y(posteriorN(v.p0, k, i + 1))}`).join("");
  let s = "";
  for (const g of [0, 0.25, 0.5, 0.75, 1]) s += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="4" y="${y(g) + 4}">${g * 100}%</text>`;
  for (let n = 1; n <= maxN; n++) s += `<text x="${x(n) - 4}" y="${H - 14}">${n}</text>`;
  s += `<text x="${W / 2 - 40}" y="${H - 1}">models in panel</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(0.95)}" y2="${y(0.95)}" stroke="var(--good)" stroke-width="1.5"/>`;
  s += `<path d="${path(PAPER.KS)}" fill="none" stroke="var(--mut)" stroke-width="2" stroke-dasharray="6 5"/>`;
  s += `<path d="${path(K)}" fill="none" stroke="var(--acc)" stroke-width="3"/>`;
  s += `<circle cx="${x(v.N)}" cy="${y(posteriorN(v.p0, K, v.N))}" r="6" fill="var(--acc)"/>`;
  $("chart").innerHTML = s;
}

function render() {
  const v = read(), K = currentK(v), manual = state.override != null;
  $("p0o").textContent = pct(v.p0); $("pco").textContent = pct(v.pc); $("pbo").textContent = pct(v.pb);
  $("rhoo").textContent = pct(v.rho); $("No").textContent = v.N;
  for (const id of ["pc", "pb", "rho"]) $(id).disabled = manual;
  $("kmode").hidden = !manual;
  if (manual) $("kmode").textContent = `Bayes factor fixed at ${K} by this preset. Pick another preset to unlock the agreement sliders.`;
  const P = posteriorN(v.p0, K, v.N), mn = minPanel(v.p0, K, 0.95);
  $("post").textContent = pct(P);
  const cls = P >= 0.95 ? "good" : P > v.p0 * 1.5 ? "warn" : "bad";
  const msg = P >= 0.95 ? "Clears the 95% bar: worth an expert's time." : K <= 1 ? "Agreement is worthless or a warning sign." : P > v.p0 ? "Raised, but not enough to act on alone." : "No gain over the prior.";
  $("verdict").innerHTML = `<span class="chip ${cls}">${msg}</span> Prior was ${pct(v.p0)}.`;
  $("sK").textContent = fmt(K, K < 1 ? 4 : 2);
  $("sO").textContent = fmt(odds(v.p0) * Math.pow(K, v.N - 1), 3);
  $("sN").textContent = mn ?? "never";
  $("sP2").textContent = pct(posteriorN(v.p0, K, 2));
  chart(v, K);
  $("simout").textContent = "Not run yet (settings changed).";
  const sens = sensitivity(v.p0, v.pc);
  $("sensT").innerHTML = "<tr><th>p<sub>b</sub></th><th>K</th><th>Posterior (2 models)</th></tr>" + sens.map((r) => `<tr><td>${pct(r.pb)}</td><td>${fmt(r.K, 1)}</td><td>${pct(r.P2)}</td></tr>`).join("");
  steps();
}

function steps() {
  const S = +$("S").value; $("s").max = S; if (+$("s").value > S) $("s").value = S;
  const s = +$("s").value, qc = +$("qc").value / 100, qb = +$("qb").value / 100, p0 = +$("p0").value / 100;
  $("So").textContent = S; $("so").textContent = s; $("qco").textContent = pct(qc); $("qbo").textContent = pct(qb);
  const K = stepK(qc, qb, s);
  $("stepout").innerHTML = `Matching ${s} of ${S} steps gives factor <b>${fmt(K, 2)}</b> and a two-model posterior of <b>${pct(posteriorN(p0, K, 2))}</b>.` + (qc <= qb ? " Per-step agreement is no likelier for true claims, so matched steps do not help." : "");
}

function checks() {
  const Ke = 0.4 / effPb(0.05, 0.1);
  const rows = [
    ["Two-model posterior (4.2)", posteriorN(0.1, 8, 2), 0.471],
    ["Three-model posterior (4.3)", posteriorN(0.1, 8, 3), 0.877],
    ["Four-model posterior (4.4)", posteriorN(0.1, 8, 4), 0.983],
    ["Panel size for 95% (4.5)", minPanel(0.1, 8, 0.95), 4],
    ["Trap posterior (4.6)", posteriorN(0.1, PAPER.KT, 2), 0.001232],
    ["Sensitivity p_b 0.02 (4.7)", posteriorN(0.1, 20, 2), 0.690],
    ["Retrieval posterior (4.8)", posteriorN(0.1, 1, 2), 0.1],
    ["Correlated, rho 0.1 (E.1)", posteriorN(0.1, Ke, 2), 0.235],
    ["Panel with rho 0.1 (E.1)", minPanel(0.1, Ke, 0.95), 7],
    ["Low prior 1% (E.3)", posteriorN(0.01, 8, 2), 0.075],
    ["Step model (E.2)", posteriorN(0.1, stepK(0.8, 0.6, 5), 2), 0.318944],
  ];
  let bad = 0;
  $("chkT").innerHTML = "<tr><th>Result</th><th>Paper</th><th>This page</th><th></th></tr>" + rows.map(([n, got, want]) => {
    const ok = Math.abs(got - want) < (want < 0.01 ? 1e-5 : 6e-4); if (!ok) bad++;
    return `<tr><td>${n}</td><td>${want}</td><td>${fmt(got, 6)}</td><td class="${ok ? "good" : "warn"}">${ok ? "matches" : "differs"}</td></tr>`;
  }).join("");
  $("chkNote").textContent = "Step model (E.2): the paper prints a factor of 4.21488 and posterior 0.318944. (4/3)^5 is exactly 1024/243 = 4.21399, giving 0.318904. A small arithmetic slip; the conclusion is unchanged." + (bad ? " " + bad + " row(s) differ." : "");
}

function applyPreset(name) {
  const p = PRESETS[name];
  for (const k of ["p0", "pc", "pb", "rho", "N"]) $(k).value = p[k];
  state.override = p.K;
  clearPresets();
  document.querySelector(`[data-preset="${name}"]`).setAttribute("aria-pressed", "true");
  render();
}
document.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => applyPreset(b.dataset.preset)));
for (const id of ["p0", "pc", "pb", "rho", "N"]) $(id).addEventListener("input", () => { clearPresets(); render(); });
for (const id of ["S", "s", "qc", "qb"]) $(id).addEventListener("input", steps);
$("run").addEventListener("click", () => {
  const v = read(), K = currentK(v);
  const pr = state.override != null ? probsForK(K) : { pc: v.pc, pb: effPb(v.pb, v.rho) };
  const r = simulate({ p0: v.p0, pc: pr.pc, pbEff: pr.pb, N: v.N, seed: Date.now() });
  $("simout").innerHTML = r.agree
    ? `${r.agree.toLocaleString()} of ${r.trials.toLocaleString()} claims had all ${v.N} models agree; <b>${pct(r.empirical)}</b> of those were true. Formula says <b>${pct(posteriorN(v.p0, K, v.N))}</b>.`
    : "No claim reached full agreement with these settings; raise the agreement chances.";
});
applyPreset("paper");
checks();
