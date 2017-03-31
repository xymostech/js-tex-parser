import {setCount, getCount} from "./state.js";

const INTEGER_VARIABLE = Symbol("integer variable");

type VariableType = typeof INTEGER_VARIABLE;

export class Variable {
    _type: VariableType;

    constructor(type: VariableType) {
        this._type = type;
    }

    getValueType(): "integer" | "dimen" | "glue" | "muglue" | "token" {
        if (this._type === INTEGER_VARIABLE) {
            return "integer";
        } else {
            throw new Error("unimplemented");
        }
    }
}

class IntegerVariable extends Variable {
    constructor() {
        super(INTEGER_VARIABLE);
    }
}

export class CountVariable extends IntegerVariable {
    index: number;

    constructor(index: number) {
        super();
        this.index = index;
    }

    setValue(value: number) {
        setCount(this.index, value);
    }

    getValue(): number {
        return getCount(this.index);
    }
}
