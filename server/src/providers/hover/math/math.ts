/* --------------------------------------------------------------------------------------------
 * Copyright (c) RStudio, PBC. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Hover, Position } from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { mathjaxTypesetToMarkdown } from "./math-mathjax";
import { mathRange } from "../../../core/math/math";

export function mathHover(doc: TextDocument, pos: Position): Hover | null {
  const range = mathRange(doc, pos);
  if (range) {
    const contents = mathjaxTypesetToMarkdown(range.math);
    if (contents) {
      return {
        contents,
        range: range.range,
      };
    }
  }
  return null;
}