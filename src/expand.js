// @flow
import {getLet, getMacro} from "./state.js";
import {lexToken, pushNextToken, tryLexTokens} from "./lexer.js";
import {Token} from "./Token.js";
import {parseReplacementText} from "./parser/macros.js";
import {isConditionalHead, expandConditional} from "./parser/conditionals.js";
import {isPrintHead, expandPrint} from "./parser/printing.js";

function pushMany(toks: Token[]) {
    toks.reverse();
    toks.forEach(tok => {
        pushNextToken(tok);
    });
}

export function lexExpandedToken(): ?Token {
    if (isConditionalHead()) {
        expandConditional();
        return lexExpandedToken();
    } else if (isPrintHead()) {
        pushMany(expandPrint());
        return lexExpandedToken();
    } else {
        const tok = lexToken();

        if (!tok) {
            return null;
        }

        const macro = getMacro(tok);
        const letReplace = getLet(tok);
        if (macro) {
            const values = parseReplacementText(macro);
            pushMany(macro.getReplacement(values));
            return lexExpandedToken();
        } else if (letReplace) {
            pushNextToken(letReplace);
            return lexExpandedToken();
        } else {
            return tok;
        }
    }
}

export function peekExpandedToken(): ?Token {
    return tryLexTokens((accept, reject) => {
        return reject(lexExpandedToken());
    });
}