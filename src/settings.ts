import { App, PluginSettingTab, Setting } from "obsidian";
import FastCallout from "./main";

export interface FastCalloutSettings {
	triggerPrefix: string;
}

export const DEFAULT_SETTINGS: FastCalloutSettings = {
	triggerPrefix: '@'
}

export class FastCalloutSettingTab extends PluginSettingTab {
	plugin: FastCallout;

	constructor(app: App, plugin: FastCallout) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Customization')
			.setHeading();

		new Setting(containerEl)
			.setName('Trigger prefix')
			.setDesc('The character(s) that trigger callout replacement (e.g., "@" for @definition)')
			.addText(text => text
				.setPlaceholder('@')
				.setValue(this.plugin.settings.triggerPrefix)
				.onChange(async (value) => {
					this.plugin.settings.triggerPrefix = value;
					await this.plugin.saveSettings();
				}));
	}
}
