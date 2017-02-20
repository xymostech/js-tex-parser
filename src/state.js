import Category from "./Category.js";

const categoryMap = new Map();

export function resetState() {
    for (let i = 0; i < 256; i++) {
        const ch = String.fromCharCode(i);
        if (("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z")) {
            categoryMap.set(ch, Category.Letter);
        } else {
            categoryMap.set(ch, Category.Other);
        }
    }
    categoryMap.set("\\", Category.Escape);
    categoryMap.set("\u0000", Category.Ignored);
    categoryMap.set("%", Category.Comment);
    categoryMap.set("\n", Category.EndOfLine);
    categoryMap.set(" ", Category.Space);
    categoryMap.set("\u00ff", Category.Invalid);

    // TODO(emily): Remove me, these aren't set by default!
    categoryMap.set("^", Category.Superscript);
}

resetState();

export function getCategory(c) {
    return categoryMap.get(c);
}
