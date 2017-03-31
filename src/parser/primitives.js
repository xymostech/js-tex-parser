import {CharToken} from "../Token.js";
import {lexToken, unLexToken} from "../lexer.js";
import {Space, Other} from "../Category.js";

function parseOptionalSpaces() {
    let tok = lexToken();
    while (tok && tok instanceof CharToken && tok.category === Space) {
        tok = lexToken();
    }
    unLexToken(tok);
}

const EQUALS = new CharToken("=", Other);

export function parseEquals() {
    parseOptionalSpaces();
    const tok = lexToken();
    if (tok && !tok.equals(EQUALS)) {
        unLexToken(tok);
    }
}

export function parseOptionalSpace() {
    const tok = lexToken();
    if (!(tok && tok instanceof CharToken && tok.category === Space)) {
        unLexToken(tok);
    }
}

const PLUS = new CharToken("+", Other);
const MINUS = new CharToken("-", Other);

function parseOptionalSigns(): number {
    let sign = 1;
    let tok = lexToken();
    while (tok && (tok.equals(PLUS) || tok.equals(MINUS))) {
        if (tok.equals(MINUS)) {
            sign *= -1;
        }
        tok = lexToken();
    }
    unLexToken(tok);
    parseOptionalSpaces();
    return sign;
}

function isDigit(tok): boolean {
    return (
        tok instanceof CharToken &&
        tok.category === Other &&
        tok.ch >= "0" && tok.ch <= "9");
}

function digitValue(tok): number {
    if (!(tok instanceof CharToken) || !isDigit(tok)) {
        throw new Error("non-digit in digitValue");
    }

    return tok.ch.charCodeAt(0) - "0".charCodeAt(0);
}

function parseIntegerConstant(): number {
    let value = 0;
    let tok = lexToken();

    if (!tok || !isDigit(tok)) {
        throw new Error("Invalid number!");
    }

    while (tok && isDigit(tok)) {
        value = 10 * value + digitValue(tok);
        tok = lexToken();
    }

    parseOptionalSpace();

    return value;
}

const OCTAL_PREFIX = new CharToken("'", Other);
const HEX_PREFIX = new CharToken("\"", Other);
const CHAR_PREFIX = new CharToken("`", Other);

function parseUnsignedNumber(): number {
    const tok = lexToken();

    if (!tok) {
        throw new Error("missing token at beginning of number");
    } else if (tok.equals(OCTAL_PREFIX)) {
        throw new Error("unimplemented");
    } else if (tok.equals(HEX_PREFIX)) {
        throw new Error("unimplemented");
    } else if (tok.equals(CHAR_PREFIX)) {
        throw new Error("unimplemented");
    } else {
        unLexToken(tok);
        return parseIntegerConstant();
    }
}

export function parseNumber(): number {
    const sign = parseOptionalSigns();
    const number = parseUnsignedNumber();
    return sign * number;
}

export function parse8BitNumber(): number {
    const number = parseNumber();
    if (number < 0 || number > 255) {
        throw new Error(`Invalid 8-bit number: ${number}`);
    }
    return number;
}

export function parseExplicitChars(chars: string) {
    parseOptionalSpaces();

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const tok = lexToken();

        if (!tok) {
            throw new Error("EOF encountered while parsing explicit chars");
        } else if (
            tok instanceof CharToken &&
            (tok.ch === char.toLowerCase() ||
             tok.ch === char.toUpperCase())
        ) {
            continue;
        } else {
            throw new Error(
                `Invalid token ${tok.toString()} found while looking for ` +
                `explicit ${char}`);
        }
    }
}

export function parseOptionalExplicitChars(chars: string) {
    parseOptionalSpaces();

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const tok = lexToken();

        if (
            tok instanceof CharToken &&
            (tok.ch === char.toLowerCase() ||
             tok.ch === char.toUpperCase())
        ) {
            continue;
        } else if (i === 0) {
            unLexToken(tok);
            return;
        } else if (!tok) {
            throw new Error("EOF encountered while parsing explicit chars");
        } else {
            throw new Error(
                `Invalid token ${tok.toString()} found while looking for ` +
                `explicit ${char}`);
        }
    }
}
