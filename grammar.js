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

  // `2 u` — after the number, an identifier could reduce through
  // `_expression` (a dead end) or `_implicit_operand`; only GLR can tell.
  conflicts: ($) => [[$._expression, $._implicit_operand]],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => choice($.assignment, $.call_statement),

    assignment: ($) =>
      seq(field("name", $.identifier), "=", field("value", $._value), ";"),

    call_statement: ($) => seq($.call_expression, ";"),

    // The right-hand side of a binding or a call argument.
    _value: ($) => choice($._expression, $.path),

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
    // expression multiplies. The operand set excludes numbers and operators
    // so `2 3` and `2 -x` stay syntax errors.
    implicit_multiplication: ($) =>
      prec.left(
        PREC.MUL,
        seq(field("left", $.number), field("right", $._implicit_operand)),
      ),

    _implicit_operand: ($) =>
      choice(
        $.identifier,
        $.call_expression,
        $.member_expression,
        $.mediation,
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
