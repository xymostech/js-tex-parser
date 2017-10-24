// @flow
/* global expect */
import {setSource} from "../../lexer.js";
import {
    resetState, getCount, getMacro, getLet, pushGroup, popGroup, getChardef,
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

        it("sets catcodes", () => {
            expectParse([
                "\\catcode`@=11%",
                "\\z@%",
            ], () => {
                parseAssignment();
                expect(lexExpandedToken()).toEqual(new ControlSequence("z@"));
            });
        });

        it("sets chardef variables", () => {
            expectParse(["\\chardef\\a=97%"], () => {
                parseAssignment();
                expect(getChardef(new ControlSequence("a"))).toEqual('a');
            });
        });

        it("allows setting integer variables from chardefs", () => {
            expectParse([
                "\\chardef\\a=5%",
                "\\count0=\\a%",
            ], () => {
                parseAssignment();
                parseAssignment();
                expect(getCount(0)).toEqual(5);
            });
        });
    });

    describe("arithmetic", () => {
        it("adds values", () => {
            expectParse(["\\count0=1 \\advance\\count0 by  2%"], () => {
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
                parseAssignment();
                handleGroup();
                parseAssignment();
                handleGroup();
                parseAssignment();
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

                parseAssignment();
                handleGroup();
                parseAssignment();
                handleGroup();
                parseAssignment();
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

                parseAssignment();
                handleGroup();
                parseAssignment();
                handleGroup();
                parseAssignment();
                expect(getMacro(new ControlSequence("a"))).toEqual(yMacro);
                handleGroup();
                expect(getMacro(new ControlSequence("a"))).toEqual(yMacro);
                handleGroup();
                expect(getMacro(new ControlSequence("a"))).toEqual(xMacro);
            });
        });
    });
});
