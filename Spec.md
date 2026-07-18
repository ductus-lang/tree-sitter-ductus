# Chi Language Specification

Version 0.1 (draft) — 2026-07-18

Chi is a domain-specific language for parametric type design. A chi source file
describes glyph outlines as explicit contours whose points are expressions over
named design parameters (weight, contrast, width, …). Curve handles are never
written by hand: the designer gives on-curve points, directions, and point
types; a two-parameter spline solver (the `curve_fitter` crate) places the
control points.

## 1. Design principles

1. **Outline-first.** The filled contour is the primary artifact. There is no
   stroke expansion in the core language.
2. **Skeleton as scaffolding, not geometry.** Skeleton *nodes* carry direction
   and width and expose exactly-computed edge points (`n.left`, `n.right`).
   Outlines are written *through* these derived points. Curves are never
   offset; only points are.
3. **Interpolation compatibility by construction.** The number and type of
   on-curve points in a contour is fixed by the source text, independent of
   parameter values. Every instance in the design space has identical topology.
4. **The designer owns the outline.** Every derived point can be nudged or
   replaced by an ordinary expression. Terminals, ink traps, and optical
   corrections are normal outline edits that remain parametric.
5. **One way to say a thing.** No equation solver, no reserved-name magic
   (`x0`/`y0` implicit variables are gone), no duplicate binding forms.

Non-goals for the core: nib/pen stroking, a metafont-style linear-equation
solver (`whatever`), mutation, per-joint tension (metapost's `tension` was
considered and dropped — unused in practice), and path concatenation
(metapost's `&` — seam-merging rules are not worth the complexity; macros
share geometry by returning points and nodes, and each contour is written as
one path expression).

## 2. Lexical structure

- **Encoding:** UTF-8. Identifiers are ASCII: `[a-zA-Z_][a-zA-Z0-9_]*`.
- **Comments:** `#` to end of line.
- **Statements** are terminated by `;`. Newlines are insignificant whitespace
  (a path may be split across lines freely).
- **Numbers:** unsigned decimal literals `12`, `0.5`, `.75`. Negation is the
  unary `-` operator, not part of the literal.
- **Strings:** double-quoted, `"ka.mlym"`. Used for glyph names and (later)
  imports. No escapes needed in v0.1.
- **Unicode literals:** `U+0D15` (`U+` followed by hex digits). Only in glyph
  headers.
- **Keywords:** `params in glyph contour guide anchor node dir width nib
  cycle corner def for if else and or not import shifted scaled xscaled
  yscaled rotated slanted reversed metrics draw fill`
- **Direction constants:** `right = 0`, `up = 90`, `left = 180`, `down = 270`.
  These are ordinary numeric bindings in the prelude, not syntax. All angles in
  chi are **degrees, counterclockwise, 0° = +x**. The coordinate system is
  Cartesian, y-up, origin at the glyph's left-sidebearing/baseline point.

## 3. Values and types

Chi is dynamically typed; type errors are reported at evaluation time.

| Type      | Literal / constructor                  | Notes |
|-----------|----------------------------------------|-------|
| number    | `12`, `0.5`                            | Also used for angles (degrees). |
| point     | `(x, y)`                               | Doubles as a 2-D vector. |
| node      | `node` statement                       | Position + direction + width (+ nib). |
| path      | `a .. b -- c`                          | Open or closed (ends with `cycle`). |
| transform | built by postfix operators             | Affine 2×3. Rarely named explicitly. |
| tuple     | `def` return only                      | Destructured at the call site; not a general value. |
| list      | `[a, b, c]`                            | Phase 2 (with `for`). |
| glyph     | `glyph` block                          | Named; not a first-class expression. |
| boolean   | comparisons, `and`/`or`/`not`          | Only inside conditional expressions. |

## 4. Expressions

### 4.1 Arithmetic

`+ - * / ^` with standard precedence; `^` is right-associative; unary `-`.
Juxtaposition of a **number literal** with a following primary expression is
multiplication: `2u`, `3 stem`, `2(a + b)`.

Point arithmetic: `point ± point`, `number * point`, `point * number`,
`point / number`. `point ± number` is an error.

### 4.2 Mediation

`t[a, b]` = `a + t*(b - a)`, for numbers and points. `0.5[a, b]` is the
midpoint. `t` may be any numeric expression: `(w/(w+v))[a, b]`.

(Grammar note: chi has no indexing, so postfix `[` unambiguously means
mediation.)

### 4.3 Field access

- On points: `p.x`, `p.y`.
- On nodes: `n.pos`, `n.dir`, `n.width` (total), `n.left`, `n.right`
  (derived edge points, §6).

### 4.4 Transforms (postfix operators)

```
p shifted (dx, dy)
p scaled k          # uniform; on nodes also scales width
p xscaled k
p yscaled k
p rotated theta     # degrees, about origin
p slanted k         # (x, y) -> (x + k*y, y)
p reversed          # paths only: reverse direction
```

They apply to points, nodes, and paths, and chain left-to-right:
`p rotated 10 shifted (50, 0)`. Transforming a node transforms its position
*and* its direction/nib angles (width is only changed by `scaled`).

### 4.5 Conditional expression

`a if cond else b` — expression form only; there is no `if` statement.
Conditions use `< <= > >= == !=` and `and or not`.

Use sparingly: a conditional that changes *which* points exist would break
interpolation compatibility (§9.3). Conditionals over numbers (e.g. clamping a
counter) are the intended use.

### 4.6 Built-in functions

```
min(a, b)  max(a, b)  abs(a)  sqrt(a)  floor(a)  ceil(a)  round(a)
sin(a)  cos(a)  tan(a)              # degrees
angle((x, y)) -> number             # atan2 in degrees
unitvec(theta) -> point             # (cos theta, sin theta)
length(p) -> number                 # |p|
distance(a, b) -> number
intersection(p, q) -> point         # first intersection of two paths;
                                    # error if none
draw(path, ...)                     # sketch mode: render path as a spine
fill(path, ...)                     # sketch mode: fill a closed path
```

`intersection` on two line segments (`a -- b`, `c -- d`) covers the common
metafont `whatever` idioms (stem meets diagonal, serif meets stem).

## 5. Paths

### 5.1 Syntax

```
path := segment (joint segment)* [ joint cycle ]
segment := [ direction-spec ] point-expression [ direction-spec ]
joint := "--"  |  ".."
```

Concretely:

```
p = a {up} .. b .. {theta} c -- d .. e .. cycle;
```

- `a .. b` — smooth curve joint. The solver chooses tangents (G2-continuous
  two-parameter spline).
- `a -- b` — straight line. Where a line meets a curve, the meeting point is
  automatically a line/curve corner (fitter point types `CurveToLine`,
  `LineToCurve`).
- `a {theta} ..` — direction constraint *leaving* `a` (a numeric angle
  expression in degrees; `{up}` works because `up` is the number 90; vectors
  via `{angle(b - a)}`).
- `.. {theta} b` — direction constraint *entering* `b`.
- `a{corner}` — mark `a` as a free corner: tangents on each side are fitted
  independently, no continuity across the point (fitter `PointType::Corner`).
  Typical use: teardrop terminals, `... .. tip{corner} .. ...`. A point with
  different entering and leaving direction constraints is also a corner, with
  those exact tangents.
- `cycle` — closes the path back to its first point with the preceding joint.
  Closedness is always explicit; it is never inferred from coordinates.

There is no path concatenation operator. A contour is one path expression;
macros contribute geometry by returning the points and nodes it passes
through.

### 5.2 Semantics

A path value is the ordered list of on-curve points with, per point: incoming
and outgoing direction constraints (optional), and a point type
(smooth/corner/line-adjacent). Fitting to cubic Béziers happens when the path
is rendered (`contour`, `draw`, `fill`), not when it is bound — so paths can
be transformed losslessly.

## 6. Nodes and derived points

A node is a skeleton point that knows the stroke's local direction and width:

```
node n = (x, y) dir theta width w;
node m = (x, y) dir theta width (wl, wr);          # asymmetric
node k = (x, y) dir theta width w nib phi;         # explicit offset axis
```

- `dir theta` — direction of travel of the (imaginary) stroke at this point,
  degrees.
- `width w` — total stroke thickness. `width (wl, wr)` gives the left and
  right offsets separately (`width w` ≡ `width (w/2, w/2)`). Asymmetric widths
  express off-axis stress and expansion contrast.
- `nib phi` — the axis along which width is applied. Default: `dir + 90`
  (perpendicular). An explicit nib models broad-pen-like contrast without any
  pen machinery.

Derived points (exact, no approximation):

```
n.left  = n.pos + wl * unitvec(nib)
n.right = n.pos - wr * unitvec(nib)
```

*Left* and *right* are relative to the direction of travel, like a river bank.
Nodes never render by themselves; the designer writes contours through the
derived points and may freely adjust them (`n.left + (3, 0)`).

**Winding convention:** traverse a closed skeleton counterclockwise and the
`right` points form the outer contour (counterclockwise), the `left` points —
taken in reverse order — form the inner contour (clockwise). See the `o`
example in §11.

## 7. Program structure

A source file contains, in any order: a `params` block, a `metrics` block,
top-level bindings, `def` macros, `glyph` blocks, and (in sketch files)
top-level `draw`/`fill` calls.

### 7.1 params

```
params {
  weight   = 400 in 100..900;
  contrast = 0.85 in 0.6..1.0;
}
```

Parameters are the design-space axes: a default value and a range. The range
uses `min..max` (this form appears only after `in`, so it does not collide
with the `..` path joint). Instances are selected outside the source: CLI
`--set weight=700`, or playground sliders generated from this block.

### 7.2 metrics

```
metrics {
  upm = 1000;
  x = 500; cap = 700; asc = 750; desc = -220;
  over = 10 + weight / 200;
}
```

Named font-level measures, usable in all following code. Values are arbitrary
expressions (they may reference params). Keys `upm`, `x`, `cap`, `asc`,
`desc` have meaning to the renderer (viewbox, preview guidelines); any other
key is simply a named number.

### 7.3 Top-level bindings

```
stem = 40 + 0.14 * weight;
hair = contrast * stem;
```

Plain single-assignment bindings. There is no separate `measure` keyword — a
binding is a binding. Tooling (playground inspector) may display all top-level
numeric bindings.

### 7.4 def — macros

```
def bowl(c, rx, ry) -> (n, w, s, e) {
  node n = c + (0,  ry) dir left  width hair;
  node w = c + (-rx, 0) dir down  width stem;
  node s = c + (0, -ry) dir right width hair;
  node e = c + (rx, 0)  dir up    width stem;
}

def diamond(c, r) -> p {
  p = c + (0, r) -- c + (r, 0) -- c + (0, -r) -- c + (-r, 0) -- cycle;
}
```

- Parameters are untyped identifiers; arguments are passed by value.
- `-> (a, b, c)` names the bindings from the body that are exported, as a
  tuple; `-> a` exports a single value. There is no `return` statement — a
  macro body is declarative like everything else.
- Call sites: `p = diamond((100, 100), 50);` and destructuring
  `(n, w, s, e) = bowl(center, rx, ry);`.
- Macros may call macros. No recursion in v0.1.

### 7.5 glyph

```
glyph o : U+006F {
  advance = 2 stem + 380;
  ...
  contour outer = ...cycle;
  contour inner = ...cycle;
  guide skeleton = ...;
  anchor top = (advance / 2, x + over);
}
```

- Header: `glyph <name> [: U+XXXX] { ... }`. Name is an identifier or a
  string (`glyph "ka.mlym" : U+0D15`), string form for names that are not
  valid identifiers. The Unicode codepoint is optional (unencoded glyphs,
  ligatures).
- `advance = expr;` — required. Horizontal advance width in font units.
- `contour <name> = <path>;` — a filled contour. The path **must** end in
  `cycle`; an open path here is an error. Rendered with the nonzero fill
  rule: outer contours counterclockwise, counters clockwise. The renderer
  warns when nested contours share a winding direction.
- `guide <name> = <path>;` — construction geometry (skeletons, diagonals).
  Never filled; drawn only in debug preview. Open or closed.
- `anchor <name> = <point>;` — named position for mark attachment. Ignored by
  SVG output except in debug preview.
- Glyph bodies are ordinary scopes: local bindings, nodes, and macro calls are
  allowed and see all top-level bindings.

### 7.6 Sketch files

A file with no `glyph` block is a sketch: top-level `draw(path)` renders paths
as thin spines, `fill(path)` fills closed ones. This keeps the playground
useful for freehand exploration and keeps today's simple `.chi` samples valid
in spirit.

## 8. Evaluation semantics

- **Single pass, top to bottom.** A name must be bound before use.
- **Immutable bindings.** Rebinding a name in the same scope is an error.
  Inner scopes (glyph bodies, `def` bodies, `for` bodies) may shadow outer
  names.
- **Scopes:** prelude (direction constants, builtins) → file top level →
  glyph/def body. `params` and `metrics` bind into the file's top level.
- Evaluation of a file with `--set` bindings: params bound first (defaults
  overridden by the instance), then metrics, then the rest in order.
- Paths store points and constraints; **curve fitting runs at render time**
  per contour/draw call, via `curve_fitter` (two-parameter spline: G2-smooth
  interior, honoring per-point direction constraints and corner types,
  closed when `cycle`).

## 9. Rendering (SVG target)

### 9.1 Output

`chi build file.chi [--glyph name] [--set param=value ...] [--debug] -o out.svg`

- One SVG per glyph (or a sheet of all glyphs). Filled black-on-transparent,
  `fill-rule: nonzero`. The SVG viewBox is derived from `upm`, `asc`, `desc`;
  the y-axis is flipped at output so source stays y-up.
- `--debug` additionally renders: metrics guidelines (baseline, x, cap, asc,
  desc, overshoot), `guide` paths, skeleton nodes with their direction arrows
  and derived left/right points, on-curve points, fitted control handles, and
  anchors — each labeled.

### 9.2 Playground contract

The playground (separate repo, `chi-playground`) re-renders on edit using the
tree-sitter incremental parse; sliders come from the `params` block; the
inspector lists top-level bindings and per-glyph contours/guides/anchors.

### 9.3 Interpolation-compatibility rule

For any two instances in the parameter space, every contour must yield the
same number of Bézier segments with the same point types. Because point count
and types are fixed in source, the only way to break this is a conditional
expression that swaps geometry structurally. The evaluator does not police
this in v0.1; the future designspace sampler will.

## 10. Phasing

**v0.1 (core):** everything above except the items below. The tree-sitter
grammar implements the *full* syntax including Phase 2 constructs, so example
files and highlighting are stable; the evaluator rejects unimplemented
constructs with a clear "not yet implemented" error.

**Phase 2:**
- `for name in list { ... }` and `for i in a..b { ... }`; list literals
  `[a, b, c]`. For repeated components (CJK/Indic motifs, striped decorations).
- `import "file.chi";` — evaluate another file into the current scope
  (measures/macros shared across a family; true-italic sources sharing
  measures with the upright).
- Path operations: `subpath`, `point t of p`, arc-length queries.
- UFO + designspace emission and adaptive master sampling (integration with
  the existing SVG→UFO pipeline).

## 11. Examples

### 11.1 Sketch (playground doodling)

```
u = 100;
a = (0, 0);
b = (5u, 3u);
p = a {45} .. (3u, 4u) .. {down} b;
draw(p);
```

### 11.2 Direct outline, no skeleton — sans `l`

```
params { weight = 400 in 100..900; }
metrics { upm = 1000; x = 500; cap = 700; asc = 750; desc = -220; }

stem = 40 + 0.14 * weight;

glyph l : U+006C {
  advance = stem + 190;
  lsb = (advance - stem) / 2;

  # counterclockwise: bottom-left, bottom-right, top-right, top-left
  contour main =
      (lsb, 0) -- (lsb + stem, 0)
   -- (lsb + stem, asc) -- (lsb, asc) -- cycle;
}
```

### 11.3 Skeleton-anchored outline — `o` with contrast and a weight axis

```
params {
  weight   = 400 in 100..900;
  contrast = 0.85 in 0.6..1.0;
}
metrics {
  upm = 1000; x = 500; cap = 700; asc = 750; desc = -220;
  over = 10 + weight / 200;
}

stem = 40 + 0.14 * weight;
hair = contrast * stem;

def bowl(c, rx, ry) -> (n, w, s, e) {
  # counterclockwise travel: top -> left -> bottom -> right
  node n = c + (0,  ry) dir left  width hair;
  node w = c + (-rx, 0) dir down  width stem;
  node s = c + (0, -ry) dir right width hair;
  node e = c + (rx, 0)  dir up    width stem;
}

glyph o : U+006F {
  advance = 2 stem + 380;
  center = (advance / 2, x / 2);

  # mid-stroke skeleton: outline extremes land on x + over / -over
  ry = x / 2 + over - hair / 2;
  rx = advance / 2 - 55 - stem / 2;

  (n, w, s, e) = bowl(center, rx, ry);
  guide spine = n.pos .. w.pos .. s.pos .. e.pos .. cycle;

  # CCW skeleton: .right points = outer contour (CCW),
  # .left points reversed = inner contour (CW)
  contour outer = n.right .. w.right .. s.right .. e.right .. cycle;
  contour inner = n.left  .. e.left  .. s.left  .. w.left  .. cycle;

  anchor top = (advance / 2, x + over);
}
```

Weight and contrast change `stem`, `hair`, and `over`; every point moves, the
fitter refits, and both contours keep exactly four points each across the
whole design space.

### 11.4 Direction specs and brackets — slab-serifed stem

A bottom-serifed stem with brackets. Line/line and line/curve corners are
automatic; the brackets are smooth because their entry and exit directions
are constrained.

```
glyph stem_slab {
  advance = stem + 230;
  sl = 55;                          # serif overhang beyond the stem
  sh = 42;                          # serif slab height
  b  = 30;                          # bracket size
  xl = (advance - stem) / 2;        # stem left edge
  xr = xl + stem;                   # stem right edge

  contour main =
      (xl - sl, 0) -- (xr + sl, 0) -- (xr + sl, sh)
   -- (xr + b, sh) {left} .. {up} (xr, sh + 2b)
   -- (xr, cap) -- (xl, cap)
   -- (xl, sh + 2b) {down} .. {left} (xl - b, sh)
   -- (xl - sl, sh) -- cycle;
}
```

## 12. Grammar notes (for tree-sitter-chi)

- `extras`: whitespace including newlines, and comments. Statements end at
  `;` — no newline-sensitivity anywhere.
- Expression precedence (low → high): conditional (`if/else`) → `or` → `and`
  → `not` → comparison → additive → multiplicative (incl. number-literal
  juxtaposition) → unary `-` → `^` (right-assoc) → postfix (mediation `[a,b]`,
  field access `.`, transform keywords, call `(...)`) → primary.
- Path expressions sit *below* conditional precedence and are only valid as a
  full right-hand side (of `=`, `contour`, `guide`, or a call argument): this
  keeps `..` unambiguous.
- Direction spec `{ ... }` contains either an expression or the keyword
  `corner`.
- Range `a..b` is a distinct rule reachable only after `in` (params, `for`) —
  never a general expression, avoiding conflict with the `..` joint.
- Point literal `( e , e )` vs parenthesized expression `( e )` are
  distinguished by the comma. Destructuring `( id , id , ... ) =` is a
  statement-level pattern, not an expression.
- Keyword arguments to `node` (`dir`, `width`, `nib`) are ordered clauses;
  `dir` and `width` are required, `nib` optional.
- `U+XXXX` is a token appearing only in glyph headers.
- The grammar implements Phase 2 syntax (`for`, lists, `import`) from day
  one; the evaluator gates them.
