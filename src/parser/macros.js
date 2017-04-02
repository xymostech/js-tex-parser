// @flow
import {CharToken} from "../Token.js";
import {lexToken, unLexToken} from "../lexer.js";
import {lexExpandedToken} from "../expand.js";
import {Macro, Parameter} from "../Macro.js";
import {Token} from "../Token.js";
import {BeginGroup, EndGroup, Parameter as ParameterCat, Other} from "../Category.js";
import {parseBalancedText, parseOptionalSpaces} from "./primitives.js";

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

    let endTok: ?Token;

    let tok = lexToken();
    while (tok && !(tok instanceof CharToken && tok.category === BeginGroup)) {
        if (tok instanceof CharToken && tok.category === ParameterCat) {
            const nextTok = lexToken();
            if (
                nextTok instanceof CharToken &&
                nextTok.category === BeginGroup
            ) {
                parameterText.push(nextTok);
                endTok = nextTok;
                break;
            } else {
                unLexToken(nextTok);
                const index = parseParameterNumber();
                parameterText.push(new Parameter(index));
            }
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
            const nextTok = lexToken();
            if (
                nextTok instanceof CharToken &&
                nextTok.category === ParameterCat
            ) {
                replacementText.push(nextTok);
            } else {
                unLexToken(nextTok);
                const index = parseParameterNumber();
                replacementText.push(new Parameter(index));
            }
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

    if (endTok) {
        replacementText.push(endTok);
    }

    return new Macro(parameterText, replacementText);
}

export function parseReplacementText(
    macro: Macro,
    // lexExpandedToken: () => ?Token
): Map<number, Token[]> {
    const results = new Map();

    macro.parameterText.forEach((value, i) => {
        if (value instanceof Parameter) {
            const isDelimited = (
                i + 1 < macro.parameterText.length &&
                !(macro.parameterText[i + 1] instanceof Parameter));

            if (isDelimited) {
                const result: Token[] = [];

                let parsedParts = 0;

                const nextParameter = macro.parameterText.findIndex(
                    (v, ii) => ii > i && v instanceof Parameter);
                const delimiterToks: (Token | Parameter)[] = (
                    nextParameter === -1
                        ? macro.parameterText.slice(i + 1)
                        : macro.parameterText.slice(i + 1, nextParameter));

                let foundDelimiter = false;
                while (!foundDelimiter) {
                    const tok = lexToken();

                    if (!tok) {
                        throw new Error(
                            "EOF found looking for macro parameter text");
                    } else if (tok.equals(delimiterToks[0])) {
                        const delimiterParsed: Token[] = [];

                        foundDelimiter = delimiterToks.slice(1).every(
                            delimiter => {
                                const tok = lexToken();
                                if (!tok) {
                                    throw new Error(
                                        "EOF found looking for macro " +
                                        "parameter text");
                                } else if (tok.equals(delimiter)) {
                                    delimiterParsed.push(tok);
                                    return true;
                                } else {
                                    delimiterParsed.push(tok);
                                    return false;
                                }
                            });

                        delimiterParsed.reverse();
                        delimiterParsed.forEach(tok => {
                            unLexToken(tok);
                        });
                        if (foundDelimiter) {
                            unLexToken(tok);
                        } else {
                            result.push(tok);
                        }
                    } else if (
                        tok instanceof CharToken &&
                        tok.category === BeginGroup
                    ) {
                        result.push(tok);
                        result.push(...parseBalancedText());

                        const endBrace = lexToken();
                        if (!endBrace) {
                            throw new Error(
                                "EOF found looking for macro parameter text");
                        } else if (
                            endBrace instanceof CharToken &&
                            endBrace.category === EndGroup
                        ) {
                            parsedParts++;
                            result.push(endBrace);
                        } else {
                            throw new Error(
                                `Invalid token looking for balanced text ` +
                                `end: ${endBrace.toString()}`);
                        }
                    } else {
                        parsedParts++;
                        result.push(tok);
                    }
                }

                const firstToken = result[0];
                const lastToken = result[result.length - 1];

                if (
                    parsedParts === 1 &&
                    (firstToken instanceof CharToken &&
                     firstToken.category === BeginGroup) &&
                    (lastToken instanceof CharToken &&
                     lastToken.category === EndGroup)
                ) {
                    results.set(value.index, result.slice(1, -1));
                } else {
                    results.set(value.index, result);
                }
            } else {
                parseOptionalSpaces();

                const tok = lexToken();
                if (!tok) {
                    throw new Error(
                        "EOF found looking for macro parameter text");
                } else if (
                    tok instanceof CharToken &&
                    tok.category === BeginGroup
                ) {
                    const toks = parseBalancedText();
                    const endBrace = lexToken();

                    if (!endBrace) {
                        throw new Error(
                            "EOF found looking for macro parameter text");
                    } else if (
                        endBrace instanceof CharToken &&
                        endBrace.category === EndGroup
                    ) {
                        results.set(value.index, toks);
                    } else {
                        throw new Error(
                            `Invalid token found looking for macro parameter ` +
                            `text: ${endBrace.toString()}`);
                    }
                } else {
                    results.set(value.index, [tok]);
                }
            }
        } else {
            const tok = lexToken();
            if (!tok) {
                throw new Error("EOF found looking for macro parameter text");
            } else if (!value.equals(tok)) {
                throw new Error(
                    `Non-matching token in parameter text found. Found ` +
                    `${tok.toString()}, expected ${value.toString()}`);
            }
        }
    });

    return results;
}
