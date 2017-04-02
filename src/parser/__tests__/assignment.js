// @flow
/* global expect */
import {setSource} from "../../lexer.js";
import {
    resetState, getCount, getMacro, getLet, pushGroup, popGroup,
} from "../../state.js";
import {CharToken, ControlSequence} from "../../Token.js";
import {Macro, Parameter} from "../../Macro.js";
import {Letter, Space} from "../../Category.js";
import {lexExpandedToken} from "../../expand.js";

import {parseAssignment} from "../assignment.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

function expectParse(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
    expect(lexExpandedToken()).toEqual(null);
}

function doAssignment() {
    const tok = lexExpandedToken();
    if (!tok) {
        throw new Error("EOF");
    }
    parseAssignment(tok);
}

describe("assignments", () => {
    describe("variable assignment", () => {
        it("sets integer variables", () => {
            expectParse(["\\count0=1%"], () => {
                doAssignment();
                expect(getCount(0)).toEqual(1);
            });

            expectParse(["\\count255=1%"], () => {
                doAssignment();
                expect(getCount(255)).toEqual(1);
            });

            expectParse(["\\count0 1%"], () => {
                doAssignment();
                expect(getCount(0)).toEqual(1);
            });

            expectParse(["\\count0 1 %"], () => {
                doAssignment();
                expect(getCount(0)).toEqual(1);
            });
        });
    });

    describe("arithmetic", () => {
        it("adds values", () => {
            expectParse(["\\count0=1 \\advance\\count0 by  2%"], () => {
                doAssignment();
                doAssignment();
                expect(getCount(0)).toEqual(3);
            });
        });

        it("multiplies values", () => {
            expectParse(["\\count0=2 \\multiply\\count0 by4%"], () => {
                doAssignment();
                doAssignment();
                expect(getCount(0)).toEqual(8);
            });
        });

        it("divides values", () => {
            expectParse(["\\count0=-20 \\divide\\count0 by6%"], () => {
                doAssignment();
                doAssignment();
                expect(getCount(0)).toEqual(-3);
            });
        });
    });

    describe("macro assignment", () => {
        it("sets \\def macros", () => {
            expectParse(["\\def\\greet#1{hi #1}%"], () => {
                doAssignment();
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
                doAssignment();
                doAssignment();
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
                doAssignment();
                expect(getLet(new ControlSequence("x")))
                    .toEqual(new CharToken("x", Letter));
            });
        });

        it("\\lets values have other macro values", () => {
            expectParse(["\\def\\x{a}\\let\\y=\\x%"], () => {
                doAssignment();
                doAssignment();
                const macro = new Macro(
                    [],
                    [new CharToken("a", Letter)]);

                expect(getMacro(new ControlSequence("x"))).toEqual(macro);
                expect(getMacro(new ControlSequence("y"))).toEqual(macro);
            });
        });
    });

    describe("global assignment", () => {
        function handleGroup() {
            const tok = lexExpandedToken();
            if (tok instanceof CharToken && tok.ch === "{") {
                pushGroup();
            } else if (tok instanceof CharToken && tok.ch === "}") {
                popGroup();
            }
        }

        it("globally sets counts", () => {
            expectParse([
                "\\count0=1{%",
                "\\count0=2{%",
                "\\global\\count0=3%",
                "}}%",
            ], () => {
                doAssignment();
                handleGroup();
                doAssignment();
                handleGroup();
                doAssignment();
                expect(getCount(0)).toEqual(3);
                handleGroup();
                expect(getCount(0)).toEqual(3);
                handleGroup();
                expect(getCount(0)).toEqual(3);
            });
        });

        it("globally sets macros", () => {
            expectParse([
                "\\def\\a{x}{%",
                "\\def\\a{y}{%",
                "\\global\\def\\a{z}%",
                "}}%",
            ], () => {
                const macro = new Macro([], [new CharToken("z", Letter)]);

                doAssignment();
                handleGroup();
                doAssignment();
                handleGroup();
                doAssignment();
                expect(getMacro(new ControlSequence("a"))).toEqual(macro);
                handleGroup();
                expect(getMacro(new ControlSequence("a"))).toEqual(macro);
                handleGroup();
                expect(getMacro(new ControlSequence("a"))).toEqual(macro);
            });
        });

        it("lets macros to their local value in a group", () => {
            expectParse([
                "\\def\\a{x}{%",
                "\\def\\a{y}{%",
                "\\global\\let\\b\\a%",
                "}}%",
            ], () => {
                const xMacro = new Macro([], [new CharToken("x", Letter)]);
                const yMacro = new Macro([], [new CharToken("y", Letter)]);

                doAssignment();
                handleGroup();
                doAssignment();
                handleGroup();
                doAssignment();
                expect(getMacro(new ControlSequence("a"))).toEqual(yMacro);
                handleGroup();
                expect(getMacro(new ControlSequence("a"))).toEqual(yMacro);
                handleGroup();
                expect(getMacro(new ControlSequence("a"))).toEqual(xMacro);
            });
        });
    });
});
