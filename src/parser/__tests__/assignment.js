// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState, getCount, getMacro, getLet} from "../../state.js";
import {CharToken, ControlSequence} from "../../Token.js";
import {Macro, Parameter} from "../../Macro.js";
import {Letter, Space} from "../../Category.js";

import {parseAssignment} from "../assignment.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

function expectParse(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
    expect(lexToken()).toEqual(null);
}

describe("assignments", () => {
    describe("variable assignment", () => {
        it("sets integer variables", () => {
            expectParse(["\\count0=1%"], () => {
                parseAssignment();
                expect(getCount(0)).toEqual(1);
            });

            expectParse(["\\count255=1%"], () => {
                parseAssignment();
                expect(getCount(255)).toEqual(1);
            });

            expectParse(["\\count0 1%"], () => {
                parseAssignment();
                expect(getCount(0)).toEqual(1);
            });

            expectParse(["\\count0 1 %"], () => {
                parseAssignment();
                expect(getCount(0)).toEqual(1);
            });
        });
    });

    describe("arithmetic", () => {
        it("adds values", () => {
            expectParse(["\\count0=1 \\advance\\count0 by2%"], () => {
                parseAssignment();
                parseAssignment();
                expect(getCount(0)).toEqual(3);
            });
        });

        it("multiplies values", () => {
            expectParse(["\\count0=2 \\multiply\\count0 by4%"], () => {
                parseAssignment();
                parseAssignment();
                expect(getCount(0)).toEqual(8);
            });
        });

        it("divides values", () => {
            expectParse(["\\count0=-20 \\divide\\count0 by6%"], () => {
                parseAssignment();
                parseAssignment();
                expect(getCount(0)).toEqual(-3);
            });
        });
    });

    describe("macro assignment", () => {
        it("sets \\def macros", () => {
            expectParse(["\\def\\greet#1{hi #1}%"], () => {
                parseAssignment();
                expect(getMacro(new ControlSequence("greet")))
                    .toEqual(new Macro(
                        [new Parameter(1)],
                        [
                            new CharToken("h", Letter),
                            new CharToken("i", Letter),
                            new CharToken(" ", Space),
                            new Parameter(1),
                        ]));
            });
        });

        it("allows you to redefine macros", () => {
            expectParse(["\\def\\a{a}\\def\\a{b}%"], () => {
                parseAssignment();
                parseAssignment();
                expect(getMacro(new ControlSequence("a")))
                    .toEqual(new Macro(
                        [],
                        [
                            new CharToken("b", Letter),
                        ]));
            });
        });
    });

    describe("let assignment", () => {
        it("sets \\let values", () => {
            expectParse(["\\let\\x = x%"], () => {
                parseAssignment();
                expect(getLet(new ControlSequence("x")))
                    .toEqual(new CharToken("x", Letter));
            });
        });

        it("\\lets values have other macro values", () => {
            expectParse(["\\def\\x{a}\\let\\y=\\x%"], () => {
                parseAssignment();
                parseAssignment();
                const macro = new Macro(
                    [],
                    [new CharToken("a", Letter)]);

                expect(getMacro(new ControlSequence("x"))).toEqual(macro);
                expect(getMacro(new ControlSequence("y"))).toEqual(macro);
            });
        });
    });
});
