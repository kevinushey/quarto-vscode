/* --------------------------------------------------------------------------------------------
 * Copyright (c) RStudio, PBC. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import Token from "markdown-it/lib/token";
import { Position, TextDocument, Uri } from "vscode";
import { MarkdownEngine } from "../markdown/engine";
import { embeddedLanguage, EmbeddedLanguage } from "./languages";
import { virtualDocUriFromEmbeddedContent } from "./vdoc-content";
import { virtualDocUriFromTempFile } from "./vdoc-tempfile";

export interface VirtualDoc {
  language: EmbeddedLanguage;
  content: string;
}

export async function virtualDoc(
  document: TextDocument,
  position: Position,
  engine: MarkdownEngine
): Promise<VirtualDoc | undefined> {
  // check if the cursor is in a fenced code block
  const tokens = await engine.parse(document);
  const language = languageAtPosition(tokens, position);

  if (language) {
    // filter out lines that aren't of this language
    const lines: string[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      lines.push("");
    }
    for (const languageBlock of tokens.filter(isBlockOfLanguage(language))) {
      if (languageBlock.map) {
        for (
          let line = languageBlock.map[0] + 1;
          line < languageBlock.map[1] - 1 && line < document.lineCount;
          line++
        ) {
          lines[line] = document.lineAt(line).text;
        }
      }
    }

    // perform inject if necessary
    if (language.inject) {
      lines[0] = language.inject;
    }

    // return the language and the content
    return {
      language,
      content: lines.join("\n"),
    };
  } else {
    return undefined;
  }
}

export async function virtualDocUri(virtualDoc: VirtualDoc, parentUri: Uri) {
  return virtualDoc.language.type === "content"
    ? virtualDocUriFromEmbeddedContent(virtualDoc, parentUri)
    : await virtualDocUriFromTempFile(virtualDoc);
}

export function languageAtPosition(tokens: Token[], position: Position) {
  for (const languageBlock of tokens.filter(isLanguageBlock)) {
    if (
      languageBlock.map &&
      position.line > languageBlock.map[0] &&
      position.line <= languageBlock.map[1]
    ) {
      return languageFromBlock(languageBlock);
    }
  }
  return undefined;
}

export function languageFromBlock(token: Token) {
  if (isDisplayMath(token)) {
    return embeddedLanguage("latex");
  } else {
    const langId = token.info.replace(/^[^\w]*/, "").replace(/[^\w]$/, "");
    return embeddedLanguage(langId);
  }
}

export function isLanguageBlock(token: Token) {
  return isFencedCode(token) || isDisplayMath(token);
}

export function isFencedCode(token: Token) {
  return token.type === "fence";
}

export function isDisplayMath(token: Token) {
  return token.type === "math_block";
}

export function isBlockOfLanguage(language: EmbeddedLanguage) {
  return (token: Token) => {
    return (
      isLanguageBlock(token) &&
      languageFromBlock(token)?.ids.some((id) => language.ids.includes(id))
    );
  };
}