// @flow
import {setCount, getCount, setCategory, getCategory, setChardef} from "./state.js";
import {categoryToNumber, numberToCategory} from "./Category.js";
import {Token} from "./Token.js";

const INTEGER_VARIABLE = Symbol("integer variable");

type VariableType = typeof INTEGER_VARIABLE;

export class Variable {
    _type: VariableType;

    constructor(type: VariableType) {
        this._type = type;
    }
}

export class IntegerVariable extends Variable {
    constructor() {
        super(INTEGER_VARIABLE);
    }

    setValue(value: number, global: boolean) {
        throw new Error("unimplemented");
    }

    getValue(): number {
        throw new Error("unimplemented");
    }
}

export class CountVariable extends IntegerVariable {
    index: number;

    constructor(index: number) {
        super();
        this.index = index;
    }

    setValue(value: number, global: boolean) {
        setCount(this.index, value, global);
    }

    getValue(): number {
        return getCount(this.index);
    }
}

export class CatCodeVariable extends IntegerVariable {
    character: string;

    constructor(character: string) {
        super();
        this.character = character;
    }

    setValue(value: number, global: boolean) {
        setCategory(this.character, numberToCategory(value), global);
    }

    getValue(): number {
        return categoryToNumber(getCategory(this.character));
    }
}

export class CharDefVariable extends IntegerVariable {
    token: Token;

    constructor(token: Token) {
        super();
        this.token = token;
    }

    setValue(value: number, global: boolean) {
        setChardef(this.token, String.fromCharCode(value), global);
    }

    getValue(): number {
        throw new Error("You can only set chardef variables.");
    }
}
