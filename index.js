import { extension_settings, getContext, saveSettingsDebounced } from "../../../extensions.js";
import { generateRaw } from "../../../../script.js";

const extensionName = "my-summary-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    prompt: "Ignore previous instructions. Summarize the most important facts and events in the story so far. Limit the summary to {{words}} words or less. Your response should include nothing but the summary.",
    words: 200,
};

function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    $("#my_summary_prompt").val(extension_settings[extensionName].prompt).trigger("input");
    $("#my_summary_words").val(extension_settings[extensionName].words).trigger("input");
    $("#my_summary_words_value").text(extension_settings[extensionName].words);
}

function onSummaryPromptInput(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].prompt = value;
    saveSettingsDebounced();
}

function onSummaryWordsInput(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].words = Number(value);
    $("#my_summary_words_value").text(extension_settings[extensionName].words);
    saveSettingsDebounced();
}

async function forceSummarizeChat() {
    const context = getContext();
    const chat = context.chat;

    if (!context.chatId) {
        toastr.warning('No chat selected');
        return '';
    }

    const toast = toastr.info('Summarizing chat...', 'Please wait', { timeOut: 0, extendedTimeOut: 0 });
    const prompt = substituteParamsExtended(extension_settings[extensionName].prompt, { words: extension_settings[extensionName].words });

    try {
        const summary = await generateRaw(chat.map(m => m.mes).join('\n'), '', false, false, prompt);
        $("#my_summary_contents").val(summary);
        toastr.clear(toast);
    } catch (error) {
        toastr.error(String(error), 'Failed to summarize text');
        console.log(error);
        toastr.clear(toast);
    }
}

function setupListeners() {
    $("#my_summary_prompt").off('input').on('input', onSummaryPromptInput);
    $("#my_summary_words").off('input').on('input', onSummaryWordsInput);
    $("#my_summary_force_summarize").off('click').on('click', forceSummarizeChat);
}

jQuery(async () => {
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings").append(settingsHtml);
    setupListeners();
    loadSettings();
});

function substituteParamsExtended(template, params) {
    for (const [key, value] of Object.entries(params)) {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return template;
}