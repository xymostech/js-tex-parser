// @flow
/* global expect */
import path from "path";
import fs from "fs";

import {setSource} from "../lexer.js";
import {resetState} from "../state.js";

import parseHorizontalList, {HBoxChar} from "../parser/horizontalList.js";

describe("integration tests", () => {
    it("calculates primes", () => {
        const source = fs.readFileSync(
            path.join(__dirname, "..", "..", "examples", "primes.tex"), "utf8");

        resetState();
        setSource(source.split("\n"));

        expect(parseHorizontalList()).toEqual([
            new HBoxChar("2"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("3"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("5"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("7"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("1"),
            new HBoxChar("1"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("1"),
            new HBoxChar("3"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("1"),
            new HBoxChar("7"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("1"),
            new HBoxChar("9"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("2"),
            new HBoxChar("3"),
            new HBoxChar(","),
            new HBoxChar(" "),
            new HBoxChar("a"),
            new HBoxChar("n"),
            new HBoxChar("d"),
            new HBoxChar(" "),
            new HBoxChar("2"),
            new HBoxChar("9"),
            new HBoxChar(" "),
        ]);
    });
});
