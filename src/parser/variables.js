// @flow
import {lexToken} from "../lexer.js";
import {Variable, CountVariable, CatCodeVariable, CharDefVariable} from "../Variable.js";
import {Token, ControlSequence} from "../Token.js";
import {parse8BitNumber} from "./primitives.js";
import {peekExpandedToken, lexExpandedToken} from "../expand.js";

const COUNT = new ControlSequence("count");
const CATCODE = new ControlSequence("catcode");
const CHARDEF = new ControlSequence("chardef");

export function isVariableHead(): boolean {
    const tok = peekExpandedToken();
    return !!tok && (
        tok.equals(COUNT) ||
        tok.equals(CATCODE) ||
        tok.equals(CHARDEF));
}

export function parseVariable(): Variable {
    const tok = lexExpandedToken();
    if (!tok) {
        throw new Error("Encountered EOF while parsing variable");
    } else if (tok.equals(COUNT)) {
        const index = parse8BitNumber();
        return new CountVariable(index);
    } else if (tok.equals(CATCODE)) {
        const character = String.fromCharCode(parse8BitNumber());
        return new CatCodeVariable(character);
    } else if (tok.equals(CHARDEF)) {
        const deftok = lexToken();
        if (!deftok) {
            throw new Error("EOF");
        }
        return new CharDefVariable(deftok);
    } else {
        throw new Error("unimplemented");
    }
}
