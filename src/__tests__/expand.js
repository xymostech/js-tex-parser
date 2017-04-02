// @flow
/* global expect */
import {setSource} from "../lexer.js";
import {resetState} from "../state.js";
import {parseAssignment} from "../parser/assignment.js";
import {lexExpandedToken} from "../expand.js";
import {CharToken} from "../Token.js";
import {Letter} from "../Category.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

function expectParse(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
    expect(lexExpandedToken()).toEqual(null);
}

describe("lexExpandedToken", () => {
    it("lexes normal tokens unexpanded", () => {
        expectParse(["a%"], () => {
            expect(lexExpandedToken()).toEqual(new CharToken("a", Letter));
        });
    });

    it("lexes \\let replacements", () => {
        expectParse(["\\let\\a=b\\a%"], () => {
            parseAssignment(lexExpandedToken());
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });
    });

    it("lexes \\def replacements", () => {
        expectParse(["\\def\\a{b}\\a%"], () => {
            parseAssignment(lexExpandedToken());
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });

        expectParse(["\\def\\a#1{a#1b}\\a x%"], () => {
            parseAssignment(lexExpandedToken());
            expect(lexExpandedToken()).toEqual(new CharToken("a", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });
    });
});
