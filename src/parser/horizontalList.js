// @flow
import {lexExpandedToken} from "../expand.js";
import {Letter, Other, Space} from "../Category.js";
import {CharToken} from "../Token.js";
import {parseAssignment} from "./assignment.js";

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

    while (true) { // eslint-disable-line no-constant-condition
        const tok = lexExpandedToken();

        if (!tok) {
            break;
        } else if (tok instanceof CharToken) {
            if (
                tok.category === Letter ||
                tok.category === Other
            ) {
                result.push(new HBoxChar(tok.ch));
            } else if (tok.category === Space) {
                result.push(new HBoxChar(" "));
            } else {
                throw new Error("unimplemented");
            }
        } else if (parseAssignment()) {
            continue;
        } else {
            throw new Error("unimplemented");
        }
    }

    return result;
}
