// @flow
import {Token, CharToken, ControlSequence} from "../Token.js";
import {lexToken, unLexToken} from "../lexer.js";
import {lexExpandedToken} from "../expand.js";
import {getChardef} from "../state.js";
import {Space, Other, BeginGroup, EndGroup} from "../Category.js";
import {isVariableHead, parseVariable} from "./variables.js";
import {IntegerVariable} from "../Variable.js";

export function parseOptionalSpaces() {
    let tok = lexExpandedToken();
    while (tok && tok instanceof CharToken && tok.category === Space) {
        tok = lexExpandedToken();
    }
    unLexToken(tok);
}

const EQUALS = new CharToken("=", Other);

export function parseEquals() {
    parseOptionalSpaces();
    const tok = lexExpandedToken();
    if (tok && !tok.equals(EQUALS)) {
        unLexToken(tok);
    }
}

export function parseOptionalSpace() {
    const tok = lexExpandedToken();
    if (!(tok && tok instanceof CharToken && tok.category === Space)) {
        unLexToken(tok);
    }
}

const PLUS = new CharToken("+", Other);
const MINUS = new CharToken("-", Other);

function parseOptionalSigns(): number {
    let sign = 1;
    let tok = lexExpandedToken();
    while (tok && (tok.equals(PLUS) || tok.equals(MINUS))) {
        if (tok.equals(MINUS)) {
            sign *= -1;
        }
        tok = lexExpandedToken();
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
    let tok = lexExpandedToken();

    if (!tok || !isDigit(tok)) {
        throw new Error(`Invalid number!`);
    }

    while (tok && isDigit(tok)) {
        value = 10 * value + digitValue(tok);
        tok = lexExpandedToken();
    }
    unLexToken(tok);
    parseOptionalSpace();

    return value;
}

function parseCharToken(): number {
    const tok = lexToken();

    if (!tok) {
        throw new Error("EOF");
    } else if (tok instanceof CharToken) {
        parseOptionalSpace();
        return tok.ch.charCodeAt(0);
    } else if (tok instanceof ControlSequence && tok.value.length === 1) {
        parseOptionalSpace();
        return tok.value[0].charCodeAt(0);
    } else {
        throw new Error(
            `Invalid token parsing char token: ${tok.toString()}`);
    }
}

// TODO(emily): deduplicate
const COUNT = new ControlSequence("count");
const CATCODE = new ControlSequence("catcode");

function isInternalIntegerHead(tok: Token): boolean {
    if (
        tok.equals(COUNT) ||
        tok.equals(CATCODE)
    ) {
        return true;
    } else if (getChardef(tok) != null) {
        return true;
    } else {
        return false;
    }
}

function parseInternalInteger(): number {
    const tok = lexExpandedToken();

    if (!tok) {
        throw new Error("EOF");
    } else if (isVariableHead(tok)) {
        unLexToken(tok);
        const variable = parseVariable();
        // TODO(emily): Not all variables?
        if (variable instanceof IntegerVariable) {
            return variable.getValue();
        } else {
            throw new Error(
                "Got invalid variable type looking for integer variable");
        }
    } else {
        const charDefVal = getChardef(tok);
        if (charDefVal != null) {
            return charDefVal.charCodeAt(0);
        } else {
            throw new Error("unimplemented");
        }
    }
}

const OCTAL_PREFIX = new CharToken("'", Other);
const HEX_PREFIX = new CharToken("\"", Other);
const CHAR_PREFIX = new CharToken("`", Other);

function parseUnsignedNumber(): number {
    const tok = lexExpandedToken();

    if (!tok) {
        throw new Error("missing token at beginning of number");
    } else if (tok.equals(OCTAL_PREFIX)) {
        throw new Error("unimplemented");
    } else if (tok.equals(HEX_PREFIX)) {
        throw new Error("unimplemented");
    } else if (tok.equals(CHAR_PREFIX)) {
        return parseCharToken();
    } else if (isInternalIntegerHead(tok)) {
        unLexToken(tok);
        return parseInternalInteger();
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

export function parseNumberValue(): number {
    const tok = lexExpandedToken();

    unLexToken(tok);
    if (!tok) {
        throw new Error("EOF");
    } else if (isVariableHead(tok)) {
        const variable = parseVariable();
        if (variable instanceof IntegerVariable) {
            return variable.getValue();
        } else {
            throw new Error(
                "Got invalid variable type looking for integer variable");
        }
    } else {
        return parseNumber();
    }
}

export function parseExplicitChars(chars: string) {
    parseOptionalSpaces();

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const tok = lexExpandedToken();

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
        const tok = lexExpandedToken();

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

export function parseBalancedText(): Token[] {
    const result: Token[] = [];
    let braceLevel = 0;

    let tok = lexExpandedToken();
    while (
        tok &&
        (braceLevel > 0 ||
         !(tok instanceof CharToken && tok.category === EndGroup))
    ) {
        if (tok instanceof CharToken && tok.category === BeginGroup) {
            result.push(tok);
            braceLevel++;
        } else if (tok instanceof CharToken && tok.category === EndGroup) {
            result.push(tok);
            braceLevel--;
        } else {
            result.push(tok);
        }
        tok = lexExpandedToken();
    }

    unLexToken(tok);
    return result;
}
