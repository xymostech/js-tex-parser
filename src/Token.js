export default class Token {
    constructor(kind, value, category) {
        this.kind = kind;
        this.value = value;

        if (kind === Token.CHAR_TOKEN && !category) {
            throw new Error("Char tokens must have a category");
        } else if (kind === Token.CONTROL_SEQUENCE && category) {
            throw new Error("Control sequences must not have a category");
        }
        this.category = category;
    }

    static CONTROL_SEQUENCE = Symbol("control sequence");
    static CHAR_TOKEN = Symbol("char token");
}
