// The executable tex parser
import {setSource} from "./lexer.js";
import {lexExpandedToken} from "./expand.js";
import parseHorizontalList, {HBoxChar} from "./parser/horizontalList.js";

process.stdin.setEncoding('utf8');

let source = "";
process.stdin.on('data', (chunk) => {
    source += chunk;
});
process.stdin.on('end', () => {
    setSource(source.split('\n'));
    const result = parseHorizontalList(lexExpandedToken());

    result.forEach(r => {
        if (r instanceof HBoxChar) {
            process.stdout.write(r.ch);
        }
    });
    process.stdout.write('\n');
});
