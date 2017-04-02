import {Token, CharToken, ControlSequence} from "../Token.js";
import {lexToken} from "../lexer.js";
import {lexExpandedToken} from "../expand.js";
import {parseNumberValue} from "./primitives.js";
import {Other} from "../Category.js";

const IFNUM = new ControlSequence("ifnum");
const IFTRUE = new ControlSequence("iftrue");
const IFFALSE = new ControlSequence("iffalse");
const FI = new ControlSequence("fi");
const ELSE = new ControlSequence("else");

export function isConditionalHead(tok: Token): boolean {
    return (
        tok.equals(ELSE) ||
        tok.equals(FI) ||
        tok.equals(IFNUM) ||
        tok.equals(IFTRUE) ||
        tok.equals(IFFALSE));
}

function skipFromIf(): boolean {
    let tok = lexToken();
    while (tok && !(tok.equals(FI) || tok.equals(ELSE))) {
        tok = lexToken();
    }

    if (!tok || tok.equals(ELSE)) {
        return true;
    } else {
        return false;
    }
}

function skipFromElse() {
    let tok = lexToken();
    while (tok && !tok.equals(FI)) {
        tok = lexToken();
    }
}

const GREATER_THAN = new CharToken(">", Other);
const EQUAL_TO = new CharToken("=", Other);
const LESS_THAN = new CharToken("<", Other);

const conditionalLevels: boolean[] = [];

function handleTrue() {
    conditionalLevels.push(true);
}

function handleFalse() {
    if (skipFromIf()) {
        conditionalLevels.push(false);
    }
}

export function expandConditional(tok: Token) {
    if (tok.equals(FI)) {
        conditionalLevels.pop();
    } else if (tok.equals(ELSE)) {
        conditionalLevels.pop();
        skipFromElse();
    } else if (tok.equals(IFTRUE)) {
        handleTrue();
    } else if (tok.equals(IFFALSE)) {
        handleFalse();
    } else if (tok.equals(IFNUM)) {
        const num1 = parseNumberValue();
        const relation = lexExpandedToken();
        if (!relation) {
            throw new Error("Got EOF when looking for relation");
        } else if (!(
            relation.equals(GREATER_THAN) ||
            relation.equals(EQUAL_TO) ||
            relation.equals(LESS_THAN)
        )) {
            throw new Error(`Got invalid relation: ${relation.toString()}`);
        }
        const num2 = parseNumberValue();

        if (relation.equals(GREATER_THAN)) {
            return num1 > num2
                ? handleTrue()
                : handleFalse();
        } else if (relation.equals(EQUAL_TO)) {
            return num1 === num2
                ? handleTrue()
                : handleFalse();
        } else {
            return num1 < num2
                ? handleTrue()
                : handleFalse();
        }
    } else {
        throw new Error("unimplemented");
    }
}
