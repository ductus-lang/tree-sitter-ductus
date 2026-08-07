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

; Member properties (.x, .left, .right, .pos, ...)
(member_expression
  property: (identifier) @property)

; Plain identifiers
(identifier) @variable
