// @flow
import {setCount, globalSetCount, getCount} from "./state.js";

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
        if (global) {
            globalSetCount(this.index, value);
        } else {
            setCount(this.index, value);
        }
    }

    getValue(): number {
        return getCount(this.index);
    }
}
