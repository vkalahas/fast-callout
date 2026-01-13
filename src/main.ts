import { Editor, MarkdownView, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, FastCalloutSettings, FastCalloutSettingTab } from "./settings";

export default class FastCallout extends Plugin {
	settings: FastCalloutSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FastCalloutSettingTab(this.app, this));

		// Register slash commands for all callouts and nicknames
		this.registerCalloutCommands();

		// detect trigger phrases
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor, view: MarkdownView) => {
				this.handleEditorChange(editor);
			})
		);
	}

	onunload() {
	}

	handleEditorChange(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		
		// Check for trigger pattern (e.g., "@definition ") with trailing space before cursor
		const beforeCursor = line.substring(0, cursor.ch);
		const prefix = this.settings.triggerPrefix;
		const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const triggerMatch = beforeCursor.match(new RegExp(`${escapedPrefix}(\\w+) $`));
		
		if (triggerMatch && triggerMatch[1]) {
			// callout text expansion
			const input = triggerMatch[1].toLowerCase();
			
			// Resolve callout type: check if it's a nickname first, then check if it's a callout name
			let calloutType: string | null = null;
			if (input in this.settings.calloutNicknames) {
				calloutType = this.settings.calloutNicknames[input] ?? null;
			} else if (Object.values(this.settings.calloutNicknames).includes(input)) {
				calloutType = input;
			}
			
			// Only expand if we found a valid callout type
			if (calloutType) {
				const triggerStart = cursor.ch - triggerMatch[0].length;
				
				// build callout text
				// const calloutText = `> [!${calloutType}] Title\n> `;
				const calloutText = `> [!${calloutType}] `
				
				// Replace the trigger (including trailing space) with callout
				editor.replaceRange(
					calloutText,
					{ line: cursor.line, ch: triggerStart },
					{ line: cursor.line, ch: cursor.ch }			
				);
				
				// position cursor to where the title should be
				// const titlePosition = triggerStart + `> [!${calloutType}] `.length;
				const titlePosition = triggerStart + calloutText.length;
				editor.setCursor({ line: cursor.line, ch: titlePosition });
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FastCalloutSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private insertCallout(editor: Editor, calloutType: string) {
		const cursor = editor.getCursor();
		const calloutText = `> [!${calloutType}] `;
		editor.replaceRange(calloutText, cursor);
		const newCursor = editor.getCursor();
		editor.setCursor({ line: newCursor.line, ch: newCursor.ch });
	}

	private registerCalloutCommands() {
		// Get all unique callout types
		const calloutTypes = new Set<string>(Object.values(this.settings.calloutNicknames));
		
		// Register commands for each callout type
		for (const calloutType of calloutTypes) {
			this.addCommand({
				id: `insert-callout-${calloutType}`,
				name: `Insert ${calloutType} callout`,
				editorCallback: (editor: Editor) => {
					this.insertCallout(editor, calloutType);
				},
			});
		}
	}
}
