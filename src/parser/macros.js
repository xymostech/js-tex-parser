import {CharToken} from "../Token.js";
import {lexToken} from "../lexer.js";
import {Macro, Parameter} from "../Macro.js";
import {Token} from "../Token.js";
import {BeginGroup, EndGroup, Parameter as ParameterCat, Other} from "../Category.js";

function parseParameterNumber(): number {
    const tok = lexToken();
    if (
        tok &&
        tok instanceof CharToken &&
        tok.category === Other &&
        (tok.ch >= "1" && tok.ch <= "9")
    ) {
        return tok.ch.charCodeAt(0) - "0".charCodeAt(0);
    } else if (!tok) {
        throw new Error(`EOF found while parsing macro`);
    } else {
        throw new Error(
            `Invalid token after parameter token: ` +
            `${tok.toString()}`);
    }
}

export function parseDefinitionText(): Macro {
    const parameterText: (Parameter | Token)[] = [];

    let tok = lexToken();
    while (tok && !(tok instanceof CharToken && tok.category === BeginGroup)) {
        if (tok instanceof CharToken && tok.category === ParameterCat) {
            const index = parseParameterNumber();
            parameterText.push(new Parameter(index));
        } else {
            parameterText.push(tok);
        }
        tok = lexToken();
    }

    if (!tok) {
        throw new Error(`EOF found while parsing macro`);
    }

    const replacementText: (Parameter | Token)[] = [];
    let braceLevel = 0;

    tok = lexToken();
    while (
        tok &&
        (braceLevel > 0 ||
         !(tok instanceof CharToken && tok.category === EndGroup))
    ) {
        if (tok instanceof CharToken && tok.category === ParameterCat) {
            const index = parseParameterNumber();
            replacementText.push(new Parameter(index));
        } else if (tok instanceof CharToken && tok.category === BeginGroup) {
            replacementText.push(tok);
            braceLevel++;
        } else if (tok instanceof CharToken && tok.category === EndGroup) {
            replacementText.push(tok);
            braceLevel--;
        } else {
            replacementText.push(tok);
        }
        tok = lexToken();
    }

    if (!tok) {
        throw new Error(`EOF found while parsing macro`);
    }

    return new Macro(parameterText, replacementText);
}
