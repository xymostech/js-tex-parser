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

let nextTokens: Token[] = [];

let source: string[] = [];

let row: number;
let col: number;

let state = BEGINNING_LINE;

export function setSource(lines: string[]) {
    source = lines.map(line => line + "\n");
    row = 0;
    col = 0;
    state = BEGINNING_LINE;
    nextTokens = [];
}

function getPlainChar(): typeof EOF | typeof EOL | string {
    if (row === source.length) {
        return EOF;
    }

    const line = source[row];

    if (col === line.length) {
        row++;
        col = 0;
        return EOL;
    }

    const ch = line[col];
    col++;
    return ch;
}

function unGetChar(c: typeof EOF | typeof EOL | string) {
    if (c === EOF) {
        return;
    } else if (c === EOL) {
        row--;
        col = source[row].length - 1;
    } else {
        col--;
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

function getChar(): typeof EOF | typeof EOL | string {
    const first = getPlainChar();

    if (first === EOF || first === EOL) {
        return first;
    }

    return getCharWithFirst(first);
}

function getCharWithFirst(first: string): typeof EOF | typeof EOL | string {
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
                    return getCharWithFirst(
                        String.fromCharCode(hexValue(next) * 16 +
                        hexValue(nextnext)));
                } else if (next <= "?") {
                    unGetChar(nextnext);
                    return getCharWithFirst(
                        String.fromCharCode(next.charCodeAt(0) + 0x40));
                } else {
                    unGetChar(nextnext);
                    return getCharWithFirst(
                        String.fromCharCode(next.charCodeAt(0) - 0x40));
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

export function pushNextToken(tok: Token) {
    nextTokens.unshift(tok);
}

const ACCEPT = Symbol("accept");
const REJECT = Symbol("reject");

type AcceptOrRejectValue<T> = {
    kind: typeof ACCEPT | typeof REJECT,
    value: T,
};

function accept<T>(value: T): AcceptOrRejectValue<T> {
    return {
        kind: ACCEPT,
        value,
    };
}

function reject<T>(value: T): AcceptOrRejectValue<T> {
    return {
        kind: REJECT,
        value,
    };
}

export function tryLexTokens<T>(
    cb: (
        accept: (T) => AcceptOrRejectValue<T>,
        reject: (T) => AcceptOrRejectValue<T>
    ) => AcceptOrRejectValue<T>,
): T {
    const holdRow = row;
    const holdCol = col;
    const holdNextTokens = nextTokens.slice();
    const holdState = state;

    const result = cb(accept, reject);

    if (result && result.kind === REJECT) {
        row = holdRow;
        col = holdCol;
        nextTokens = holdNextTokens;
        state = holdState;
        return result.value;
    } else if (result && result.kind === ACCEPT) {
        return result.value;
    } else {
        throw new Error("Must return accept() or reject() out of tryLexTokens");
    }
}

export function peekToken(): ?Token {
    return tryLexTokens((accept, reject) => {
        return reject(lexToken());
    });
}

export function lexToken(): ?Token {
    if (nextTokens.length > 0) {
        return nextTokens.shift();
    }

    return lexTokenInner();
}

export function lexTokenInner(): ?Token {
    const start = getChar();

    if (start === EOF) {
        return null;
    } else if (start === EOL) {
        state = BEGINNING_LINE;
        return lexTokenInner();
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
            return lexTokenInner();
        }
    } else if (isSpace(start)) {
        if (state === MIDDLE_LINE) {
            state = SKIPPING_BLANKS;
            return new CharToken(" ", Space);
        } else {
            return lexTokenInner();
        }
    } else if (isComment(start)) {
        col = source[row].length;
        return lexTokenInner();
    } else if (isIgnored(start)) {
        return lexTokenInner();
    } else {
        state = MIDDLE_LINE;
        return new CharToken(start, getCategory(start));
    }
}
