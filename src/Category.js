// @flow
export const Escape       = Symbol("escape");        // 0
export const BeginGroup   = Symbol("begin group");   // 1
export const EndGroup     = Symbol("end group");     // 2
export const MathShift    = Symbol("math shift");    // 3
export const AlignmentTab = Symbol("alignment tab"); // 4
export const EndOfLine    = Symbol("end of line");   // 5
export const Parameter    = Symbol("parameter");     // 6
export const Superscript  = Symbol("superscript");   // 7
export const Subscript    = Symbol("subscript");     // 8
export const Ignored      = Symbol("ignored");       // 9
export const Space        = Symbol("space");         // 10
export const Letter       = Symbol("letter");        // 11
export const Other        = Symbol("other");         // 12
export const Active       = Symbol("active");        // 13
export const Comment      = Symbol("comment");       // 14
export const Invalid      = Symbol("invalid");       // 15

export type Category = (
    typeof Escape |
    typeof BeginGroup |
    typeof EndGroup |
    typeof MathShift |
    typeof AlignmentTab |
    typeof EndOfLine |
    typeof Parameter |
    typeof Superscript |
    typeof Subscript |
    typeof Ignored |
    typeof Space |
    typeof Letter |
    typeof Other |
    typeof Active |
    typeof Comment |
    typeof Invalid);

const ALL_CATEGORIES = [
    Escape,
    BeginGroup,
    EndGroup,
    MathShift,
    AlignmentTab,
    EndOfLine,
    Parameter,
    Superscript,
    Subscript,
    Ignored,
    Space,
    Letter,
    Other,
    Active,
    Comment,
    Invalid,
];

export function categoryToNumber(cat: Category): number {
    const index = ALL_CATEGORIES.indexOf(cat);
    if (index === -1) {
        throw new Error(`Invalid category in lookup: ${cat}`);
    }
    return index;
}

export function numberToCategory(num: number): Category {
    if (num < 0 || num >= ALL_CATEGORIES.length) {
        throw new Error(`Invalid category number: ${num}`);
    }
    return ALL_CATEGORIES[num];
}
