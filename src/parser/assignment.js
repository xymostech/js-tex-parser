// @flow
import {Token, ControlSequence, CharToken} from "../Token.js";
import {lexToken, tryLexTokens} from "../lexer.js";
import {
    parseNumberValue, parseEquals,
    parseOptionalExplicitChars, parseOptionalSpaces,
} from "./primitives.js";
import {setMacro, setLet} from "../state.js";
import {Active, Space, Other} from "../Category.js";
import {parseDefinitionText} from "./macros.js";
import {isVariableHead, parseVariable} from "./variables.js";
import {IntegerVariable} from "../Variable.js";
import {lexExpandedToken, peekExpandedToken} from "../expand.js";

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

function isVariableAssignmentHead() {
    return isVariableHead();
}

function parseVariableAssignment(global) {
    const variable = parseVariable();
    if (variable instanceof IntegerVariable) {
        parseEquals();
        const value = parseNumberValue();
        variable.setValue(value, global);
    } else {
        throw new Error("unimplemented");
    }
}

const ADVANCE = new ControlSequence("advance");
const MULTIPLY = new ControlSequence("multiply");
const DIVIDE = new ControlSequence("divide");

function isArithmeticHead(): boolean {
    const tok = peekExpandedToken();
    return !!tok && (
        tok.equals(ADVANCE) ||
        tok.equals(MULTIPLY) ||
        tok.equals(DIVIDE));
}

function parseArithmetic(global) {
    const tok = lexExpandedToken();
    const variable = parseVariable();

    if (!tok) {
        throw new Error("EOF found while parsing arithmetic");
    } else if (tok.equals(ADVANCE)) {
        if (variable instanceof IntegerVariable) {
            parseOptionalExplicitChars("by");
            parseOptionalSpaces();
            const value = parseNumberValue();
            variable.setValue(variable.getValue() + value, global);
        } else {
            throw new Error("unimplemented");
        }
    } else if (tok.equals(MULTIPLY)) {
        if (variable instanceof IntegerVariable) {
            parseOptionalExplicitChars("by");
            parseOptionalSpaces();
            const value = parseNumberValue();
            variable.setValue(variable.getValue() * value, global);
        } else {
            throw new Error("unimplemented");
        }
    } else if (tok.equals(DIVIDE)) {
        if (variable instanceof IntegerVariable) {
            parseOptionalExplicitChars("by");
            parseOptionalSpaces();
            const value = parseNumberValue();
            variable.setValue(
                Math.trunc(variable.getValue() / value), global);
        } else {
            throw new Error("unimplemented");
        }
    } else {
        throw new Error("unimplemented");
    }
}

const LET = new ControlSequence("let");
const FUTURELET = new ControlSequence("futurelet");

function isLetAssignmentHead(): boolean {
    const tok = peekExpandedToken();
    return !!tok && (
        tok.equals(LET) ||
        tok.equals(FUTURELET));
}

function parseLetAssignment(global) {
    const tok = lexExpandedToken();
    if (tok && tok.equals(LET)) {
        const set = parseControlSequenceUnexpanded();
        // Because we don't want to expand macros here, instead of using
        // `parseEquals()` and `parseOptionalSpace()` we parse ourselves.
        let tok = lexToken();
        while (tok && tok instanceof CharToken && tok.category === Space) {
            tok = lexToken();
        }
        if (!tok) {
            throw new Error(`EOF found while parsing \\let`);
        }
        if (tok.equals(new CharToken("=", Other))) {
            tok = lexToken();
            if (!tok) {
                throw new Error(`EOF found while parsing \\let`);
            }
        }
        if (tok && tok instanceof CharToken && tok.category === Space) {
            tok = lexToken();
            if (!tok) {
                throw new Error(`EOF found while parsing \\let`);
            }
        }
        const to = tok;

        if (to) {
            setLet(set, to, global);
        } else {
            throw new Error(`EOF found while parsing \\let`);
        }
    } else {
        throw new Error("unimplemented");
    }
}

const DEF = new ControlSequence("def");
const EDEF = new ControlSequence("edef");
const GDEF = new ControlSequence("gdef");
const XDEF = new ControlSequence("xdef");

function isNonMacroAssignmentHead(): boolean {
    return (
        isLetAssignmentHead() ||
        isArithmeticHead() ||
        isVariableAssignmentHead());
}

function parseNonMacroAssignment(global) {
    if (isVariableAssignmentHead()) {
        parseVariableAssignment(global);
    } else if (isLetAssignmentHead()) {
        parseLetAssignment(global);
    } else if (isArithmeticHead()) {
        parseArithmetic(global);
    } else {
        throw new Error("unimplemented");
    }
}

function isMacroAssignmentHead(): boolean {
    const tok = peekExpandedToken();
    return !!tok && (
        tok.equals(DEF) ||
        tok.equals(EDEF) ||
        tok.equals(GDEF) ||
        tok.equals(XDEF));
}

function parseControlSequenceUnexpanded() {
    const tok = lexToken();
    if (!tok) {
        throw new Error(`EOF found parsing control sequence`);
    } else if (tok instanceof ControlSequence) {
        return tok;
    } else if (tok instanceof CharToken && tok.category === Active) {
        return tok;
    } else {
        throw new Error(
            `Invalid token parsing control sequence: ` +
            `${tok.toString()}`);
    }
}

function parseMacroAssignment(global) {
    const tok = lexExpandedToken();
    if (!tok) {
        throw new Error("EOF found");
    } else if (tok.equals(DEF) || tok.equals(GDEF)) {
        const set = parseControlSequenceUnexpanded();
        const macro = parseDefinitionText();

        setMacro(set, macro, global || tok.equals(GDEF));
    } else {
        throw new Error("unimplemented");
    }
}

const GLOBAL = new ControlSequence("global");

export function isAssignmentHead(): boolean {
    const tok = peekExpandedToken();
    return !!tok && (
        tok.equals(GLOBAL) ||
        isNonMacroAssignmentHead() ||
        isMacroAssignmentHead());
}

function parseAssignmentGlobal() {
    if (isNonMacroAssignmentHead()) {
        parseNonMacroAssignment(true);
    } else if (isMacroAssignmentHead()) {
        parseMacroAssignment(true);
    } else {
        const tok = lexExpandedToken();
        if (tok && tok.equals(GLOBAL)) {
            if (!isAssignmentHead()) {
                throw new Error("non-macro-head found after \\global");
            } else {
                parseAssignmentGlobal();
            }
        } else {
            throw new Error("non-macro head found in global assignment");
        }
    }
}

export function parseAssignment() {
    if (isNonMacroAssignmentHead()) {
        parseNonMacroAssignment(false);
    } else if (isMacroAssignmentHead()) {
        parseMacroAssignment(false);
    } else {
        const tok = lexExpandedToken();
        if (tok && tok.equals(GLOBAL)) {
            if (!isAssignmentHead()) {
                throw new Error("non-macro-head found after \\global");
            } else {
                parseAssignmentGlobal();
            }
        } else {
            throw new Error("non-macro-head tok passed to parseAssignment");
        }
    }
}
