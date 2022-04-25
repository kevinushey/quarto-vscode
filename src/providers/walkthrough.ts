/*---------------------------------------------------------------------------------------------
 *  Copyright (c) RStudio, PBC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, env, Uri, workspace, ViewColumn } from "vscode";

import * as fs from "fs";
import * as path from "path";

import { Command } from "../core/command";
import { defaultSaveDir } from "../core/doc";
import { QuartoContext } from "../shared/quarto";
import { hasRequiredExtension } from "./cell/executors";

export function walkthroughCommands(quartoContext: QuartoContext): Command[] {
  return [
    new VerifyInstallationCommand(quartoContext),
    new WalkthroughNewDocumentCommand(),
  ];
}

class VerifyInstallationCommand implements Command {
  private static readonly id = "quarto.walkthrough.verifyInstallation";
  public readonly id = VerifyInstallationCommand.id;

  constructor(private readonly quartoContext_: QuartoContext) {}

  async execute(): Promise<void> {
    if (this.quartoContext_.available) {
      window.showInformationMessage("Quarto Installation Verified", {
        modal: true,
        detail: `Quarto version ${this.quartoContext_.version} installed at ${this.quartoContext_.binPath}`,
      });
    } else {
      const installQuarto = { title: "Install Quarto" };
      const result = await window.showWarningMessage(
        "Quarto Installation Not Found",
        {
          modal: true,
          detail:
            "Please install the Quarto CLI before using the VS Code extension.",
        },
        installQuarto
      );
      if (result === installQuarto) {
        env.openExternal(Uri.parse("https://quarto.org/docs/get-started/"));
      }
    }
  }
}

class WalkthroughNewDocumentCommand implements Command {
  private static readonly id = "quarto.walkthrough.newDocument";
  public readonly id = WalkthroughNewDocumentCommand.id;

  async execute(): Promise<void> {
    const saveDir = defaultSaveDir();
    const saveOptions = {
      defaultUri: Uri.file(path.join(saveDir, "walkthrough.qmd")),
      filters: {
        Quarto: ["qmd"],
      },
    };
    const target = await window.showSaveDialog(saveOptions);
    if (target) {
      fs.writeFileSync(target.fsPath, this.scaffold(), {
        encoding: "utf8",
      });
      const doc = await workspace.openTextDocument(target);
      await window.showTextDocument(doc, ViewColumn.Beside, false);
    }
  }

  private scaffold(): string {
    // determine which code block to use (default to python)
    const kPython = {
      lang: "python",
      desc: "a Python",
      code: "import os\nos.cpu_count()",
      suffix: ":",
    };
    const kR = {
      lang: "r",
      desc: "an R",
      code: "summary(cars)",
      suffix: ":",
    };
    const kJulia = {
      lang: "julia",
      desc: "a Julia",
      code: "1 + 1",
      suffix: ":",
    };
    const langBlock = [kPython, kR, kJulia].find((lang) => {
      return hasRequiredExtension(lang.lang);
    }) || {
      ...kPython,
      suffix:
        ".\n\nInstall the VS Code Python Extension to enable\nrunning this cell interactively.",
    };

    return `---
title: "Hello, Quarto"
format: html
---

## Markdown

Markdown is an easy to read and write text format:

- It's _plain text_ so works well with version control
- It can be **rendered** into HTML, PDF, and more
- Learn more at: <https://quarto.org/docs/authoring/>

## Code Cell

Here is ${langBlock.desc} code cell${langBlock.suffix}

\`\`\`{${langBlock.lang}}
${langBlock.code}
\`\`\`

## Equation

Use LaTeX to write equations:

$$
chi' = sum_{i=1}^n k_i s_i^2
$$
`;
  }
}

/*
const saveDir = defaultSaveDir();
    const saveOptions = {
      defaultUri: Uri.file(
        path.join(saveDir, editor.document.uri.fsPath + ".qmd")
      ),
      filters: {
        Quarto: ["qmd"],
      },
    };

    const target = await window.showSaveDialog(saveOptions);


*/
