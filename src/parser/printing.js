// @flow
import {Token, CharToken, ControlSequence} from "../Token.js";
import {parseNumberValue} from "./primitives.js";
import {Other} from "../Category.js";
import {lexToken, peekToken} from "../lexer.js";

const NUMBER = new ControlSequence("number");

export function isPrintHead(): boolean {
    const tok = peekToken();
    return !!tok && tok.equals(NUMBER);
}

function printNumber(val: number): Token[] {
    if (val < 0) {
        return [new CharToken("-", Other), ...printNumber(-val)];
    } else {
        return ("" + val).split("").map(c => new CharToken(c, Other));
    }
}

export function expandPrint(): Token[] {
    const tok = lexToken();
    if (!!tok && tok.equals(NUMBER)) {
        const value = parseNumberValue();
        return printNumber(value);
    } else {
        throw new Error("unimplemented");
    }
}
