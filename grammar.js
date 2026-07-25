/**
 * @file Chi — a DSL for parametric type design
 * @author Santhosh Thottingal <santhosh.thottingal@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  CONDITIONAL: 1,
  OR: 2,
  AND: 3,
  NOT: 4,
  COMPARE: 5,
  ADD: 6,
  MUL: 7,
  UNARY: 8,
  POW: 9,
  POSTFIX: 10,
};

module.exports = grammar({
  name: "chi",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._top_statement),

    // Blocks and macro/glyph definitions exist only at the top level.
    _top_statement: ($) =>
      choice(
        $.params_block,
        $.metrics_block,
        $.pen_block,
        $.def_declaration,
        $.glyph_block,
        $.import_statement,
        $._statement,
      ),

    _statement: ($) =>
      choice(
        $.assignment,
        $.destructuring_assignment,
        $.node_declaration,
        $.call_statement,
        $.for_statement,
      ),

    assignment: ($) =>
      seq(field("name", $.identifier), "=", field("value", $._value), ";"),

    destructuring_assignment: ($) =>
      seq(
        field("pattern", $.tuple_pattern),
        "=",
        field("value", $._expression),
        ";",
      ),

    tuple_pattern: ($) =>
      seq("(", $.identifier, repeat1(seq(",", $.identifier)), ")"),

    // Exactly one of `width` (optionally with `nib`) or `pen` is required;
    // the grammar accepts any combination so that partially-typed code still
    // parses, and lowering enforces the rule with a precise diagnostic.
    node_declaration: ($) =>
      seq(
        "node",
        field("name", $.identifier),
        "=",
        field("position", $._expression),
        field("dir", $.dir_clause),
        optional(field("width", $.width_clause)),
        optional(field("nib", $.nib_clause)),
        optional(field("pen", $.pen_clause)),
        ";",
      ),

    dir_clause: ($) => seq("dir", $._expression),

    width_clause: ($) => seq("width", $._expression),

    nib_clause: ($) => seq("nib", $._expression),

    pen_clause: ($) => seq("pen", $._expression),

    call_statement: ($) => seq($.call_expression, ";"),

    for_statement: ($) =>
      seq(
        "for",
        field("name", $.identifier),
        "in",
        field("iterable", choice($.range, $.list, $._expression)),
        field("body", $.block),
      ),

    import_statement: ($) => seq("import", field("path", $.string), ";"),

    block: ($) => seq("{", repeat($._statement), "}"),

    // ---- Top-level blocks ----------------------------------------------

    params_block: ($) => seq("params", "{", repeat($.param_declaration), "}"),

    param_declaration: ($) =>
      seq(
        field("name", $.identifier),
        "=",
        field("default", $._expression),
        "in",
        field("range", $.range),
        ";",
      ),

    range: ($) =>
      seq(field("min", $._expression), "..", field("max", $._expression)),

    metrics_block: ($) => seq("metrics", "{", repeat($.assignment), "}"),

    // A named pen: an ellipse given by width (major axis), height (minor
    // axis) and angle (major-axis orientation). Fields are ordinary
    // assignments; lowering validates the keys.
    pen_block: ($) =>
      seq(
        "pen",
        field("name", $.identifier),
        "{",
        repeat($.assignment),
        "}",
      ),

    def_declaration: ($) =>
      seq(
        "def",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        "->",
        field("returns", $.return_spec),
        field("body", $.block),
      ),

    parameter_list: ($) =>
      seq("(", optional(sep1($.identifier, ",")), ")"),

    return_spec: ($) =>
      choice($.identifier, seq("(", sep1($.identifier, ","), ")")),

    glyph_block: ($) =>
      seq(
        "glyph",
        field("name", choice($.identifier, $.string)),
        optional(seq(":", field("unicode", $.unicode))),
        "{",
        repeat($._glyph_statement),
        "}",
      ),

    _glyph_statement: ($) =>
      choice(
        $._statement,
        $.contour_declaration,
        $.guide_declaration,
        $.anchor_declaration,
      ),

    contour_declaration: ($) =>
      seq(
        "contour",
        field("name", $.identifier),
        "=",
        field("value", $._value),
        ";",
      ),

    guide_declaration: ($) =>
      seq(
        "guide",
        field("name", $.identifier),
        "=",
        field("value", $._value),
        ";",
      ),

    anchor_declaration: ($) =>
      seq(
        "anchor",
        field("name", $.identifier),
        "=",
        field("value", $._expression),
        ";",
      ),

    // The right-hand side of a binding or a call argument. A list literal is
    // a top-level value, kept out of `_expression` so that after any
    // expression `[` can only mean mediation `t[a,b]`, never a fresh list.
    _value: ($) => choice($._expression, $.path, $.list),

    list: ($) => seq("[", optional(sep1($._expression, ",")), "]"),

    // ---- Paths -------------------------------------------------------------

    path: ($) =>
      seq(
        $.path_segment,
        repeat1(seq($._joint, choice($.path_segment, $.cycle))),
      ),

    path_segment: ($) =>
      seq(
        optional(field("enter", $.direction_spec)),
        field("point", $._expression),
        optional(field("leave", $.direction_spec)),
      ),

    _joint: ($) => choice($.line_joint, $.curve_joint),

    line_joint: (_) => "--",

    curve_joint: (_) => "..",

    direction_spec: ($) => seq("{", choice($._expression, $.corner), "}"),

    corner: (_) => "corner",

    cycle: (_) => "cycle",

    // ---- Expressions -----------------------------------------------------

    _expression: ($) =>
      choice(
        $.conditional_expression,
        $.binary_expression,
        $.unary_expression,
        $.implicit_multiplication,
        $.mediation,
        $.member_expression,
        $.transform_expression,
        $.call_expression,
        $.parenthesized_expression,
        $.point,
        $.number,
        $.identifier,
      ),

    conditional_expression: ($) =>
      prec.right(
        PREC.CONDITIONAL,
        seq(
          field("value", $._expression),
          "if",
          field("condition", $._expression),
          "else",
          field("alternative", $._expression),
        ),
      ),

    binary_expression: ($) => {
      /** @type {[number, RuleOrLiteral][]} */
      const levels = [
        [PREC.OR, "or"],
        [PREC.AND, "and"],
        [PREC.COMPARE, choice("<", "<=", ">", ">=", "==", "!=")],
        [PREC.ADD, choice("+", "-")],
        [PREC.MUL, choice("*", "/")],
      ];
      return choice(
        ...levels.map(([level, operator]) =>
          prec.left(
            level,
            seq(
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression),
            ),
          ),
        ),
        prec.right(
          PREC.POW,
          seq(
            field("left", $._expression),
            field("operator", "^"),
            field("right", $._expression),
          ),
        ),
      );
    },

    unary_expression: ($) =>
      choice(
        prec(
          PREC.UNARY,
          seq(field("operator", "-"), field("operand", $._expression)),
        ),
        prec(
          PREC.NOT,
          seq(field("operator", "not"), field("operand", $._expression)),
        ),
      ),

    // `2u`, `3 stem`, `2(a + b)` — a number literal followed by a primary
    // multiplies. The operand set is limited to primaries that begin with a
    // concrete token (identifier, `(`): rules that begin with a general
    // expression (member access, mediation) are excluded, otherwise their
    // leading unary `-` would make `2 - a` ambiguous with subtraction. For
    // those, write the explicit `*` (e.g. `2 * a.b`).
    implicit_multiplication: ($) =>
      prec.left(
        PREC.MUL,
        seq(field("left", $.number), field("right", $._implicit_operand)),
      ),

    _implicit_operand: ($) =>
      choice(
        $.identifier,
        $.call_expression,
        $.parenthesized_expression,
        $.point,
      ),

    // t[a, b] = a + t*(b - a)
    mediation: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("t", $._expression),
          "[",
          field("a", $._expression),
          ",",
          field("b", $._expression),
          "]",
        ),
      ),

    member_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("object", $._expression),
          ".",
          field("property", $.identifier),
        ),
      ),

    transform_expression: ($) =>
      choice(
        prec.left(
          PREC.POSTFIX,
          seq(
            field("operand", $._expression),
            field(
              "transform",
              choice(
                "shifted",
                "scaled",
                "xscaled",
                "yscaled",
                "rotated",
                "slanted",
              ),
            ),
            field("argument", $._expression),
          ),
        ),
        prec.left(
          PREC.POSTFIX,
          seq(field("operand", $._expression), field("transform", "reversed")),
        ),
      ),

    call_expression: ($) =>
      seq(
        field("function", $.identifier),
        "(",
        optional(field("arguments", $.arguments)),
        ")",
      ),

    arguments: ($) => sep1($._value, ","),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    point: ($) =>
      seq(
        "(",
        field("x", $._expression),
        ",",
        field("y", $._expression),
        ")",
      ),

    // ---- Terminals ---------------------------------------------------------

    number: (_) => /([0-9]*\.)?[0-9]+/,

    string: (_) => token(seq('"', /[^"]*/, '"')),

    unicode: (_) => /U\+[0-9A-Fa-f]+/,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: (_) => token(seq("#", /.*/)),
  },
});

/**
 * One or more occurrences of `rule` separated by `separator`.
 *
 * @param {RuleOrLiteral} rule
 * @param {RuleOrLiteral} separator
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
