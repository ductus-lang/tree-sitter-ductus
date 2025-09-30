/**
 * @file chi language syntax
 * @author Santhosh Thottingal <santhosh.thottingal@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "chi",
  extras: (_) => ["\r", /\s/],
  word: ($) => $.identifier,
  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => choice($._simple_statements, $._compound_statement),

    _simple_statements: ($) =>
      seq(
        sep($._simple_statement, $._semicolon),
        optional($._semicolon),
        $._newline,
      ),

    _simple_statement: ($) =>
      choice($.comment, $.assignment_statement, $.function_call),

    assignment_statement: ($) =>
      seq($.identifier, "=", $.expression, $._semicolon),

    function_call: ($) =>
      seq($.function_name, "(", optional($.function_args), ")", $._semicolon),

    expression: ($) => choice($.point, $.path),

    // Paths and points
    path: ($) => sep1(choice($.identifier, $.point), $.connector),
    connector: ($) => choice($.line_connector, $.curve_connector),
    line_connector: ($) => "--",
    curve_connector: ($) => "..",
    point: ($) => seq("(", $.x, ",", $.y, ")"),
    x: (_) => /\d+/,
    y: (_) => /\d+/,

    // Signed float number
    _float: (_) => /[+-]?([0-9]*[.])?[0-9]+/,
    _dir: (_) => choice("up", "down", "left", "right"),
    // _compound_statements  - loops and conditionals
    _compound_statement: ($) => choice($.if_statement, $.for_statement),
    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        "{",
        field("consequence", $._suite),
        optional(field("alternative", $.else_clause)),
        "}",
      ),
    if_clause: ($) => seq("if", $.expression),
    else_clause: ($) => seq("else", "{", field("body", $._suite), "}"),
    for_statement: ($) =>
      seq(
        "for",
        field("left", $.expression),
        "in",
        field("right", $.expression),
        "{",
        field("body", $._suite),
        "}",
      ),
    _suite: ($) =>
      choice(alias($._simple_statements, $.block), alias($._newline, $.block)),
    conditional_expression: ($) =>
      prec.right(seq($.expression, "if", $.expression, "else", $.expression)),
    comment: (_) => token(seq("#", /.*/)),

    identifier: (_) => /[a-zA-Z][a-zA-Z0-9_]*/,

    function_name: ($) => prec(-3, choice("draw", "stroke", "save")),

    function_args: ($) => sep($.identifier, ","),

    // extra
    _newline: ($) => /\n+/,

    _semicolon: ($) => token(";"),

    true: (_) => "True",
    false: (_) => "False",
    none: (_) => "None",
  },
});

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
function sep1(rule, separator) {
  return seq(rule, repeat1(seq(separator, rule)));
}
