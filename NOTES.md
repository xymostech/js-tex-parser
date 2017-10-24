Problem:

When we set a new character category, we need to make sure that we re-parse all
of the tokens that we parse afterwards. For instance, when we parse:

```tex
\catcode`@=11%
\z@%
```

we need to make sure that `\z@` is parsed correctly, instead of parsing `\z`
and `@` separately. In particular, if we look-ahead at the end of the `11` for
another number (which we're supposed to do) and see the `\z` (because at that
time, `@` is not a letter) we can't just push the `\z` to the beginning of a
list of "unparsed" tokens to pull off once we're done parsing the current
`\catcode` assignment.

Solution Idea #1:

Instead of stripping off contents from the source, the lexer keeps track of a
row and column into the source and increments them when it lexes tokens. When
we want to look ahead, we call a function which takes a callback with two
arguments, `accept` and `reject`. Inside the callback, we can read tokens. If
we return the result of calling the `accept()` function, we return the first
argument to `accept()`. If we return the result of calling the `reject()`
function, we revert the row and column values (and any other lexer variables)
back to before when we called the function and return the argument to
`reject()`.

Note: We would like to get rid of the `unLexToken()` function because it's
really janky. Unfortunately, we actually need it for situations like when we're
lexing macros. We'll just have to use it sparingly, and make sure that
`tryLexTokens()` handles them correctly.
