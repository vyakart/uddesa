# Web Launch Baselines

Store timestamped baseline capture artifacts for the Netlify web launch gate here.

Recommended contents per run:

- `build.txt`
- `test-coverage.txt`
- `playwright-web-e2e.txt`
- `perf-baseline.json`
- `bundle-snapshot.txt` (or emitted asset inventory)

Machine-readable CI gate baselines live in:

- `muwi/perf-baselines/web-chromium-gha.json`
- `muwi/perf-baselines/bundle-budgets.json`
