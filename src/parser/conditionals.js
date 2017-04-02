import {Token, CharToken, ControlSequence} from "../Token.js";
import {lexToken} from "../lexer.js";
import {lexExpandedToken} from "../expand.js";
import {parseNumberValue} from "./primitives.js";
import {Other} from "../Category.js";
import {isAssignmentHead, parseAssignment} from "./assignment.js";

const IFNUM = new ControlSequence("ifnum");
const IFTRUE = new ControlSequence("iftrue");
const IFFALSE = new ControlSequence("iffalse");
const FI = new ControlSequence("fi");
const ELSE = new ControlSequence("else");

export function isConditionalHead(tok: Token): boolean {
    return (
        tok.equals(IFNUM) ||
        tok.equals(IFTRUE) ||
        tok.equals(IFFALSE));
}

function parseTrueBody(): Token[] {
    const result = [];

    let tok = lexExpandedToken();
    while (tok && !(tok.equals(FI) || tok.equals(ELSE))) {
        if (isAssignmentHead(tok)) {
            parseAssignment(tok);
        } else {
            result.push(tok);
        }
        tok = lexExpandedToken();
    }
    if (!tok || tok.equals(FI)) {
        return result;
    }

    while (tok && !tok.equals(FI)) {
        tok = lexToken();
    }
    return result;
}

function parseFalseBody(): Token[] {
    let tok = lexExpandedToken();
    while (tok && !(tok.equals(FI) || tok.equals(ELSE))) {
        tok = lexToken();
    }
    if (!tok) {
        throw new Error("EOF found while parsing false body");
    } else if (tok.equals(FI)) {
        return [];
    }

    const result = [];
    tok = lexExpandedToken();
    while (tok && !tok.equals(FI)) {
        if (isAssignmentHead(tok)) {
            parseAssignment(tok);
        } else {
            result.push(tok);
        }
        tok = lexExpandedToken();
    }
    return result;
}

const GREATER_THAN = new CharToken(">", Other);
const EQUAL_TO = new CharToken("=", Other);
const LESS_THAN = new CharToken("<", Other);

export function expandConditional(tok: Token): Token[] {
    if (tok.equals(IFTRUE)) {
        return parseTrueBody();
    } else if (tok.equals(IFFALSE)) {
        return parseFalseBody();
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
                ? parseTrueBody()
                : parseFalseBody();
        } else if (relation.equals(EQUAL_TO)) {
            return num1 === num2
                ? parseTrueBody()
                : parseFalseBody();
        } else {
            return num1 < num2
                ? parseTrueBody()
                : parseFalseBody();
        }
    } else {
        throw new Error("unimplemented");
    }
}
