import * as vscode from 'vscode';
import { quicktype, InputData, jsonInputForTargetLanguage } from 'quicktype-core';
import * as yaml from 'js-yaml';
import * as JSON5 from 'json5';
import { parse as csvParse } from 'csv-parse/sync';

// Output format types
type OutputFormat = 'interface' | 'type' | 'zod' | 'json-schema' | 'graphql' | 'advanced-interface' | 'advanced-type';

// Analysis options
interface TypeAnalysisOptions {
	detectOptionalProperties: boolean;
	generateEnums: boolean;
	detectUnionTypes: boolean;
	useReadonly: boolean;
	generateIndexSignatures: boolean;
	detectPatterns: boolean;
}

// Input format types
type InputFormat = 'json' | 'yaml' | 'json5' | 'csv' | 'jsonlines';

// Input processing result
interface ParsedInput {
	data: any;
	format: InputFormat;
	originalText: string;
}

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

// Input format detection and parsing functions
function detectInputFormat(text: string): InputFormat {
	const trimmedText = text.trim();
	
	// Check for JSON Lines (multiple JSON objects separated by newlines)
	if (trimmedText.includes('\n') && trimmedText.split('\n').every(line => {
		const trimmedLine = line.trim();
		return !trimmedLine || (trimmedLine.startsWith('{') && trimmedLine.endsWith('}'));
	})) {
		return 'jsonlines';
	}
	
	// Check for CSV (contains commas and likely headers)
	if (trimmedText.includes(',') && trimmedText.includes('\n')) {
		const lines = trimmedText.split('\n').filter(l => l.trim());
		if (lines.length >= 2) {
			const firstLine = lines[0];
			const secondLine = lines[1];
			// Simple heuristic: if both lines have similar number of commas, likely CSV
			const firstCommas = (firstLine.match(/,/g) || []).length;
			const secondCommas = (secondLine.match(/,/g) || []).length;
			if (firstCommas > 0 && Math.abs(firstCommas - secondCommas) <= 1) {
				return 'csv';
			}
		}
	}
	
	// Check for YAML indicators
	if (trimmedText.includes(':') && (
		trimmedText.includes('\n- ') ||
		trimmedText.includes('\n  ') ||
		trimmedText.match(/^[a-zA-Z_][a-zA-Z0-9_]*:\s*/) ||
		trimmedText.includes('---')
	)) {
		return 'yaml';
	}
	
	// Check for JSON5 indicators (comments, trailing commas, unquoted keys)
	if (trimmedText.includes('//') || 
		trimmedText.includes('/*') ||
		trimmedText.match(/,\s*[}\]]/) ||
		trimmedText.match(/{\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/) ||
		trimmedText.match(/[\[,]\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/)) {
		return 'json5';
	}
	
	// Default to JSON
	return 'json';
}

function parseInput(text: string, format?: InputFormat): ParsedInput {
	const detectedFormat = format || detectInputFormat(text);
	
	try {
		switch (detectedFormat) {
			case 'yaml':
				return {
					data: yaml.load(text),
					format: 'yaml',
					originalText: text
				};
				
			case 'json5':
				return {
					data: JSON5.parse(text),
					format: 'json5',
					originalText: text
				};
				
			case 'csv':
				return parseCsvInput(text);
				
			case 'jsonlines':
				return parseJsonLines(text);
				
			case 'json':
			default:
				// Try to fix common JSON issues first
				const fixedJson = attemptJsonFix(text);
				return {
					data: JSON.parse(fixedJson),
					format: 'json',
					originalText: text
				};
		}
	} catch (error) {
		// If parsing fails, try to auto-fix common issues
		if (detectedFormat === 'json') {
			const fixedJson = attemptJsonFix(text);
			try {
				return {
					data: JSON.parse(fixedJson),
					format: 'json',
					originalText: text
				};
			} catch {
				throw new Error(`Failed to parse ${detectedFormat.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
		throw new Error(`Failed to parse ${detectedFormat.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

function attemptJsonFix(text: string): string {
	let fixed = text.trim();
	
	// Remove trailing commas
	fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
	
	// Fix single quotes to double quotes for property names and values
	fixed = fixed.replace(/'([^']*)':/g, '"$1":');
	fixed = fixed.replace(/:(\s*)'([^']*)'/g, ': "$2"');
	
	// Add missing quotes to unquoted property names
	fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
	
	// Fix missing commas between properties/array elements
	fixed = fixed.replace(/"\s*\n\s*"/g, '",\n"');
	fixed = fixed.replace(/}\s*\n\s*{/g, '},\n{');
	
	return fixed;
}

function parseCsvInput(text: string): ParsedInput {
	try {
		const records = csvParse(text, {
			columns: true,
			skip_empty_lines: true,
			delimiter: ',',
			quote: '"',
			escape: '"'
		});
		
		return {
			data: records,
			format: 'csv',
			originalText: text
		};
	} catch (error) {
		throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

function parseJsonLines(text: string): ParsedInput {
	try {
		const lines = text.trim().split('\n').filter(line => line.trim());
		const objects = lines.map(line => JSON.parse(line.trim()));
		
		return {
			data: objects,
			format: 'jsonlines',
			originalText: text
		};
	} catch (error) {
		throw new Error(`Failed to parse JSON Lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

function generateZodSchema(jsonObj: any, name: string = 'Root'): string {
	function getZodType(value: any): string {
		if (value === null) return 'z.null()';
		if (Array.isArray(value)) {
			if (value.length === 0) return 'z.array(z.unknown())';
			const itemType = getZodType(value[0]);
			return `z.array(${itemType})`;
		}
		
		switch (typeof value) {
			case 'string': return 'z.string()';
			case 'number': return Number.isInteger(value) ? 'z.number().int()' : 'z.number()';
			case 'boolean': return 'z.boolean()';
			case 'object':
				if (value === null) return 'z.null()';
				const properties = Object.entries(value)
					.map(([key, val]) => `  ${key}: ${getZodType(val)}`)
					.join(',\n');
				return `z.object({\n${properties}\n})`;
			default: return 'z.unknown()';
		}
	}

	const schema = getZodType(jsonObj);
	return `import { z } from 'zod';\n\nexport const ${name}Schema = ${schema};\n\nexport type ${name} = z.infer<typeof ${name}Schema>;`;
}

function generateJsonSchema(jsonObj: any, name: string = 'Root'): string {
	function getJsonSchemaType(value: any): any {
		if (value === null) return { type: "null" };
		if (Array.isArray(value)) {
			if (value.length === 0) return { type: "array", items: {} };
			return {
				type: "array",
				items: getJsonSchemaType(value[0])
			};
		}
		
		switch (typeof value) {
			case 'string': return { type: "string" };
			case 'number': return { type: "number" };
			case 'boolean': return { type: "boolean" };
			case 'object':
				if (value === null) return { type: "null" };
				const properties: any = {};
				const required: string[] = [];
				
				Object.entries(value).forEach(([key, val]) => {
					properties[key] = getJsonSchemaType(val);
					required.push(key);
				});
				
				return {
					type: "object",
					properties,
					required,
					additionalProperties: false
				};
			default: return {};
		}
	}

	const schema = {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		$id: `http://example.com/${name.toLowerCase()}.schema.json`,
		title: name,
		...getJsonSchemaType(jsonObj)
	};

	return JSON.stringify(schema, null, 2);
}

function generateGraphQLTypes(jsonObj: any, name: string = 'Root'): string {
	function getGraphQLType(value: any, fieldName?: string): string {
		if (value === null) return 'String';
		if (Array.isArray(value)) {
			if (value.length === 0) return '[String]';
			const itemType = getGraphQLType(value[0]);
			return `[${itemType}]`;
		}
		
		switch (typeof value) {
			case 'string': return 'String';
			case 'number': return Number.isInteger(value) ? 'Int' : 'Float';
			case 'boolean': return 'Boolean';
			case 'object':
				if (value === null) return 'String';
				return fieldName ? `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}` : 'Object';
			default: return 'String';
		}
	}

	function generateTypeDefinition(obj: any, typeName: string): string[] {
		const types: string[] = [];
		const fields: string[] = [];
		
		Object.entries(obj).forEach(([key, value]) => {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				const nestedTypeName = key.charAt(0).toUpperCase() + key.slice(1);
				types.push(...generateTypeDefinition(value, nestedTypeName));
				fields.push(`  ${key}: ${nestedTypeName}`);
			} else {
				const fieldType = getGraphQLType(value, key);
				fields.push(`  ${key}: ${fieldType}`);
			}
		});
		
		types.unshift(`type ${typeName} {\n${fields.join('\n')}\n}`);
		return types;
	}

	const types = generateTypeDefinition(jsonObj, name);
	return types.join('\n\n');
}

// Advanced TypeScript generation with smart analysis
function analyzeJsonStructure(jsonObj: any, samples: any[] = []): any {
	const allSamples = [jsonObj, ...samples];
	
	function analyzeProperty(key: string, values: any[]) {
		const nonNullValues = values.filter(v => v !== null && v !== undefined);
		const isOptional = nonNullValues.length < values.length;
		const uniqueTypes = [...new Set(nonNullValues.map(v => typeof v))];
		const isUnion = uniqueTypes.length > 1;
		
		// Pattern detection
		let detectedPattern: string | null = null;
		if (uniqueTypes.includes('string')) {
			const stringValues = nonNullValues.filter(v => typeof v === 'string') as string[];
			
			// Email pattern
			if (stringValues.every(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) {
				detectedPattern = 'email';
			}
			// UUID pattern
			else if (stringValues.every(s => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s))) {
				detectedPattern = 'uuid';
			}
			// Date pattern
			else if (stringValues.every(s => !isNaN(Date.parse(s)))) {
				detectedPattern = 'date';
			}
			// URL pattern
			else if (stringValues.every(s => /^https?:\/\/.+/.test(s))) {
				detectedPattern = 'url';
			}
		}
		
		// Enum detection - if all values are strings and there are few unique values
		const isEnum = uniqueTypes.length === 1 && uniqueTypes[0] === 'string' && 
			nonNullValues.length > 1 && new Set(nonNullValues).size <= 5 && 
			new Set(nonNullValues).size < nonNullValues.length * 0.8;
		
		return {
			isOptional,
			isUnion,
			types: uniqueTypes,
			values: nonNullValues,
			pattern: detectedPattern,
			isEnum: isEnum && new Set(nonNullValues).size > 1
		};
	}
	
	if (Array.isArray(jsonObj)) {
		return { type: 'array', items: analyzeJsonStructure(jsonObj[0], jsonObj.slice(1)) };
	}
	
	if (typeof jsonObj === 'object' && jsonObj !== null) {
		const properties: { [key: string]: any } = {};
		const allKeys = new Set<string>();
		
		// Collect all possible keys from all samples
		allSamples.forEach(sample => {
			if (sample && typeof sample === 'object' && !Array.isArray(sample)) {
				Object.keys(sample).forEach(key => allKeys.add(key));
			}
		});
		
		allKeys.forEach(key => {
			const propertyValues = allSamples.map(sample => 
				sample && typeof sample === 'object' && !Array.isArray(sample) ? sample[key] : undefined
			);
			
			properties[key] = analyzeProperty(key, propertyValues);
			
			// Recursively analyze nested objects
			const objectValues = propertyValues.filter(v => typeof v === 'object' && v !== null && !Array.isArray(v));
			if (objectValues.length > 0) {
				properties[key].nested = analyzeJsonStructure(objectValues[0], objectValues.slice(1));
			}
		});
		
		return { type: 'object', properties };
	}
	
	return { type: typeof jsonObj, value: jsonObj };
}

function generateAdvancedTypeScript(analysis: any, name: string, options: TypeAnalysisOptions, asType: boolean = false): string {
	const enums: string[] = [];
	
	function generateTypeDefinition(analysis: any, typeName: string): string {
		if (analysis.type === 'array') {
			const itemType = generateTypeFromAnalysis(analysis.items, `${typeName}Item`);
			return `${itemType}[]`;
		}
		
		if (analysis.type === 'object') {
			const properties: string[] = [];
			
			Object.entries(analysis.properties).forEach(([key, prop]: [string, any]) => {
				let typeString = generateTypeFromAnalysis(prop, key);
				
				// Add readonly modifier if enabled
				const readonly = options.useReadonly ? 'readonly ' : '';
				
				// Handle optional properties
				const optional = options.detectOptionalProperties && prop.isOptional ? '?' : '';
				
				properties.push(`  ${readonly}${key}${optional}: ${typeString};`);
			});
			
			// Add index signature if many dynamic properties detected
			if (options.generateIndexSignatures && Object.keys(analysis.properties).length > 10) {
				properties.push(`  [key: string]: unknown;`);
			}
			
			const keyword = asType ? 'type' : 'interface';
			const equals = asType ? ' = ' : ' ';
			
			return `${keyword} ${typeName}${equals}{\n${properties.join('\n')}\n}`;
		}
		
		return generateTypeFromAnalysis(analysis, typeName);
	}
	
	function generateTypeFromAnalysis(prop: any, contextName: string): string {
		// Handle enums
		if (options.generateEnums && prop.isEnum) {
			const enumName = `${contextName.charAt(0).toUpperCase() + contextName.slice(1)}`;
			const enumValues = [...new Set(prop.values)].map((v: unknown) => {
				const stringValue = String(v);
				const enumKey = stringValue.toUpperCase().replace(/[^A-Z0-9]/g, '_');
				return `  ${enumKey} = "${stringValue}"`;
			}).join(',\n');
			
			enums.push(`enum ${enumName} {\n${enumValues}\n}`);
			return enumName;
		}
		
		// Handle union types
		if (options.detectUnionTypes && prop.isUnion) {
			const types = prop.types.map((t: string) => {
				switch (t) {
					case 'string': return 'string';
					case 'number': return 'number';
					case 'boolean': return 'boolean';
					default: return 'unknown';
				}
			});
			return types.join(' | ');
		}
		
		// Handle pattern detection
		if (options.detectPatterns && prop.pattern) {
			switch (prop.pattern) {
				case 'email': return 'string /* email */';
				case 'uuid': return 'string /* uuid */';
				case 'date': return 'Date | string /* ISO date */';
				case 'url': return 'string /* URL */';
			}
		}
		
		// Handle nested objects
		if (prop.nested) {
			if (prop.nested.type === 'object') {
				const nestedTypeName = `${contextName.charAt(0).toUpperCase() + contextName.slice(1)}`;
				const nestedType = generateTypeDefinition(prop.nested, nestedTypeName);
				enums.push(nestedType);
				return nestedTypeName;
			}
			return generateTypeFromAnalysis(prop.nested, contextName);
		}
		
		// Handle arrays
		if (Array.isArray(prop.values) && prop.values.length > 0 && Array.isArray(prop.values[0])) {
			return `${generateTypeFromAnalysis({ values: [prop.values[0][0]], types: [typeof prop.values[0][0]] }, contextName)}[]`;
		}
		
		// Default type mapping
		if (prop.types && prop.types.length > 0) {
			const primaryType = prop.types[0];
			switch (primaryType) {
				case 'string': return 'string';
				case 'number': return 'number';
				case 'boolean': return 'boolean';
				default: return 'unknown';
			}
		}
		
		return 'unknown';
	}
	
	const mainType = generateTypeDefinition(analysis, name);
	
	// Combine all generated types
	const allTypes = [mainType, ...enums].join('\n\n');
	return allTypes;
}

function generateAdvancedCode(name: string, json: string, format: OutputFormat, options: TypeAnalysisOptions): string {
	const jsonObj = JSON.parse(json);
	const analysis = analyzeJsonStructure(jsonObj);
	
	switch (format) {
		case 'advanced-interface':
			return generateAdvancedTypeScript(analysis, name, options, false);
		case 'advanced-type':
			return generateAdvancedTypeScript(analysis, name, options, true);
		default:
			return generateAdvancedTypeScript(analysis, name, options, false);
	}
}

async function generateCode(name: string, inputText: string, format: OutputFormat, options?: TypeAnalysisOptions): Promise<string> {
	// Parse the input data
	const parsedInput = parseInput(inputText);
	const jsonObj = parsedInput.data;
	
	// Default analysis options
	const defaultOptions: TypeAnalysisOptions = {
		detectOptionalProperties: true,
		generateEnums: true,
		detectUnionTypes: true,
		useReadonly: false,
		generateIndexSignatures: false,
		detectPatterns: true
	};
	
	const analysisOptions = options || defaultOptions;
	
	// Convert parsed data to JSON string for legacy functions
	const jsonString = JSON.stringify(jsonObj, null, 2);
	
	switch (format) {
		case 'zod':
			return generateZodSchema(jsonObj, name);
		case 'json-schema':
			return generateJsonSchema(jsonObj, name);
		case 'graphql':
			return generateGraphQLTypes(jsonObj, name);
		case 'advanced-interface':
		case 'advanced-type':
			return generateAdvancedCode(name, jsonString, format, analysisOptions);
		case 'interface':
			return await jsonToTs(name, jsonString, false);
		case 'type':
			return await jsonToTs(name, jsonString, true);
		default:
			return await jsonToTs(name, jsonString, false);
	}
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
				// Parse and validate input (supports multiple formats)
				const parsedInput = parseInput(jsonText);
				
				// Show detected format to user
				const formatMessage = parsedInput.format.toUpperCase();
				vscode.window.showInformationMessage(`Detected input format: ${formatMessage}`);

				// Show multiple output format options
				const formatOptions = [
					{ label: 'TypeScript Interface', value: 'interface' as OutputFormat, description: 'Basic TypeScript interface' },
					{ label: 'TypeScript Type', value: 'type' as OutputFormat, description: 'Basic TypeScript type alias' },
					{ label: 'Advanced Interface', value: 'advanced-interface' as OutputFormat, description: 'Smart interface with optional properties, enums, patterns' },
					{ label: 'Advanced Type', value: 'advanced-type' as OutputFormat, description: 'Smart type with optional properties, enums, patterns' },
					{ label: 'Zod Schema', value: 'zod' as OutputFormat, description: 'Generate Zod schema for runtime validation' },
					{ label: 'JSON Schema', value: 'json-schema' as OutputFormat, description: 'Generate JSON Schema specification' },
					{ label: 'GraphQL Types', value: 'graphql' as OutputFormat, description: 'Generate GraphQL type definitions' }
				];

				const choice = await vscode.window.showQuickPick(
					formatOptions,
					{ 
						placeHolder: 'Select output format',
						matchOnDescription: true
					}
				);
				if (!choice) return;

				// Ask for type name
				const typeName = await vscode.window.showInputBox({
					prompt: 'Enter type/schema name',
					value: 'Root',
					validateInput: (value) => {
						if (!value || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
							return 'Please enter a valid identifier name';
						}
						return null;
					}
				});
				if (!typeName) return;

				let analysisOptions: TypeAnalysisOptions | undefined = undefined;

				// Show configuration options for advanced formats
				if (choice.value === 'advanced-interface' || choice.value === 'advanced-type') {
					const configOptions = await vscode.window.showQuickPick([
						{ label: 'Use Smart Defaults', description: 'Detect patterns, enums, optional properties automatically', value: 'default' },
						{ label: 'Configure Options', description: 'Customize analysis behavior', value: 'configure' }
					], {
						placeHolder: 'Choose configuration approach'
					});

					if (!configOptions) return;

					if (configOptions.value === 'configure') {
						const options = await Promise.all([
							vscode.window.showQuickPick(['Yes', 'No'], { 
								placeHolder: 'Detect optional properties automatically?',
								ignoreFocusOut: true
							}),
							vscode.window.showQuickPick(['Yes', 'No'], { 
								placeHolder: 'Generate enums for repeated string values?',
								ignoreFocusOut: true
							}),
							vscode.window.showQuickPick(['Yes', 'No'], { 
								placeHolder: 'Create union types for mixed types?',
								ignoreFocusOut: true
							}),
							vscode.window.showQuickPick(['Yes', 'No'], { 
								placeHolder: 'Add readonly modifiers?',
								ignoreFocusOut: true
							}),
							vscode.window.showQuickPick(['Yes', 'No'], { 
								placeHolder: 'Detect patterns (email, UUID, dates)?',
								ignoreFocusOut: true
							})
						]);

						if (options.some(opt => !opt)) return; // User cancelled

						analysisOptions = {
							detectOptionalProperties: options[0] === 'Yes',
							generateEnums: options[1] === 'Yes',
							detectUnionTypes: options[2] === 'Yes',
							useReadonly: options[3] === 'Yes',
							generateIndexSignatures: false, // Keep this off for now
							detectPatterns: options[4] === 'Yes'
						};
					}
				}

				const generatedCode = await generateCode(typeName, jsonText, choice.value, analysisOptions);

				editor.edit(editBuilder => {
					editBuilder.insert(selection.end, '\n' + generatedCode + '\n');
				});

				// Show success message with format info
				vscode.window.showInformationMessage(`Generated ${choice.label} successfully!`);

			} catch (err) {
				vscode.window.showErrorMessage(`Invalid JSON input: ${err instanceof Error ? err.message : 'Unknown error'}`);
			}
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() { }
