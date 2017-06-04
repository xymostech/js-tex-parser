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
class MacroDef {
    macro: Macro;
    constructor(macro: Macro) {
        this.macro = macro;
    }
}

class LetDef {
    tok: Token;
    constructor(tok: Token) {
        this.tok = tok;
    }
}

class ChardefDef {
    char: string;
    constructor(char: string) {
        this.char = char;
    }
}

type TokDef = MacroDef | LetDef | ChardefDef;
let tokdefs: TokenMap<TokDef> = new TokenMap();

export function setTokDef(token: Token, val: TokDef, global: boolean) {
    tokdefs.set(token, val);
    if (global) {
        groupLevels.forEach(level => {
            level.tokdefs.set(token, val);
        });
    }
}

export function getMacro(token: Token): ?Macro {
    const tokdef = tokdefs.get(token);
    if (tokdef && tokdef instanceof MacroDef) {
        return tokdef.macro;
    }
}

export function setMacro(token: Token, macro: Macro, global: boolean) {
    setTokDef(token, new MacroDef(macro), global);
}

export function getLet(token: Token): ?Token {
    const tokdef = tokdefs.get(token);
    if (tokdef && tokdef instanceof LetDef) {
        return tokdef.tok;
    }
}

export function setLet(token: Token, replace: Token, global: boolean) {
    const tokdef = tokdefs.get(replace);
    if (tokdef) {
        tokdefs.set(token, tokdef);
    } else {
        tokdefs.set(token, new LetDef(replace));
    }
    if (global) {
        groupLevels.forEach(level => {
            const tokdef = level.tokdefs.get(replace);
            if (tokdef) {
                level.tokdefs.set(token, tokdef);
            } else {
                level.tokdefs.set(token, new LetDef(replace));
            }
        });
    }
}

export function getChardef(token: Token): ?string {
    const tokdef = tokdefs.get(token);
    if (tokdef && tokdef instanceof ChardefDef) {
        return tokdef.char;
    }
}

export function setChardef(token: Token, replace: string, global: boolean) {
    setTokDef(token, new ChardefDef(replace), global);
}

type AllState = {
    categoryMap: Map<string, Category>,
    countRegisters: Map<number, number>,
    tokdefs: TokenMap<TokDef>,
};

let groupLevels: AllState[] = [];
export function pushGroup() {
    groupLevels.push({
        categoryMap: new Map(categoryMap),
        countRegisters: new Map(countRegisters),
        tokdefs: new TokenMap(tokdefs),
    });
}

export function popGroup() {
    const state = groupLevels.pop();
    categoryMap = state.categoryMap;
    countRegisters = state.countRegisters;
    tokdefs = state.tokdefs;
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
    tokdefs = new TokenMap();

    groupLevels = [];
}
resetState();
