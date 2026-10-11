# Developing

```sh
npm install
npm run check          # eslint (Airbnb), prettier, tsc, vitest
npm run build          # dist/index.js and its type declarations
npm run screenshots    # docs/screenshots, from examples/
```

The code is strict TypeScript, with no `any` in it, and follows the
Airbnb style for React and TypeScript, with Prettier formatting it and
typescript-eslint's `no-use-before-define` on for functions, classes and
variables alike. The scripts are TypeScript too, run with `tsx`.
The tests draw with fonts made in `test/support/fonts.ts`; `npm run
screenshots` borrows the fonts duckboard-js has fetched.
It is developed side by side with duckboard-js, which
takes it from `src/` here when the two are checked out next to each other
and is its largest test: every duckboard demo, frame for frame.

Conventions for changes (what a new primitive needs, the lint rules, the
rule about fonts) are in [CLAUDE.md](../CLAUDE.md).

---

[Documentation index](README.md) · [Project README](../README.md)
