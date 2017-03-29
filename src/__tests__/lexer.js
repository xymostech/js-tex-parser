// @flow
/* global expect */
import {CharToken, ControlSequence} from "../Token.js";
import * as Category from "../Category.js";
import {setSource, lexToken} from "../lexer.js";
import {resetState} from "../state.js";

function assertLexesTo(lines, expectedTokens) {
    resetState();
    setSource(lines);

    const realTokens = [];

    let tok;
    while ((tok = lexToken())) {
        realTokens.push(tok);
    }

    expect(realTokens).toEqual(expectedTokens);
}

describe("lexer", () => {
    describe("lexing basic tokens", () => {
        it("lexes char tokens", () => {
            assertLexesTo(["a%"], [new CharToken("a", Category.Letter)]);
        });

        it("lexes control sequences", () => {
            assertLexesTo(["\\ab%"], [new ControlSequence("ab")]);
            assertLexesTo(["\\@%"], [new ControlSequence("@")]);
        });

        it("lexes multiple tokens", () => {
            assertLexesTo(["ab%"], [
                new CharToken("a", Category.Letter),
                new CharToken("b", Category.Letter),
            ]);
        });

        it("ignores ignored tokens", () => {
            assertLexesTo(["a\u0000b%"], [
                new CharToken("a", Category.Letter),
                new CharToken("b", Category.Letter),
            ]);
        });

        it("throws on invalid tokens", () => {
            expect(() => {
                resetState();
                setSource(["\u00ff"]);
                lexToken();
            }).toThrow("Invalid character found: \u00ff");
        });
    });

    describe("handling trigraphs", () => {
        it("correctly lexes trigraphs", () => {
            assertLexesTo(["^^:%"], [new CharToken("z", Category.Letter)]);
        });

        it("lexes trigraphs recursively", () => {
            assertLexesTo(["^^\u001E^:%"], [new CharToken("z", Category.Letter)]);
        });

        it("lexes hex trigraphs", () => {
            assertLexesTo(["^^7a%"], [new CharToken("z", Category.Letter)]);
            assertLexesTo(["^^7g%"], [
                new CharToken("w", Category.Letter),
                new CharToken("g", Category.Letter),
            ]);
        });

        it("lexes control sequence trigraphs", () => {
            assertLexesTo(["^^\u001Cab \\a^^:%%"], [
                new ControlSequence("ab"),
                new ControlSequence("az"),
            ]);
        });
    });

    describe("handling space", () => {
        it("ignores leading spaces", () => {
            assertLexesTo(["  a%"], [new CharToken("a", Category.Letter)]);
        });

        it("includes trailing spaces", () => {
            assertLexesTo(["a "], [
                new CharToken("a", Category.Letter),
                new CharToken(" ", Category.Space),
            ]);
        });

        it("ignores space after control sequences", () => {
            assertLexesTo(["\\a \\abc \\  %"], [
                new ControlSequence("a"),
                new ControlSequence("abc"),
                new ControlSequence(" "),
            ]);
        });

        it("condenses multiple spaces into one space", () => {
            assertLexesTo([" a ", " a%"], [
                new CharToken("a", Category.Letter),
                new CharToken(" ", Category.Space),
                new CharToken("a", Category.Letter),
            ]);
        });

        it("converts double newlines to pars", () => {
            assertLexesTo(["a%", "", "a%"], [
                new CharToken("a", Category.Letter),
                new ControlSequence("par"),
                new CharToken("a", Category.Letter),
            ]);
        });
    });

    describe("comments", () => {
        it("parses comments", () => {
            assertLexesTo(["a%b"], [new CharToken("a", Category.Letter)]);
        });
    });
});
