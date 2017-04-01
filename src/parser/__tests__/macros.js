// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState} from "../../state.js";
import {Macro, Parameter} from "../../Macro.js";
import {CharToken, ControlSequence} from "../../Token.js";
import {
    Letter, BeginGroup, EndGroup, MathShift, Space, Parameter as ParameterCat,
} from "../../Category.js";

import {parseDefinitionText, parseReplacementText} from "../macros.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

function expectParse(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
    expect(lexToken()).toEqual(null);
}

function expectParseFail(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
}

const TeXbookExampleMacro = new Macro(
    [
        new CharToken("A", Letter),
        new CharToken("B", Letter),
        new Parameter(1),
        new Parameter(2),
        new CharToken("C", Letter),
        new CharToken("$", MathShift),
        new Parameter(3),
        new ControlSequence("$"),
        // TODO(emily): The TeXbook says that there's a space here,
        // but it comes right after a control sequence! What gives??
        // new CharToken(" ", Space),
    ],
    [
        new Parameter(3),
        new CharToken("{", BeginGroup),
        new CharToken("a", Letter),
        new CharToken("b", Letter),
        new Parameter(1),
        new CharToken("}", EndGroup),
        new Parameter(1),
        new CharToken(" ", Space),
        new CharToken("c", Letter),
        new CharToken("#", ParameterCat),
        new ControlSequence("x"),
        new Parameter(2),
    ]);


describe("macro body parsing", () => {
    it("parses empty bodies", () => {
        expectParse(["{}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro([], []));
        });
    });

    it("parses tokens in the parameter text", () => {
        expectParse(["a\\hello{}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [new CharToken("a", Letter), new ControlSequence("hello")],
                []));
        });
    });

    it("parses tokens in the replacement text", () => {
        expectParse(["{a\\hello}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [],
                [new CharToken("a", Letter), new ControlSequence("hello")]));
        });
    });

    it("parses parameters in the parameter text", () => {
        expectParse(["#1a#2{}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [
                    new Parameter(1), new CharToken("a", Letter),
                    new Parameter(2),
                ],
                []));
        });
    });

    it("parses parameters in the replacement text", () => {
        expectParse(["#1#2{#1a#2}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [new Parameter(1), new Parameter(2)],
                [
                    new Parameter(1), new CharToken("a", Letter),
                    new Parameter(2),
                ]));
        });
    });

    it("parses balanced replacement text", () => {
        expectParse(["{{}}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [],
                [
                    new CharToken("{", BeginGroup),
                    new CharToken("}", EndGroup),
                ]));
        });

        expectParse(["{a{b}c}d}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [],
                [
                    new CharToken("a", Letter),
                    new CharToken("{", BeginGroup),
                    new CharToken("b", Letter),
                    new CharToken("}", EndGroup),
                    new CharToken("c", Letter),
                ]));
            expect(lexToken()).toEqual(new CharToken("d", Letter));
            expect(lexToken()).toEqual(new CharToken("}", EndGroup));
        });
    });

    it("follows the example in the TeXbook", () => {
        expectParse(["AB#1#2C$#3\\$ {#3{ab#1}#1 c##\\x #2}%"], () => {
            expect(parseDefinitionText()).toEqual(TeXbookExampleMacro);
        });
    });

    it("handles # at the end of parameter text", () => {
        expectParse(["#1#{a}%"], () => {
            expect(parseDefinitionText()).toEqual(new Macro(
                [new Parameter(1), new CharToken("{", BeginGroup)],
                [new CharToken("a", Letter), new CharToken("{", BeginGroup)]));
        });
    });

    it("fails if parameters aren't in the right order", () => {
        expectParseFail(["#2#1{}%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "Out of order parameter in macro parameter text: #2");
        });
    });

    it("fails if parameters in the body are missing in the param text", () => {
        expectParseFail(["#1{#2}%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "Parameter in replacement text outside of range of " +
                "parameters: #2");
        });
    });

    it("fails if it encounters an EOF anywhere", () => {
        expectParseFail(["a%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "EOF found while parsing macro");
        });
        expectParseFail(["a{b%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "EOF found while parsing macro");
        });
        expectParseFail(["a{{b}%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "EOF found while parsing macro");
        });
        expectParseFail(["a#%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "EOF found while parsing macro");
        });
    });

    it("fails if there is a non-1-to-9-number after a #", () => {
        expectParseFail(["#a{}%"], () => {
            expect(() => parseDefinitionText()).toThrow(
                "Invalid token after parameter token: " +
                "Character 'a' of category Symbol(letter)");
        });
    });
});

describe("macro application parsing", () => {
    const undelimitedParams = new Macro(
        [new Parameter(1), new Parameter(2)],
        []);

    it("parses single-token undelimited parameters", () => {
        expectParse(["ab%"], () => {
            expect(parseReplacementText(undelimitedParams)).toEqual(new Map([
                [1, [new CharToken("a", Letter)]],
                [2, [new CharToken("b", Letter)]],
            ]));
        });
    });

    it("parses balanced-text undelimited parameters", () => {
        expectParse(["{a}{b{c}}%"], () => {
            expect(parseReplacementText(undelimitedParams)).toEqual(new Map([
                [1, [new CharToken("a", Letter)]],
                [2, [
                    new CharToken("b", Letter),
                    new CharToken("{", BeginGroup),
                    new CharToken("c", Letter),
                    new CharToken("}", EndGroup),
                ]],
            ]));
        });
    });

    const delimitedParam = new Macro(
        [new Parameter(1), new CharToken("a", Letter)],
        []);

    it("parses single-token delimited parameter", () => {
        expectParse(["cda%"], () => {
            expect(parseReplacementText(delimitedParam)).toEqual(new Map([
                [1, [
                    new CharToken("c", Letter),
                    new CharToken("d", Letter),
                ]],
            ]));
        });
    });

    it("parses balanced-text delimited parameter", () => {
        expectParse(["{a}{b}a%"], () => {
            expect(parseReplacementText(delimitedParam)).toEqual(new Map([
                [1, [
                    new CharToken("{", BeginGroup),
                    new CharToken("a", Letter),
                    new CharToken("}", EndGroup),
                    new CharToken("{", BeginGroup),
                    new CharToken("b", Letter),
                    new CharToken("}", EndGroup),
                ]],
            ]));
        });
    });

    it("removes braces from a single-balanced-text delimited parameter", () => {
        expectParse(["{a}a%"], () => {
            expect(parseReplacementText(delimitedParam)).toEqual(new Map([
                [1, [
                    new CharToken("a", Letter),
                ]],
            ]));
        });
    });

    const multiCharDelimitedParam = new Macro(
        [
            new Parameter(1),
            new CharToken("a", Letter),
            new ControlSequence("boo"),
        ],
        []);

    it("parses multi-char-delimited parameters", () => {
        expectParse(["aba\\boo%"], () => {
            expect(parseReplacementText(multiCharDelimitedParam)).toEqual(
                new Map([
                    [1, [
                        new CharToken("a", Letter),
                        new CharToken("b", Letter),
                    ]],
                ]));
        });
    });

    it("parses the TeXbook example", () => {
        expectParse(["AB {\\Look}C${And\\$ }{look}\\$ %"], () => {
            expect(parseReplacementText(TeXbookExampleMacro)).toEqual(new Map([
                [1, [new ControlSequence("Look")]],
                [2, []],
                [3, [
                    new CharToken("{", BeginGroup),
                    new CharToken("A", Letter),
                    new CharToken("n", Letter),
                    new CharToken("d", Letter),
                    new ControlSequence("$"),
                    new CharToken("}", EndGroup),
                    new CharToken("{", BeginGroup),
                    new CharToken("l", Letter),
                    new CharToken("o", Letter),
                    new CharToken("o", Letter),
                    new CharToken("k", Letter),
                    new CharToken("}", EndGroup),
                ]]]));
        });
    });
});
