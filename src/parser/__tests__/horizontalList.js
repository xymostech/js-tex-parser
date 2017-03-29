// @flow
/* global expect */
import {setSource} from "../../lexer.js";
import {resetState} from "../../state.js";

import parseHorizontalList, {HBoxChar} from "../horizontalList.js";

function assertParsesTo(lines, expectedElems) {
    resetState();
    setSource(lines);

    const realElems = parseHorizontalList();
    expect(realElems).toEqual(expectedElems);
}

describe("horizontal list parser", () => {
    describe("parsing basic tokens", () => {
        it("parses letters correctly", () => {
            assertParsesTo(["ab%"], [
                new HBoxChar("a"),
                new HBoxChar("b"),
            ]);
        });
    });
});
