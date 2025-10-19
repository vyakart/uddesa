export const MATH_TEMPLATES = {
  fraction: '\\frac{a}{b}',
  squareRoot: '\\sqrt{x}',
  integral: '\\int_{a}^{b} f(x) dx',
  summation: '\\sum_{i=1}^{n} i',
  limit: '\\lim_{x \\to \\infty} f(x)',
  derivative: '\\frac{d}{dx} f(x)',
  matrix: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  greekLetters: '\\alpha, \\beta, \\gamma, \\delta',
  subscriptSuperscript: 'x_{i}^{2}',
  binomial: '\\binom{n}{k}',
} as const;
