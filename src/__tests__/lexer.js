import assert from "assert";

import Token from "../Token.js";
import Category from "../Category.js";
import {startLexing, lexToken} from "../lexer.js";
import {resetState} from "../state.js";

function assertLexesTo(string, expectedTokens) {
    startLexing(string);

    const realTokens = [];

    let tok;
    while ((tok = lexToken())) {
        realTokens.push(tok);
    }

    expect(realTokens).toEqual(expectedTokens);
}

beforeEach(() => {
    resetState();
});

describe("lexing basic tokens", () => {
    it("lexes char tokens", () => {
        assertLexesTo(["a%"], [new Token(Token.CHAR_TOKEN, "a", Category.Letter)]);
    });

    it("lexes control sequences", () => {
        assertLexesTo(["\\ab%"], [new Token(Token.CONTROL_SEQUENCE, "ab")]);
        assertLexesTo(["\\@%"], [new Token(Token.CONTROL_SEQUENCE, "@")]);
    });

    it("lexes multiple tokens", () => {
        assertLexesTo(["ab%"], [
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
            new Token(Token.CHAR_TOKEN, "b", Category.Letter),
        ]);
    });

    it("ignores ignored tokens", () => {
        assertLexesTo(["a\u0000b%"], [
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
            new Token(Token.CHAR_TOKEN, "b", Category.Letter),
        ]);
    });

    it("throws on invalid tokens", () => {
        expect(() => {
            startLexing(["\u00ff"]);
            lexToken();
        }).toThrow("Invalid character found: \u00ff");
    });
});

describe("handling trigraphs", () => {
    it("correctly lexes trigraphs", () => {
        assertLexesTo(["^^:%"], [new Token(Token.CHAR_TOKEN, "z", Category.Letter)]);
    });

    it("lexes trigraphs recursively", () => {
        assertLexesTo(["^^\u001E^:%"], [new Token(Token.CHAR_TOKEN, "z", Category.Letter)]);
    });

    it("lexes hex trigraphs", () => {
        assertLexesTo(["^^7a%"], [new Token(Token.CHAR_TOKEN, "z", Category.Letter)]);
        assertLexesTo(["^^7g%"], [
            new Token(Token.CHAR_TOKEN, "w", Category.Letter),
            new Token(Token.CHAR_TOKEN, "g", Category.Letter),
        ]);
    });

    it("lexes control sequence trigraphs", () => {
        assertLexesTo(["^^\u001Cab \\a^^:%%"], [
            new Token(Token.CONTROL_SEQUENCE, "ab"),
            new Token(Token.CONTROL_SEQUENCE, "az"),
        ]);
    });
});

describe("handling space", () => {
    it("ignores leading spaces", () => {
        assertLexesTo(["  a%"], [new Token(Token.CHAR_TOKEN, "a", Category.Letter)]);
    });

    it("includes trailing spaces", () => {
        assertLexesTo(["a "], [
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
            new Token(Token.CHAR_TOKEN, " ", Category.Space),
        ]);
    });

    it("ignores space after control sequences", () => {
        assertLexesTo(["\\a \\abc \\  %"], [
            new Token(Token.CONTROL_SEQUENCE, "a"),
            new Token(Token.CONTROL_SEQUENCE, "abc"),
            new Token(Token.CONTROL_SEQUENCE, " "),
        ]);
    });

    it("condenses multiple spaces into one space", () => {
        assertLexesTo([" a ", " a%"], [
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
            new Token(Token.CHAR_TOKEN, " ", Category.Space),
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
        ]);
    });

    it("converts double newlines to pars", () => {
        assertLexesTo(["a%", "", "a%"], [
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
            new Token(Token.CONTROL_SEQUENCE, "par"),
            new Token(Token.CHAR_TOKEN, "a", Category.Letter),
        ]);
    });
});

describe("comments", () => {
    it("parses comments", () => {
        assertLexesTo(["a%b"], [new Token(Token.CHAR_TOKEN, "a", Category.Letter)]);
    });
});
