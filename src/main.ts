import { Editor, MarkdownView, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, FastCalloutSettings, FastCalloutSettingTab } from "./settings";

export default class FastCallout extends Plugin {
	settings: FastCalloutSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FastCalloutSettingTab(this.app, this));

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
			const calloutType = triggerMatch[1].toLowerCase();
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FastCalloutSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
