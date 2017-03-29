// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState, getCount} from "../../state.js";

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
        });
    });
});
