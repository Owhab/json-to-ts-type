import * as vscode from 'vscode';
import { quicktype, InputData, jsonInputForTargetLanguage } from 'quicktype-core';

async function jsonToTs(name: string, json: string, asType: boolean) {
	const jsonInput = jsonInputForTargetLanguage("typescript");

	await jsonInput.addSource({
		name,
		samples: [json],
	});

	const inputData = new InputData();
	inputData.addInput(jsonInput);

	const result = await quicktype({
		inputData,
		lang: "typescript",
		rendererOptions: {
			"just-types": "true"
		}
	});

	let code = result.lines.join("\n");

	if (asType) {
		code = code.replace(/interface (\w+) {/g, "type $1 = {");
	}

	return code;
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		'extension.generateTypeFromJson',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const selection = editor.selection;
			let jsonText = editor.document.getText(selection);
			if (!jsonText.trim()) {
				jsonText = await vscode.env.clipboard.readText();
			}

			try {
				JSON.parse(jsonText); // validate JSON first

				const choice = await vscode.window.showQuickPick(
					['interface', 'type'],
					{ placeHolder: 'Generate as interface or type?' }
				);
				if (!choice) return;

				const tsCode = await jsonToTs("Root", jsonText, choice === "type");

				editor.edit(editBuilder => {
					editBuilder.insert(selection.end, '\n' + tsCode + '\n');
				});

			} catch (err) {
				vscode.window.showErrorMessage('Invalid JSON input');
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() { }
