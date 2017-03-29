// @flow

import type {Category} from "./Category.js";

export class Token {
    static CONTROL_SEQUENCE = Symbol("control sequence");
    static CHAR_TOKEN = Symbol("char token");

    kind: typeof Token.CONTROL_SEQUENCE | typeof Token.CHAR_TOKEN;

    constructor(kind: typeof Token.CONTROL_SEQUENCE | typeof Token.CHAR_TOKEN) {
        this.kind = kind;
    }

    equals(other: any) {
        throw new Error("unimplemented");
    }

    isCharToken() {
        throw new Error("unimplemented");
    }

    isControlSequence() {
        throw new Error("unimplemented");
    }
}

export class ControlSequence extends Token {
    value: string;

    constructor(value: string) {
        super(Token.CONTROL_SEQUENCE);
        this.value = value;
    }

    equals(other: Token) {
        return (other instanceof ControlSequence &&
                this.value === other.value);
    }

    isCharToken() {
        return false;
    }

    isControlSequence() {
        return true;
    }
}

export class CharToken extends Token {
    ch: string;
    category: Category;

    constructor(ch: string, category: Category) {
        super(Token.CHAR_TOKEN);
        this.ch = ch;
        this.category = category;
    }

    equals(other: Token) {
        return (other instanceof CharToken &&
                this.ch === other.ch &&
                this.category === other.category);
    }

    isCharToken() {
        return true;
    }

    isControlSequence() {
        return false;
    }
}
