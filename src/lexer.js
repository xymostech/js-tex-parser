// @flow
import {Token, CharToken, ControlSequence} from "./Token.js";
import type {Category} from "./Category.js";
import {
    Superscript, Letter, Comment, Escape, Ignored, Space, EndOfLine, Invalid,
} from "./Category.js";
import {getCategory} from "./state.js";

const EOF = Symbol("eof");
const EOL = Symbol("eol");

const BEGINNING_LINE = Symbol("beginning line");
const MIDDLE_LINE = Symbol("middle line");
const SKIPPING_BLANKS = Symbol("skipping blanks");

let source: string[] = [];
let state = BEGINNING_LINE;

export function setSource(lines: string[]) {
    source = lines.map(line => line + "\n");
    state = BEGINNING_LINE;
}

function getPlainChar(): typeof EOF | typeof EOL | string {
    if (source.length === 0) {
        return EOF;
    }

    const line = source[0];

    if (line.length === 0) {
        source = source.slice(1);
        return EOL;
    }

    const ch = line[0];
    source[0] = line.slice(1);
    return ch;
}

function unGetChar(c: typeof EOF | typeof EOL | string) {
    if (c === EOF) {
        return;
    } else if (c === EOL) {
        source.unshift("");
    } else if (source.length === 0) {
        source = [c];
    } else {
        source[0] = c + source[0];
    }
}

function isHexChar(c: string): boolean {
    return ("0" <= c && c <= "9") || ("a" <= c && c <= "f");
}

function hexValue(c: string): number {
    if ("0" <= c && c <= "9") {
        return c.charCodeAt(0) - "0".charCodeAt(0);
    } else if ("a" <= c && c <= "f") {
        return c.charCodeAt(0) - "a".charCodeAt(0) + 10;
    } else {
        throw new Error(`Invalid hex char: ${c}`);
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
                    unGetChar(
                        String.fromCharCode(hexValue(next) * 16 +
                        hexValue(nextnext)));
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
    return getCategory(c) === Superscript;
}

function isLetter(c) {
    return getCategory(c) === Letter;
}

function isComment(c) {
    return getCategory(c) === Comment;
}

function isEscape(c) {
    return getCategory(c) === Escape;
}

function isIgnored(c) {
    return getCategory(c) === Ignored;
}

function isSpace(c) {
    return getCategory(c) === Space;
}

function isEndOfLine(c) {
    return getCategory(c) === EndOfLine;
}

function isInvalid(c) {
    return getCategory(c) === Invalid;
}

export function lexToken(): ?Token {
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

            return new ControlSequence(sequence);
        } else {
            return new ControlSequence(next);
        }
    } else if (isEndOfLine(start)) {
        if (state === BEGINNING_LINE) {
            return new ControlSequence("par");
        } else if (state === MIDDLE_LINE) {
            return new CharToken(" ", Space);
        } else if (state === SKIPPING_BLANKS) {
            return lexToken();
        }
    } else if (isSpace(start)) {
        if (state === MIDDLE_LINE) {
            state = SKIPPING_BLANKS;
            return new CharToken(" ", Space);
        } else {
            return lexToken();
        }
    } else if (isComment(start)) {
        source[0] = "";
        return lexToken();
    } else if (isIgnored(start)) {
        return lexToken();
    } else {
        state = MIDDLE_LINE;
        return new CharToken(start, Letter);
    }
}
