import {getLet, getMacro} from "./state.js";
import {lexToken, unLexToken} from "./lexer.js";
import {Token} from "./Token.js";
import {parseReplacementText} from "./parser/macros.js";

export function lexExpandedToken(): ?Token {
    const tok = lexToken();

    if (!tok) {
        return null;
    }

    const macro = getMacro(tok);
    const letReplace = getLet(tok);
    if (macro) {
        const values = parseReplacementText(macro);
        const replacementToks = macro.getReplacement(values);

        replacementToks.reverse();
        replacementToks.forEach(replacementTok => {
            unLexToken(replacementTok);
        });
        return lexExpandedToken();
    } else if (letReplace) {
        unLexToken(letReplace);
        return lexExpandedToken();
    } else {
        return tok;
    }
}
