// @flow
/* global expect */
import {setSource, lexToken} from "../../lexer.js";
import {resetState, setCount} from "../../state.js";
import {CharToken, ControlSequence} from "../../Token.js";
import {Letter} from "../../Category.js";
import {parseAssignment} from "../assignment.js";
import {lexExpandedToken} from "../../expand.js";

import {expandConditional} from "../conditionals.js";

function startParsing(lines: string[]) {
    resetState();
    setSource(lines);
}

function expectParse(lines: string[], callback: () => void) {
    startParsing(lines);
    callback();
    expect(lexExpandedToken()).toEqual(null);
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
        expectParse(["\\iftrue x\\fi%"], () => {
            expandConditional(lexToken());
            expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
        });
    });

    it("parses \\else-y \\iftrues", () => {
        expectParse(["\\iftrue x\\else y\\fi%"], () => {
            expandConditional(lexToken());
            expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
        });
    });

    it("parses single-body \\iffalses", () => {
        expectParse(["\\iffalse x\\fi%"], () => {
            expandConditional(lexToken());
        });
    });

    it("parses \\else-y \\iffalses", () => {
        expectParse(["\\iffalse x\\else y\\fi%"], () => {
            expandConditional(lexToken());
            expect(lexExpandedToken()).toEqual(new CharToken("y", Letter));
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
            expandConditional(lexToken());
            expect(lexExpandedToken()).toEqual(new CharToken("w", Letter));
            expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
        });
    });

    describe("\\ifnum", () => {
        it("parses plain number >", () => {
            expectParse(["\\ifnum 2>1 x\\fi%"], () => {
                expandConditional(lexToken());
                expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
            });

            expectParse(["\\ifnum 1>2 x\\fi%"], () => {
                expandConditional(lexToken());
            });
        });

        it("parses plain number <", () => {
            expectParse(["\\ifnum 1<2 x\\fi%"], () => {
                expandConditional(lexToken());
                expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
            });

            expectParse(["\\ifnum 2<1 x\\fi%"], () => {
                expandConditional(lexToken());
            });
        });

        it("parses plain number =", () => {
            expectParse(["\\ifnum 1=1 x\\fi%"], () => {
                expandConditional(lexToken());
                expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
            });

            expectParse(["\\ifnum 2=1 x\\fi%"], () => {
                expandConditional(lexToken());
            });
        });

        it("parses variables", () => {
            expectParse(["\\ifnum\\count0>1 x\\fi%"], () => {
                setCount(0, 2);
                expandConditional(lexToken());
                expect(lexExpandedToken()).toEqual(new CharToken("x", Letter));
            });

            expectParse(["\\ifnum\\count0>2 x\\fi%"], () => {
                setCount(0, 1);
                expandConditional(lexToken());
            });
        });
    });
});
