// @flow
import {Token, CharToken, ControlSequence} from "../Token.js";
import {lexToken, tryLexTokens} from "../lexer.js";
import {lexExpandedToken, peekExpandedToken} from "../expand.js";
import {getChardef} from "../state.js";
import {Space, Other, BeginGroup, EndGroup} from "../Category.js";
import {isVariableHead, parseVariable} from "./variables.js";
import {IntegerVariable} from "../Variable.js";

function parseWhile(
    check: (t: ?Token) => boolean,
    pass?: (t: ?Token) => void,
    ensureOne: boolean = false
) {
    let cont = true;
    let count = 0;
    while (cont) {
        cont = tryLexTokens((accept, reject) => {
            const tok = lexExpandedToken();
            if (check(tok)) {
                count++;
                pass && pass(tok);
                return accept(true);
            } else {
                return reject(false);
            }
        });
    }
    if (ensureOne && count === 0) {
        throw new Error("Needed at least one parsed token");
    }
}

export function parseOptionalSpaces() {
    parseWhile(
        tok => !!tok &&
            tok instanceof CharToken &&
            tok.category === Space);
}

const EQUALS = new CharToken("=", Other);

export function parseEquals() {
    parseOptionalSpaces();
    tryLexTokens((accept, reject) => {
        const tok = lexExpandedToken();
        if (tok && !tok.equals(EQUALS)) {
            return reject();
        }
        return accept();
    });
}

export function parseOptionalSpace() {
    tryLexTokens((accept, reject) => {
        const tok = lexExpandedToken();
        if (tok && tok instanceof CharToken && tok.category === Space) {
            return accept();
        }
        return reject();
    });
}

const PLUS = new CharToken("+", Other);
const MINUS = new CharToken("-", Other);

function parseOptionalSigns(): number {
    let sign = 1;
    parseWhile(
        tok => !!tok && (tok.equals(PLUS) || tok.equals(MINUS)),
        tok => {
            if (tok && tok.equals(MINUS)) {
                sign *= -1;
            }
        });
    parseOptionalSpaces();
    return sign;
}

function isDigit(tok: Token): boolean {
    return (
        tok instanceof CharToken &&
        tok.category === Other &&
        tok.ch >= "0" && tok.ch <= "9");
}

function digitValue(tok: Token): number {
    if (!(tok instanceof CharToken) || !isDigit(tok)) {
        throw new Error("non-digit in digitValue");
    }

    return tok.ch.charCodeAt(0) - "0".charCodeAt(0);
}

function isIntegerConstantHead(): boolean {
    const tok = peekExpandedToken();
    return !!tok && isDigit(tok);
}

function parseIntegerConstant(): number {
    const tok = lexExpandedToken();
    if (!tok || !isDigit(tok)) {
        throw new Error("Invalid number start");
    }
    let value = digitValue(tok);

    parseWhile(
        tok => !!tok && isDigit(tok),
        tok => {
            if (tok) {
                value = 10 * value + digitValue(tok);
            }
        });
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

function isInternalIntegerHead(): boolean {
    const tok = peekExpandedToken();
    if (!tok) {
        return false;
    } else if (
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
    if (isVariableHead()) {
        const variable = parseVariable();
        // TODO(emily): Not all variables?
        if (variable instanceof IntegerVariable) {
            return variable.getValue();
        } else {
            throw new Error(
                "Got invalid variable type looking for integer variable");
        }
    } else {
        const tok = lexExpandedToken();
        if (!tok) {
            throw new Error("EOF while parsing internal integer");
        }
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
    if (isInternalIntegerHead()) {
        return parseInternalInteger();
    } else if (isIntegerConstantHead()) {
        return parseIntegerConstant();
    } else {
        const tok = lexExpandedToken();

        if (!tok) {
            throw new Error("missing token at beginning of number");
        } else if (tok.equals(OCTAL_PREFIX)) {
            throw new Error("unimplemented");
        } else if (tok.equals(HEX_PREFIX)) {
            throw new Error("unimplemented");
        } else if (tok.equals(CHAR_PREFIX)) {
            return parseCharToken();
        } else {
            throw new Error("unimplemented");
        }
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
    if (isVariableHead()) {
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

    let good = true;
    for (let i = 0; good && i < chars.length; i++) {
        const char = chars[i];
        good = tryLexTokens((accept, reject) => {
            const tok = lexExpandedToken();

            if (
                tok instanceof CharToken &&
                (tok.ch === char.toLowerCase() ||
                 tok.ch === char.toUpperCase())
            ) {
                return accept(true);
            } else if (i === 0) {
                return reject(false);
            } else if (!tok) {
                throw new Error("EOF encountered while parsing explicit chars");
            } else {
                throw new Error(
                    `Invalid token ${tok.toString()} found while looking for ` +
                    `explicit ${char}`);
            }
        });
    }
}

export function parseBalancedText(): Token[] {
    const result: Token[] = [];
    let braceLevel = 0;

    let good = true;
    while (good) {
        good = tryLexTokens((accept, reject) => {
            const tok = lexExpandedToken();
            if (!tok) {
                return reject(false);
            } else if (tok instanceof CharToken && tok.category === BeginGroup) {
                result.push(tok);
                braceLevel++;
                return accept(true);
            } else if (tok instanceof CharToken && tok.category === EndGroup) {
                if (braceLevel === 0) {
                    return reject(false);
                } else {
                    result.push(tok);
                    braceLevel--;
                    return accept(true);
                }
            } else {
                result.push(tok);
                return accept(true);
            }
        });
    }

    return result;
}
