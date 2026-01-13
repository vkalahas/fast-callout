import { App, PluginSettingTab, Setting } from "obsidian";
import FastCallout from "./main";

export interface FastCalloutSettings {
	triggerPrefix: string;
	calloutNicknames: Record<string, string>;
}

export const DEFAULT_SETTINGS: FastCalloutSettings = {
	triggerPrefix: '@',
	calloutNicknames: {
		"not": "note",
		"abs": "abstract",
		"inf": "info",
		"tod": "todo",
		"tip": "tip",
		"suc": "success",
		"q": "question",
		"war": "warning",
		"fai": "failure",
		"dan": "danger",
		"bug": "bug",
		"ex": "example",
		"quo": "quote"
	}
}

export class FastCalloutSettingTab extends PluginSettingTab {
	plugin: FastCallout;
	private errorMessageEl: HTMLElement | null = null;

	constructor(app: App, plugin: FastCallout) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private isValidCalloutNicknames(value: unknown): value is Record<string, string> {
		return (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value) &&
			Object.values(value).every(v => typeof v === 'string')
		);
	}

	private async handleNicknamesChange(
		text: { inputEl: HTMLElement },
		value: string
	): Promise<void> {
		try {
			const parsed = JSON.parse(value) as unknown;
			
			if (this.isValidCalloutNicknames(parsed)) {
				this.plugin.settings.calloutNicknames = parsed;
				await this.plugin.saveSettings();
				text.inputEl.removeClass('mod-error');
				this.hideError();
				return;
			}
		} catch (error) {
			// Invalid JSON - show error message
			const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
			this.showError(errorMessage);
			text.inputEl.addClass('mod-error');
			return;
		}
		
		// Invalid format (not a valid callout nicknames object)
		this.showError('Invalid format: must be an object with string values');
		text.inputEl.addClass('mod-error');
	}

	private showError(message: string): void {
		if (this.errorMessageEl) {
			this.errorMessageEl.textContent = message;
			this.errorMessageEl.removeClass('fast-callout-error-hidden');
		}
	}

	private hideError(): void {
		if (this.errorMessageEl) {
			this.errorMessageEl.addClass('fast-callout-error-hidden');
		}
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Customization')
			.setHeading();

		new Setting(containerEl)
			.setName('Trigger prefix')
			.setDesc('The character that triggers callout replacement (e.g., "@" for "@definition")')
			.addDropdown(dropdown => dropdown
				.addOption('@', '@')
				.addOption(';', ';')
				.addOption('!', '!')
				.setValue(this.plugin.settings.triggerPrefix)
				.onChange(async (value) => {
					this.plugin.settings.triggerPrefix = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Callout nicknames')
			.setDesc('Map of nickname shortcuts to callout types (JSON format: {"nickname": "callout-type"})')
			.addTextArea(text => {
				text
					.setPlaceholder('{"not": "note", "abs": "abstract", ...}')
					.setValue(JSON.stringify(this.plugin.settings.calloutNicknames, null, 2))
					.onChange(async (value) => {
						void this.handleNicknamesChange(text, value);
					});
				text.inputEl.rows = 10;
				text.inputEl.addClass('font-mono');
			});

		// error message
		this.errorMessageEl = containerEl.createDiv({
			cls: 'fast-callout-error-message fast-callout-error-hidden',
			text: '',
		});
	}
}
