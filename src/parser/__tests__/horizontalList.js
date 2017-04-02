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
    it("parses letters correctly", () => {
        assertParsesTo(["ab%"], [
            new HBoxChar("a"),
            new HBoxChar("b"),
        ]);
    });

    it("parses assignments", () => {
        assertParsesTo(["\\count0=1 a%"], [
            new HBoxChar("a"),
        ]);
    });

    it("parses expansions", () => {
        assertParsesTo(["\\def\\a#1{x#1x}y\\a zy%"], [
            new HBoxChar("y"),
            new HBoxChar("x"),
            new HBoxChar("z"),
            new HBoxChar("x"),
            new HBoxChar("y"),
        ]);

        assertParsesTo(["\\ifnum 1<2 x\\else y\\fi%"], [
            new HBoxChar("x"),
        ]);
    });
});
