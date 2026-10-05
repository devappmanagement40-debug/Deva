---
name: PDF processing in the JS workspace
description: Avoid leaving Python package-manager scaffolding or config changes after one-off PDF conversion.
---

When processing a PDF in this JavaScript app, use the existing Python tooling if available and keep any added PDF dependency strictly temporary unless the product itself needs it. Check generated project files and `.replit` changes against the prior state before finishing.

**Why:** A one-off PyMuPDF install initialized Python project files and altered Replit configuration; removing the temporary module also changed an existing module declaration and required restoring it.

**How to apply:** Before installing a Python package, inspect the existing Python module and project files. After conversion, remove only newly created scaffolding and restore `.replit` to the configuration that existed before processing.
