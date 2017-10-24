// @flow
/* global expect */
import {setSource} from "../lexer.js";
import {resetState} from "../state.js";
import {parseAssignment} from "../parser/assignment.js";
import {lexExpandedToken} from "../expand.js";
import {CharToken} from "../Token.js";
import {Letter, Other} from "../Category.js";

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
            parseAssignment();
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });
    });

    it("lexes \\def replacements", () => {
        expectParse(["\\def\\a{b}\\a%"], () => {
            parseAssignment();
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });

        expectParse(["\\def\\a#1{a#1b}\\a x%"], () => {
            parseAssignment();
            expect(lexExpandedToken()).toEqual(new CharToken("a", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });
    });

    it("expands replacements in the correct order", () => {
        expectParse(["\\def\\b{c}\\def\\a{a\\b b}\\a%"], () => {
            parseAssignment();
            parseAssignment();
            expect(lexExpandedToken()).toEqual(new CharToken("a", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("c", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("b", Letter));
        });
    });

    it("lexes \\number expansions", () => {
        expectParse(["\\number-10%"], () => {
            expect(lexExpandedToken()).toEqual(new CharToken("-", Other));
            expect(lexExpandedToken()).toEqual(new CharToken("1", Other));
            expect(lexExpandedToken()).toEqual(new CharToken("0", Other));
        });

        expectParse(["\\count0=34 \\number\\count0%"], () => {
            parseAssignment();
            expect(lexExpandedToken()).toEqual(new CharToken("3", Other));
            expect(lexExpandedToken()).toEqual(new CharToken("4", Other));
        });
    });
});
