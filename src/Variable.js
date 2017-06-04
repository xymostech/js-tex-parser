// @flow
import {setCount, getCount, setChardef} from "./state.js";
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
