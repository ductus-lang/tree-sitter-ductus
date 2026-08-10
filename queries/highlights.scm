; Ductus syntax highlighting

; Comments
(comment) @comment

; Literals
(number) @number
(string) @string
(unicode) @constant.builtin

; Keywords
[
  "params"
  "metrics"
  "def"
  "glyph"
  "import"
  "for"
  "in"
  "node"
] @keyword

[
  "if"
  "else"
] @keyword.conditional

[
  "contour"
  "guide"
  "anchor"
] @keyword.storage

; Node / path keyword clauses
[
  "dir"
  "width"
  "nib"
  "pen"
] @attribute

(cycle) @constant.builtin
(corner) @constant.builtin

; Transform operators read as functions applied postfix
(transform_expression
  transform: _ @function.method)

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "^"
  "<"
  "<="
  ">"
  ">="
  "=="
  "!="
  "and"
  "or"
  "not"
  "="
  "->"
] @operator

; Path joints
(line_joint) @operator
(curve_joint) @operator
".." @operator

; Punctuation
[
  "("
  ")"
  "{"
  "}"
  "["
  "]"
] @punctuation.bracket

[
  ","
  ";"
  ":"
  "."
] @punctuation.delimiter

; Identifier captures, ordered general to specific: in nvim, when two
; patterns capture the same node, the later pattern wins.

; Plain identifiers
(identifier) @variable

; Member properties (.x, .left, .right, .pos, ...)
(member_expression
  property: (identifier) @property)

; Definition names
(glyph_block name: (identifier) @type)
(def_declaration name: (identifier) @function)
(param_declaration name: (identifier) @variable.parameter)
(node_declaration name: (identifier) @variable)
(pen_block name: (identifier) @type)
(contour_declaration name: (identifier) @property)
(guide_declaration name: (identifier) @property)
(anchor_declaration name: (identifier) @property)
(parameter_list (identifier) @variable.parameter)

; Calls
(call_expression
  function: (identifier) @function.call)

; Built-in functions (Spec §4.6) and shape constructors (§4.7).
; Only in call position: `point`, `angle`, `length` stay ordinary
; identifiers elsewhere.
(call_expression
  function: (identifier) @function.builtin
  (#any-of? @function.builtin
    "min" "max" "clamp" "abs" "sign" "sqrt" "floor" "ceil" "round"
    "sin" "cos" "tan" "angle" "unitvec" "length" "distance"
    "intersection" "point" "direction" "directionpoint" "draw" "fill"
    "circle" "ellipse" "roundrect" "superellipse"))
