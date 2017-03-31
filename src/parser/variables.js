import {lexToken} from "../lexer.js";
import {Variable, CountVariable} from "../Variable.js";
import {Token, ControlSequence} from "../Token.js";
import {parse8BitNumber} from "./primitives.js";

const COUNT = new ControlSequence("count");

export function isVariableHead(tok: Token): boolean {
    return tok.equals(COUNT);
}

export function parseVariable(): Variable {
    const tok = lexToken();

    if (!tok) {
        throw new Error("Encountered EOF while parsing variable");
    } else if (tok.equals(COUNT)) {
        const index = parse8BitNumber();
        return new CountVariable(index);
    } else {
        throw new Error("unimplemented");
    }
}
