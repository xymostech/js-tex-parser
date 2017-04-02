// @flow
import {Token} from "./Token.js";

export class Parameter {
    index: number;

    constructor(index: number) {
        this.index = index;
    }
}

export class Macro {
    parameterText: (Token | Parameter)[];
    replacementText: (Token | Parameter)[];
    numberOfParameters: number;

    constructor(
        parameterText: (Token | Parameter)[],
        replacementText: (Token | Parameter)[],
    ) {
        this.parameterText = parameterText;
        this.replacementText = replacementText;

        this.numberOfParameters = 0;
        this.parameterText.forEach(element => {
            if (element instanceof Parameter) {
                this.numberOfParameters++;
                if (element.index !== this.numberOfParameters) {
                    throw new Error(
                        `Out of order parameter in macro parameter text: ` +
                        `#${element.index}`);
                }
            }
        });

        this.replacementText.forEach(element => {
            if (element instanceof Parameter) {
                if (
                    element.index < 0 ||
                    element.index > this.numberOfParameters
                ) {
                    throw new Error(
                        `Parameter in replacement text outside of range of ` +
                        `parameters: #${element.index}`);
                }
            }
        });
    }

    getReplacement(parameterValues: Map<number, Token[]>): Token[] {
        const replacement: Token[][] = this.replacementText.map(element => {
            if (element instanceof Parameter) {
                const parameterReplacement = parameterValues.get(element.index);
                if (!parameterReplacement) {
                    throw new Error(
                        `Missing parameter in replacement: #${element.index}`);
                }
                return parameterReplacement;
            } else {
                return [element];
            }
        });
        return [].concat(...replacement);
    }
}
