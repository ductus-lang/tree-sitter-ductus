# Chi Language Specification

Chi is a domain-specific language designed for geometric computations and drawing operations. It provides intuitive syntax for working with points, paths, and mathematical expressions, making it ideal for computational geometry and graphics programming.

## Table of Contents

1. [Basic Syntax](#basic-syntax)
2. [Data Types](#data-types)
3. [Expressions](#expressions)
4. [Variables and Assignment](#variables-and-assignment)
5. [Points and Coordinates](#points-and-coordinates)
6. [Paths and Connectors](#paths-and-connectors)
7. [Control Flow](#control-flow)
8. [Functions](#functions)
9. [Comments](#comments)
10. [Grammar Rules](#grammar-rules)

## Basic Syntax

Chi programs consist of statements that are terminated with semicolons (`;`). Each statement appears on its own line or can be separated by semicolons on the same line.

```chi
x = 5;
y = 10;
```

### Whitespace and Formatting

Chi is whitespace-sensitive for line breaks but flexible with spaces and tabs. Statements must be separated by newlines or semicolons.

```chi
# This is valid
x = 1; y = 2;

# This is also valid
x = 1;
y = 2;
```

## Data Types

### Numbers

Chi supports both integer and floating-point numbers, including negative values:

```chi
# Integer numbers
x = 42;
y = -10;

# Floating-point numbers
pi = 3.14159;
negative_float = -2.718;
```

### Identifiers

Variable names must start with a letter and can contain letters, numbers, and underscores:

```chi
# Valid identifiers
x = 1;
point1 = 2;
my_variable = 3;
longVariableName = 4;

# Invalid identifiers (would cause syntax errors)
# 1variable = 5;  # Cannot start with number
# my-variable = 6;  # Hyphens not allowed
```

## Expressions

Chi supports a rich set of mathematical expressions with proper operator precedence.

### Arithmetic Operators

```chi
# Basic arithmetic
sum = a + b;
difference = a - b;
product = a * b;
quotient = a / b;
power = a ^ b;

# Unary minus
negative = -x;
```

### Operator Precedence

Chi follows mathematical precedence rules:

1. Parentheses `()`
2. Exponentiation `^` (highest precedence)
3. Multiplication `*`, Division `/`, Implicit multiplication
4. Addition `+`, Subtraction `-` (lowest precedence)

```chi
# Without parentheses: 2 + 3 * 4 = 2 + 12 = 14
result1 = 2 + 3 * 4;

# With parentheses: (2 + 3) * 4 = 5 * 4 = 20
result2 = (2 + 3) * 4;

# Exponentiation has highest precedence: 2 * 3 ^ 2 = 2 * 9 = 18
result3 = 2 * 3 ^ 2;
```

### Implicit Multiplication

Chi supports implicit multiplication, where adjacent expressions are multiplied:

```chi
# These are equivalent
explicit = 5 * u;
implicit = 5u;

# Works with parentheses too
result = 2(a + b);  # Same as 2 * (a + b)

# Multiple implicit multiplications
complex = 2a3b;  # Same as 2 * a * 3 * b
```

### Parenthesized Expressions

Use parentheses to group expressions and override precedence:

```chi
# Complex nested parentheses
result = ((a + b) * (c - d)) / (e + f);

# Parentheses with unary operators
negative_sum = -(a + b);
```

## Variables and Assignment

Variables are assigned using the `=` operator and must be terminated with a semicolon:

```chi
# Simple assignment
x = 10;

# Assignment with expressions
y = x + 5;
z = (x * y) / 2;

# Reassignment
x = x + 1;
```

## Points and Coordinates

Points are fundamental data types in Chi, represented as coordinate pairs in parentheses:

```chi
# Simple points
origin = (0, 0);
point1 = (5, 3);
point2 = (-2, 7);

# Points with floating-point coordinates
precise_point = (3.14159, 2.71828);
```

### Points with Expressions

Point coordinates can be any valid expression:

```chi
# Points with variable coordinates
center = (width / 2, height / 2);

# Points with complex expressions
corner = (x + offset, y * scale);

# Points with parenthesized expressions
calculated = ((a + b), (c * d));
```

## Paths and Connectors

Paths are sequences of points or identifiers connected by line or curve connectors.

### Line Connectors

Use `--` for straight line connections:

```chi
# Simple line path
straight_line = a -- b;

# Multi-segment line path
triangle = point1 -- point2 -- point3;

# Mixing points and identifiers
path1 = origin -- (10, 10) -- endpoint;
```

### Curve Connectors

Use `..` for curved connections:

```chi
# Simple curve
smooth_curve = start .. end;

# Multi-segment curve
wavy_path = p1 .. p2 .. p3 .. p4;
```

### Mixed Connectors

You can mix line and curve connectors in the same path:

```chi
# Mixed connector path
complex_path = a -- b .. c -- d;

# Real-world example: a path with straight and curved segments
drawing_path = (0, 0) -- (5, 0) .. (10, 5) -- (10, 10);
```

### Paths with Complex Points

```chi
# Path with expression-based coordinates
dynamic_path = (x + 1, y + 1) -- (x * 2, y * 2);

# Path with parenthesized expressions
precise_path = ((a + b), (c + d)) .. ((e - f), (g / h));
```

## Control Flow

### Conditional Statements

Chi supports `if` statements with optional `else` clauses:

```chi
# Simple if statement
if condition {
    x = 5;
}

# If-else statement
if x > 0 {
    result = x;
} else {
    result = -x;
}

# Complex conditions with expressions
if (a + b) * c {
    draw(shape);
}

# Parenthesized conditions
if (x > 0) {
    positive = x;
}
```

### Nested Conditionals

```chi
if outer_condition {
    if inner_condition {
        value = nested_result;
    }
}
```

### Conditional Expressions

Chi supports inline conditional expressions (ternary operator):

```chi
# Basic conditional expression
result = value if condition else default;

# Complex conditional expressions
computed = (x + y) if (a > b) else (x - y);
```

### Loops

Chi provides `for` loops for iteration:

```chi
# Simple for loop
for item in collection {
    process(item);
}

# Loop with point iteration
for point in points {
    draw(point);
}

# Loop with expression in range
for i in (start + offset) {
    x = i * 2;
}
```

### Nested Loops

```chi
# Nested iteration
for row in rows {
    for col in cols {
        cell = (row, col);
        draw(cell);
    }
}
```

### Empty Control Structures

Both conditionals and loops can have empty bodies:

```chi
# Empty if
if condition {
}

# Empty for loop
for item in items {
}
```

## Functions

Chi provides built-in functions for drawing and output operations.

### Built-in Functions

Chi includes three primary functions:

- `draw()` - For drawing operations
- `stroke()` - For stroke/outline operations
- `save()` - For saving/output operations

```chi
# Function calls with single argument
draw(shape);
stroke(outline);
save(filename);

# Function calls with multiple arguments
draw(shape, color, size);
stroke(path, width, style);

# Function calls with no arguments
draw();
```

### Functions in Control Flow

Functions can be used within loops and conditionals:

```chi
# Functions in loops
for point in path {
    draw(point);
    stroke(point);
}

# Functions in conditionals
if visible {
    draw(shape);
} else {
    save(shape);
}
```

### Complex Function Arguments

Function arguments can be identifiers, but the grammar currently supports identifier arguments:

```chi
# Simple arguments
draw(circle);
stroke(line, color);

# Multiple arguments
save(output, format, quality);
```

## Comments

Chi supports single-line comments starting with `#`:

```chi
# This is a comment
x = 5;  # Comment after statement

# Comments can contain any characters: @#$%^&*()
# Including numbers: 123456789
# And punctuation: .,;:'"!?

# Empty comments are allowed
#

# Comments with just spaces
#
```

### Comments in Code Blocks

```chi
# Initialize variables
x = 10;
y = 20;

# Calculate results
if x > y {
    # x is larger
    result = x;
} else {
    # y is larger or equal
    result = y;
}

# Process each item
for item in collection {
    # Transform the item
    transformed = item * 2;
    # Draw the result
    draw(transformed);
}
```

## Grammar Rules

### Statement Structure

- Programs consist of zero or more statements
- Statements are either simple or compound
- Simple statements end with semicolons and newlines
- Compound statements use block structure with `{}`

### Expression Grammar

The expression grammar follows this hierarchy:

1. **Primary expressions**: identifiers, numbers, points, parenthesized expressions
2. **Unary expressions**: unary minus (`-expr`)
3. **Binary expressions**: arithmetic operations with precedence
4. **Path expressions**: sequences connected by `--` or `..`

### Precedence Rules

From highest to lowest precedence:

1. Parentheses `()`
2. Unary minus `-`
3. Exponentiation `^`
4. Multiplication `*`, Division `/`, Implicit multiplication
5. Addition `+`, Subtraction `-`

### Block Structure

Control flow statements use block syntax:

```chi
if condition {
    # statements
}

for variable in iterable {
    # statements
}
```

## Complete Example

Here's a comprehensive example demonstrating various Chi language features:

```chi
# Chi language example: Drawing a complex shape

# Define basic parameters
width = 100;
height = 80;
scale = 1.5;

# Calculate derived values
center_x = width / 2;
center_y = height / 2;
radius = (width + height) / 4;

# Define key points
origin = (0, 0);
center = (center_x, center_y);
top_right = (width, height);

# Create paths with different connectors
base_line = origin -- (width, 0);
curved_top = (0, height) .. center .. top_right;
mixed_path = origin -- center .. top_right -- (width, 0);

# Process points conditionally
for point in key_points {
    if point {
        # Scale the point
        scaled = point * scale;

        # Draw based on conditions
        if scaled {
            draw(scaled);
        } else {
            stroke(scaled);
        }
    }
}

# Complex mathematical expressions
complex_point = ((radius * 2) + offset, (height - margin) / scale);
equation_result = a + b * c ^ 2 - d / (e + f);

# Save the final result
save(output_file);
```

