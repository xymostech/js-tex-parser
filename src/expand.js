// @flow
import {getLet, getMacro} from "./state.js";
import {lexToken, unLexToken} from "./lexer.js";
import {Token} from "./Token.js";
import {parseReplacementText} from "./parser/macros.js";
import {isConditionalHead, expandConditional} from "./parser/conditionals.js";
import {isPrintHead, expandPrint} from "./parser/printing.js";

function unLexMany(toks: Token[]) {
    toks.reverse();
    toks.forEach(tok => {
        unLexToken(tok);
    });
}

export function lexExpandedToken(): ?Token {
    const tok = lexToken();

    if (!tok) {
        return null;
    }

    const macro = getMacro(tok);
    const letReplace = getLet(tok);
    if (macro) {
        const values = parseReplacementText(macro);
        unLexMany(macro.getReplacement(values));
        return lexExpandedToken();
    } else if (letReplace) {
        unLexToken(letReplace);
        return lexExpandedToken();
    } else if (isConditionalHead(tok)) {
        expandConditional(tok);
        return lexExpandedToken();
    } else if (isPrintHead(tok)) {
        unLexMany(expandPrint(tok));
        return lexExpandedToken();
    } else {
        return tok;
    }
}
