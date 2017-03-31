// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState, getCount, getMacro} from "../../state.js";
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
    });
});
