# tree-sitter-chi

A [tree-sitter](https://tree-sitter.github.io/) grammar for **Chi**, a language
for parametric type design. Chi describes glyph outlines as explicit contours
whose points are expressions over named design parameters (weight, contrast,
width, …); a spline solver places the curve handles.

The language is described in [`Spec.md`](./Spec.md). Runnable syntax samples
live in [`examples/`](./examples).

## Building and testing

```sh
tree-sitter generate      # regenerate the parser from grammar.js
tree-sitter test          # run the corpus tests in test/corpus
tree-sitter parse examples/o.chi
```

The grammar implements the full v0.1 surface, including constructs the
evaluator does not yet handle (`for`, lists, `import`). This keeps example
files and highlighting stable while the language back end catches up.

## License

MIT
