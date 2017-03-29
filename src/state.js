// @flow
import type {Category} from "./Category.js";
import {Letter, Other, Escape, Ignored, Comment, EndOfLine, Space, Invalid, Superscript} from "./Category.js";

const categoryMap: Map<string, Category> = new Map();

export function resetState() {
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
}

resetState();

export function getCategory(c: string): Category {
    const category: ?Category = categoryMap.get(c);
    return category == null ? Other : category;
}

const countRegisters: Map<number, number> = new Map();

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
