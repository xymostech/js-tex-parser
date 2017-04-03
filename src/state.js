// @flow
import type {Category} from "./Category.js";
import {
    Letter, Other, Escape, Ignored, Comment, EndOfLine, Space, Invalid,
    Superscript, BeginGroup, EndGroup, Parameter, MathShift,
} from "./Category.js";
import {Macro} from "./Macro.js";
import {Token} from "./Token.js";
import TokenMap from "./TokenMap.js";

// Categories
let categoryMap: Map<string, Category> = new Map();

export function getCategory(c: string): Category {
    const category: ?Category = categoryMap.get(c);
    return category == null ? Other : category;
}

// Registers
let countRegisters: Map<number, number> = new Map();

export function setCount(register: number, value: number, global: boolean) {
    if (register < 0 || register > 255) {
        throw new Error(`Trying to set invalid count register: ${register}`);
    }
    if (!Number.isInteger(value) || value < -2147483647 || value > 2147483647) {
        throw new Error(`Invalid count register value: ${value}`);
    }
    countRegisters.set(register, value);
    if (global) {
        groupLevels.forEach(level => {
            level.countRegisters.set(register, value);
        });
    }
}

export function getCount(register: number): number {
    if (register < 0 || register > 255) {
        throw new Error(`Trying to get invalid count register: ${register}`);
    }
    const value: ?number = countRegisters.get(register);
    return value == null ? 0 : value;
}

// Macros
let macros: TokenMap<Macro> = new TokenMap();

export function getMacro(token: Token): ?Macro {
    return macros.get(token);
}

export function setMacro(token: Token, macro: Macro, global: boolean) {
    macros.set(token, macro);
    if (global) {
        groupLevels.forEach(level => {
            level.macros.set(token, macro);
        });
    }
}

// Let values
let lets: TokenMap<Token> = new TokenMap();

export function getLet(token: Token): ?Token {
    return lets.get(token);
}

export function setLet(token: Token, replace: Token, global: boolean) {
    const macro = getMacro(replace);
    if (macro) {
        // If `replace` referred to a macro, set `token` to refer to that macro
        // as well.
        setMacro(token, macro, false);
    } else {
        // Otherwise, store the plain token -> token mapping.
        lets.set(token, replace);
    }
    if (global) {
        groupLevels.forEach(level => {
            const macro = level.macros.get(replace);
            if (macro) {
                level.macros.set(token, macro);
            } else {
                level.lets.set(token, replace);
            }
        });
    }
}

type AllState = {
    categoryMap: Map<string, Category>,
    countRegisters: Map<number, number>,
    macros: TokenMap<Macro>,
    lets: TokenMap<Token>,
};

let groupLevels: AllState[] = [];
export function pushGroup() {
    groupLevels.push({
        categoryMap: new Map(categoryMap),
        countRegisters: new Map(countRegisters),
        macros: new TokenMap(macros),
        lets: new TokenMap(lets),
    });
}

export function popGroup() {
    const state = groupLevels.pop();
    categoryMap = state.categoryMap;
    countRegisters = state.countRegisters;
    macros = state.macros;
    lets = state.lets;
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
    categoryMap.set("\u0000", Ignored);
    categoryMap.set("\n", EndOfLine);
    categoryMap.set("\\", Escape);
    categoryMap.set("%", Comment);
    categoryMap.set(" ", Space);
    categoryMap.set("\u00ff", Invalid);

    // TODO(emily): Remove me, these aren't set by default!
    categoryMap.set("^", Superscript);
    categoryMap.set("{", BeginGroup);
    categoryMap.set("}", EndGroup);
    categoryMap.set("#", Parameter);
    categoryMap.set("$", MathShift);

    countRegisters = new Map();
    macros = new TokenMap();
    lets = new TokenMap();

    groupLevels = [];
}
resetState();
