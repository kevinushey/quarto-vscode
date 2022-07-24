/* --------------------------------------------------------------------------------------------
 * Copyright (c) RStudio, PBC. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { Range, TextEdit } from "vscode-languageserver-types";

import {
  Command,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
} from "vscode-languageserver/node";
import {
  isCodeBlockAtPosition,
  isContentPosition,
} from "../../core/markdown/markdown";

import { EditorContext, quarto } from "../../quarto/quarto";

export async function refsCompletions(
  doc: TextDocument,
  pos: Position,
  context: EditorContext,
  completionContext?: CompletionContext
) {
  // bail if no quarto connection
  if (!quarto) {
    return null;
  }

  // validate trigger
  if (context.trigger && !["@"].includes(context.trigger)) {
    return null;
  }

  // bypass if the current line doesn't contain a @
  // (performance optimization so we don't execute the regexs
  // below if we don't need to)
  if (context.line.indexOf("@") === -1) {
    return null;
  }

  // check if we are in markdown
  if (!isContentPosition(doc, pos)) {
    return null;
  }

  // scan back from the cursor to see if there is a @
  const line = doc
    .getText(Range.create(pos.line, 0, pos.line + 1, 0))
    .trimEnd();
  const text = line.slice(0, pos.character);
  const atPos = text.lastIndexOf("@");
  const spacePos = text.lastIndexOf(" ");

  if (atPos !== -1 && atPos > spacePos) {
    // everything between the @ and the cursor must match the cite pattern
    const tokenText = text.slice(atPos + 1, pos.character);
    if (/[^@;\[\]\s\!\,]*/.test(tokenText)) {
      // make sure there is no text directly ahead (except bracket, space, semicolon)
      const nextChar = text.slice(pos.character, pos.character + 1);
      if (!nextChar || [";", " ", "]"].includes(nextChar)) {
        return [
          {
            kind: CompletionItemKind.Function,

            documentation: "documentation",
            detail: "detail",
            label: "one",
          },
          {
            kind: CompletionItemKind.Function,
            documentation: "documentation",
            detail: "detail",
            label: "two",
          },
        ];
      }
    }
  }

  return null;
}
