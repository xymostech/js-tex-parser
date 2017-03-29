// @flow
import {Token, ControlSequence} from "../Token.js";
import {lexToken, unLexToken} from "../lexer.js";
import {parse8BitNumber, parseNumber, parseEquals} from "./primitives.js";
import {setCount} from "../state.js";

/*
 * Assignments are:
 *  - non-macro assignment

 *   - simple assignment
 *    - variable assignment
 *     - <integer variable>=...
 *      - integer parameter
 *      - countdef token
 *      - \count<number>
 *     - <dimen variable>=...
 *      - dimen parameter
 *      - dimendef token
 *      - \dimen<number>
 *     - <glue variable>=...
 *      - glue parameter
 *      - skipdef token
 *      - \skip<number>
 *     - <muglue variable>=...
 *      - muglue parameter
 *      - muskipdef token
 *      - \muskip<number>
 *     - <token variable>=...
 *      - token parameter
 *      - toksdef token
 *      - \toks<number>

 *    - arithmetic
 *     - \advance...
 *     - \multiply...
 *     - \divide...

 *    - code assignment
 *     - <codename><equals>...

 *    - let assignment
 *     - \futurelet...
 *     - \let...

 *    - shorthand definition
 *     - \chardef...
 *     - \mathchardef...
 *     - <registerdef>...
 *      - <registerdef> = \countdef, \dimendef, \skipdef, \muskipdef, \toksdef

 *    - fontdef token
 *    - family assignment
 *    - shape assignment
 *    - \read
 *    - \setbox
 *    - \font
 *    - global assignment
 *     - font assignment
 *     - hyphenation assignment
 *     - box size assignment
 *     - interaction mode assignment
 *     - intimate assignment
 *   - \global<non-macro assignment>
 *  - macro assignment
 *   - definition
 *    - <def><control sequence><definition text>
 *     - <def> = \def, \gdef, \edef, \xdef
 *   - <prefix><macro assignment>
 *    - <prefix> = \global, \long, \outer
 */

const COUNT = new ControlSequence("count");
const DIMEN = new ControlSequence("dimen");
const SKIP = new ControlSequence("skip");
const MUSKIP = new ControlSequence("muskip");
const TOKS = new ControlSequence("toks");

function isSimpleAssignmentHead(tok) {
    const isParamAssignment = false;
    const isDefTokenAssignment = false;
    const isExplicitTokenAssignment =
          tok.equals(COUNT) || tok.equals(DIMEN) || tok.equals(SKIP) ||
          tok.equals(MUSKIP) || tok.equals(TOKS);

    return isParamAssignment || isDefTokenAssignment ||
        isExplicitTokenAssignment;
}

function parseSimpleAssignment(tok) {
    if (tok.equals(COUNT)) {
        const countRegister = parse8BitNumber();
        parseEquals();
        const value = parseNumber();
        setCount(countRegister, value);
    } else {
        throw new Error("unimplemented");
    }
}

const ADVANCE = new ControlSequence("advance");
const MULTIPLY = new ControlSequence("multiply");
const DIVIDE = new ControlSequence("divide");

function isArithmeticHead(tok) {
    return tok.equals(ADVANCE) || tok.equals(MULTIPLY) || tok.equals(DIVIDE);
}

const LET = new ControlSequence("let");
const FUTURELET = new ControlSequence("futurelet");

function isLetAssignmentHead(tok) {
    return tok.equals(LET) || tok.equals(FUTURELET);
}

const DEF = new ControlSequence("def");
const EDEF = new ControlSequence("edef");
const GDEF = new ControlSequence("gdef");
const XDEF = new ControlSequence("xdef");

function isNonMacroAssignmentHead(tok) {
    return (
        isLetAssignmentHead(tok) ||
        isArithmeticHead(tok) ||
        isSimpleAssignmentHead(tok));
}

function parseNonMacroAssignment(tok) {
    if (isSimpleAssignmentHead(tok)) {
        parseSimpleAssignment(tok);
    }
}

function isMacroAssignmentHead(tok) {
    return (
        tok.equals(DEF) ||
        tok.equals(EDEF) ||
        tok.equals(GDEF) ||
        tok.equals(XDEF));
}

function isAssignmentHead(tok: Token) {
    return (
        isNonMacroAssignmentHead(tok) ||
        isMacroAssignmentHead(tok));
}

export function parseAssignment(): boolean {
    const tok = lexToken();

    if (!tok) {
        return false;
    }

    if (!isAssignmentHead(tok)) {
        unLexToken(tok);
        return false;
    }

    if (isNonMacroAssignmentHead(tok)) {
        parseNonMacroAssignment(tok);
    }

    return true;
}
