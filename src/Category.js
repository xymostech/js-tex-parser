// @flow
export const Escape = Symbol("escape");
export const BeginGroup = Symbol("begin group");
export const EndGroup = Symbol("end group");
export const MathShift = Symbol("math shift");
export const AlignmentTab = Symbol("alignment tab");
export const EndOfLine = Symbol("end of line");
export const Parameter = Symbol("parameter");
export const Superscript = Symbol("superscript");
export const Subscript = Symbol("subscript");
export const Ignored = Symbol("ignored");
export const Space = Symbol("space");
export const Letter = Symbol("letter");
export const Other = Symbol("other");
export const Active = Symbol("active");
export const Comment = Symbol("comment");
export const Invalid = Symbol("invalid");

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
