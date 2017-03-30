// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState} from "../../state.js";
import {Macro, Parameter} from "../../Macro.js";
import {CharToken, ControlSequence} from "../../Token.js";
import {Letter, BeginGroup, EndGroup} from "../../Category.js";

import {parseDefinitionText} from "../macros.js";

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

describe("macro parsing", () => {
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
