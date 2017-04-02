// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState, setCount} from "../../state.js";
import {CharToken, ControlSequence} from "../../Token.js";
import {Letter} from "../../Category.js";
import {parseAssignment} from "../assignment.js";

import {expandConditional} from "../conditionals.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

function expectParse(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
    expect(lexToken()).toEqual(null);
}

function doAssignment() {
    const tok = lexToken();
    if (!tok) {
        throw new Error("EOF");
    }
    parseAssignment(tok);
}

describe("conditionals", () => {
    it("parses single-body \\iftrues", () => {
        expectParse(["x\\fi%"], () => {
            expect(expandConditional(new ControlSequence("iftrue"))).toEqual([
                new CharToken("x", Letter),
            ]);
        });
    });

    it("parses \\else-y \\iftrues", () => {
        expectParse(["x\\else y\\fi%"], () => {
            expect(expandConditional(new ControlSequence("iftrue"))).toEqual([
                new CharToken("x", Letter),
            ]);
        });
    });

    it("parses single-body \\iffalses", () => {
        expectParse(["x\\fi%"], () => {
            expect(expandConditional(new ControlSequence("iffalse")))
                .toEqual([]);
        });
    });

    it("parses \\else-y \\iffalses", () => {
        expectParse(["x\\else y\\fi%"], () => {
            expect(expandConditional(new ControlSequence("iffalse"))).toEqual([
                new CharToken("y", Letter),
            ]);
        });
    });

    it("expands macros in true bodies but not false bodies", () => {
        expectParse([
            "\\def\\a{x\\else y}%",
            "\\def\\b{z\\fi}%",
            "\\iftrue w\\a\\b\\fi%",
        ], () => {
            doAssignment();
            doAssignment();
            expect(expandConditional(lexToken())).toEqual([
                new CharToken("w", Letter),
                new CharToken("x", Letter),
            ]);
        });
    });

    describe("\\ifnum", () => {
        const IFNUM = new ControlSequence("ifnum");

        it("parses plain number >", () => {
            expectParse(["2>1 x\\fi%"], () => {
                expect(expandConditional(IFNUM)).toEqual([
                    new CharToken("x", Letter),
                ]);
            });

            expectParse(["1>2 x\\fi%"], () => {
                expect(expandConditional(IFNUM)).toEqual([]);
            });
        });

        it("parses plain number <", () => {
            expectParse(["1<2 x\\fi%"], () => {
                expect(expandConditional(IFNUM)).toEqual([
                    new CharToken("x", Letter),
                ]);
            });

            expectParse(["2<1 x\\fi%"], () => {
                expect(expandConditional(IFNUM)).toEqual([]);
            });
        });

        it("parses plain number =", () => {
            expectParse(["1=1 x\\fi%"], () => {
                expect(expandConditional(IFNUM)).toEqual([
                    new CharToken("x", Letter),
                ]);
            });

            expectParse(["2=1 x\\fi%"], () => {
                expect(expandConditional(IFNUM)).toEqual([]);
            });
        });

        it("parses variables", () => {
            expectParse(["\\count0>1 x\\fi%"], () => {
                setCount(0, 2);
                expect(expandConditional(IFNUM)).toEqual([
                    new CharToken("x", Letter),
                ]);
            });

            expectParse(["\\count0>2 x\\fi%"], () => {
                setCount(0, 1);
                expect(expandConditional(IFNUM)).toEqual([]);
            });
        });
    });
});
