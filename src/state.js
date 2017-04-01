// @flow
import type {Category} from "./Category.js";
import {
    Letter, Other, Escape, Ignored, Comment, EndOfLine, Space, Invalid,
    Superscript, BeginGroup, EndGroup, Parameter, MathShift,
} from "./Category.js";
import {Macro} from "./Macro.js";
import {Token} from "./Token.js";

// Categories
let categoryMap: Map<string, Category> = new Map();

export function getCategory(c: string): Category {
    const category: ?Category = categoryMap.get(c);
    return category == null ? Other : category;
}

// Registers
let countRegisters: Map<number, number> = new Map();

export function setCount(register: number, value: number) {
    if (register < 0 || register > 255) {
        throw new Error(`Trying to set invalid count register: ${register}`);
    }
    if (!Number.isInteger(value) || value < -2147483647 || value > 2147483647) {
        throw new Error(`Invalid count register value: ${value}`);
    }
    countRegisters.set(register, value);
}

export function getCount(register: number): number {
    if (register < 0 || register > 255) {
        throw new Error(`Trying to get invalid count register: ${register}`);
    }
    const value: ?number = countRegisters.get(register);
    return value == null ? 0 : value;
}

// Macros
let macros: Map<Token, Macro> = new Map();

export function getMacro(token: Token): ?Macro {
    // NOTE(xymostech): we can't just call `macros.get(token)` because we need
    // to manually check equality of the tokens.
    for (const [tok, macro] of macros) {
        if (tok.equals(token)) {
            return macro;
        }
    }
    return null;
}

export function setMacro(token: Token, macro: Macro) {
    macros.set(token, macro);
}

// Let values
let lets: Map<Token, Token> = new Map();

export function getLet(token: Token): ?Token {
    // NOTE(xymostech): we can't just call `lets.get(token)` because we need
    // to manually check equality of the tokens.
    for (const [tok, replace] of lets) {
        if (tok.equals(token)) {
            return replace;
        }
    }
    return null;
}

export function setLet(token: Token, replace: Token) {
    const macro = getMacro(replace);
    if (macro) {
        // If `replace` referred to a macro, set `token` to refer to that macro
        // as well.
        setMacro(token, macro);
    } else {
        // Otherwise, store the plain token -> token mapping.
        lets.set(token, replace);
    }
}

// State reset
export function resetState() {
    categoryMap = new Map();
    for (let i = 0; i < 256; i++) {
        const ch = String.fromCharCode(i);
        if (("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z")) {
            categoryMap.set(ch, Letter);
        } else {
            categoryMap.set(ch, Other);
        }
    }
    categoryMap.set("\\", Escape);
    categoryMap.set("\u0000", Ignored);
    categoryMap.set("%", Comment);
    categoryMap.set("\n", EndOfLine);
    categoryMap.set(" ", Space);
    categoryMap.set("\u00ff", Invalid);

    // TODO(emily): Remove me, these aren't set by default!
    categoryMap.set("^", Superscript);
    categoryMap.set("{", BeginGroup);
    categoryMap.set("}", EndGroup);
    categoryMap.set("#", Parameter);
    categoryMap.set("$", MathShift);

    countRegisters = new Map();
    macros = new Map();
    lets = new Map();
}
resetState();
