// @flow
import {Token, CharToken, ControlSequence} from "./Token.js";

import type {Category} from "./Category.js";

export default class TokenMap<T> {
    charTokenMap: Map<Category, Map<string, T>>;
    controlSequenceMap: Map<string, T>;

    constructor() {
        this.controlSequenceMap = new Map();
        this.charTokenMap = new Map();
    }

    get(tok: Token): ?T {
        if (tok instanceof CharToken) {
            const chMap = this.charTokenMap.get(tok.category);
            return chMap == null
                ? null
                : chMap.get(tok.ch);
        } else if (tok instanceof ControlSequence) {
            return this.controlSequenceMap.get(tok.value);
        }
    }

    set(tok: Token, val: T) {
        if (tok instanceof CharToken) {
            let chMap = this.charTokenMap.get(tok.category);
            if (!chMap) {
                chMap = new Map();
                this.charTokenMap.set(tok.category, chMap);
            }

            chMap.set(tok.ch, val);
        } else if (tok instanceof ControlSequence) {
            this.controlSequenceMap.set(tok.value, val);
        }
    }
}
