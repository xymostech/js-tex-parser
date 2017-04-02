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

    describe("grouping", () => {
        it("parses letters in groups", () => {
            assertParsesTo(["a{b}c%"], [
                new HBoxChar("a"),
                new HBoxChar("b"),
                new HBoxChar("c"),
            ]);
        });

        it("leaves state in groups local", () => {
            assertParsesTo([
                "\\count0=1 \\ifnum\\count0=1 x\\fi%",
                "{\\count0=2 \\ifnum\\count0=2 y\\fi}%",
                "\\ifnum\\count0=1 z\\fi%",
            ], [
                new HBoxChar("x"),
                new HBoxChar("y"),
                new HBoxChar("z"),
            ]);
        });
    });
});
