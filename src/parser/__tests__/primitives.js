// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState} from "../../state.js";

import {parseNumber} from "../primitives.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

describe("parseNumber", () => {
    function assertParseNumber(lines: string[], value: number) {
        startParsing(lines);
        expect(parseNumber()).toEqual(value);
        expect(lexToken()).toEqual(null);
    }

    it("parses numbers", () => {
        assertParseNumber(["123%"], 123);
    });

    it("parses signs", () => {
        assertParseNumber(["+123%"], 123);
        assertParseNumber(["-123%"], -123);
        assertParseNumber(["-   123%"], -123);
        assertParseNumber(["--+--+-123%"], -123);
    });
});
