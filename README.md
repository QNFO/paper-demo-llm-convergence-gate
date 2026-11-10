# Convergence Gate-Check: interactive demo

Live: https://qnfo.github.io/paper-demo-llm-convergence-gate/

Companion to [Cross-Model LLM Convergence as a Bayesian Gate-Check for Fringe Physics Claims](https://papers.qnfo.org/papers/cross-model-llm-convergence-as-a-bayesian-gate-check-for-fringe-physics-claims).
Sliders for prior, agreement chances, shared bias and panel size; a posterior chart; a Monte Carlo check; the sensitivity and
partial-agreement models; and a table that reproduces the paper's numbers.

Illustrative assumptions only (technology readiness level 1-2). The paper's section E.2 prints 4.21488 for (4/3)^5; the exact value is 4.21399.

```
node --test js/math.test.mjs      # paper values as assertions
python -m http.server 8000        # then open http://localhost:8000
```

MIT licence. Static site, no build, no tracking.
