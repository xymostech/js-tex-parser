import Token from "./Token.js";
import Category from "./Category.js";
import {getCategory} from "./state.js";

const EOF = Symbol("eof");
const EOL = Symbol("eol");

const BEGINNING_LINE = Symbol("beginning line");
const MIDDLE_LINE = Symbol("middle line");
const SKIPPING_BLANKS = Symbol("skipping blanks");

let input = [];
let state = BEGINNING_LINE;

export function startLexing(text) {
    input = text.map(line => line + "\n");
    state = BEGINNING_LINE;
}

function getPlainChar() {
    if (input.length === 0) {
        return EOF;
    }

    const line = input[0];

    if (line.length === 0) {
        input = input.slice(1);
        return EOL;
    }

    const ch = line[0];
    input[0] = line.slice(1);
    return ch;
}

function unGetChar(c) {
    if (c === EOF) {
        return;
    } else if (input.length === 0) {
        input = [c];
    } else if (c === EOL) {
        input.unshift([]);
    } else {
        input[0] = c + input[0];
    }
}

function isHexChar(c) {
    return ("0" <= c && c <= "9") || ("a" <= c && c <= "f");
}

function hexValue(c) {
    if ("0" <= c && c <= "9") {
        return c.charCodeAt(0) - "0".charCodeAt(0);
    } else if ("a" <= c && c <= "f") {
        return c.charCodeAt(0) - "a".charCodeAt(0) + 10;
    }
}

function getChar() {
    const first = getPlainChar();

    if (isSuperscript(first)) {
        const second = getPlainChar();

        if (isSuperscript(second)) {
            const next = getPlainChar();

            if (next === EOF || next === EOL) {
                unGetChar(next);
                unGetChar(second);
                return first;
            } else {
                const nextnext = getPlainChar();

                if (isHexChar(next) && isHexChar(nextnext)) {
                    unGetChar(String.fromCharCode(hexValue(next) * 16 + hexValue(nextnext)));
                    return getChar();
                } else if (next <= "?") {
                    unGetChar(nextnext);
                    unGetChar(String.fromCharCode(next.charCodeAt(0) + 0x40));
                    return getChar();
                } else {
                    unGetChar(nextnext);
                    unGetChar(String.fromCharCode(next.charCodeAt(0) - 0x40));
                    return getChar();
                }
            }
        } else {
            unGetChar(second);
            return first;
        }
    } else {
        return first;
    }
}

function isSuperscript(c) {
    return getCategory(c) === Category.Superscript;
}

function isLetter(c) {
    return getCategory(c) === Category.Letter;
}

function isComment(c) {
    return getCategory(c) === Category.Comment;
}

function isEscape(c) {
    return getCategory(c) === Category.Escape;
}

function isIgnored(c) {
    return getCategory(c) === Category.Ignored;
}

function isSpace(c) {
    return getCategory(c) === Category.Space;
}

function isEndOfLine(c) {
    return getCategory(c) === Category.EndOfLine;
}

function isInvalid(c) {
    return getCategory(c) === Category.Invalid;
}

export function lexToken() {
    const start = getChar();

    if (start === EOF) {
        return null;
    } else if (start === EOL) {
        state = BEGINNING_LINE;
        return lexToken();
    } else if (isInvalid(start)) {
        throw new Error(`Invalid character found: ${start}`);
    } else if (isEscape(start)) {
        state = SKIPPING_BLANKS;
        let next = getChar();

        if (next === EOF || next === EOL) {
            throw new Error("Invalid EOF lexing control sequence");
        }

        if (isLetter(next)) {
            let sequence = next;

            next = getChar();
            while (isLetter(next)) {
                sequence += next;
                next = getChar();
            }
            unGetChar(next);

            return new Token(Token.CONTROL_SEQUENCE, sequence);
        } else {
            return new Token(Token.CONTROL_SEQUENCE, next);
        }
    } else if (isEndOfLine(start)) {
        if (state === BEGINNING_LINE) {
            return new Token(Token.CONTROL_SEQUENCE, "par");
        } else if (state === MIDDLE_LINE) {
            return new Token(Token.CHAR_TOKEN, " ", Category.Space);
        } else if (state === SKIPPING_BLANKS) {
            return lexToken();
        }
    } else if (isSpace(start)) {
        if (state === MIDDLE_LINE) {
            state = SKIPPING_BLANKS;
            return new Token(Token.CHAR_TOKEN, " ", Category.Space);
        } else {
            return lexToken();
        }
    } else if (isComment(start)) {
        input[0] = [];
        return lexToken();
    } else if (isIgnored(start)) {
        return lexToken();
    } else {
        state = MIDDLE_LINE;
        return new Token(Token.CHAR_TOKEN, start, Category.Letter);
    }
}
