// @flow
import {tryLexTokens} from "../lexer.js";
import {lexExpandedToken} from "../expand.js";
import {Letter, Other, Space, BeginGroup, EndGroup} from "../Category.js";
import {CharToken, ControlSequence} from "../Token.js";
import {isAssignmentHead, parseAssignment} from "./assignment.js";
import {pushGroup, popGroup} from "../state.js";

class HorizontalListElem {
    static HBOX_CHAR = Symbol("horizontal box character");
    static HPENALTY = Symbol("horizontal penalty");

    kind: Symbol;

    constructor(kind: Symbol) {
        this.kind = kind;
    }
}

export class HBoxChar extends HorizontalListElem {
    ch: string;

    constructor(ch: string) {
        super(HorizontalListElem.HBOX_CHAR);
        this.ch = ch;
    }
}

export class HPenalty extends HorizontalListElem {
    val: string;

    constructor(val: string) {
        super(HorizontalListElem.HPENALTY);
        this.val = val;
    }
}


export default function parseHorizontalList() {
    const result = [];

    let groupLevel = 0;

    function parseHorizontalListElem() {
        const [checked, finished] = tryLexTokens((accept, reject) => {
            const tok = lexExpandedToken();
            if (!tok) {
                return reject([true, true]);
            } else if (tok instanceof CharToken && tok.category === EndGroup && groupLevel === 0) {
                // If this fails, we'll end up with the loop ending.
                return reject([true, true]);
            } else if (tok instanceof CharToken) {
                if (
                    tok.category === Letter ||
                    tok.category === Other
                ) {
                    result.push(new HBoxChar(tok.ch));
                } else if (tok.category === Space) {
                    result.push(new HBoxChar(" "));
                } else if (tok.category === BeginGroup) {
                    groupLevel++;
                    pushGroup();
                } else if (tok.category === EndGroup) {
                    if (groupLevel === 0) {
                        throw new Error("This should have been handled below!");
                    } else {
                        groupLevel--;
                        popGroup();
                    }
                } else {
                    throw new Error("unimplemented");
                }
                return accept([true, false]);
            } else if (tok.equals(new ControlSequence("par"))) {
                result.push(new HBoxChar(" "));
                return accept([true, false]);
            } else {
                return reject([false, false]);
            }
        });
        if (finished) {
            return false;
        } else if (checked) {
            return true;
        } else if (isAssignmentHead()) {
            parseAssignment();
            return true;
        } else {
            throw new Error("unimplemented");
        }
    }

    let done;
    do {
        done = parseHorizontalListElem();
    } while (done);

    return result;
}
