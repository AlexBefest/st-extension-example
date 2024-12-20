// The main script for the extension
// The following are examples of some basic extension functionality

// You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

// You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, generateRaw } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name .
const extensionName = "st-extension-example";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    chunkSize: 20,
    summaryPrompt: "[Pause your roleplay. Summarize the most important facts and events that have happened in the chat so far. Your response should include nothing but the summary. Don't repeat the characters' actions and lines, just talk in general terms. Talk about events in the past tense only. ANY COMMENTS AND INVENTATION OF NON-EXISTENT THINGS ARE PROHIBITED. JUST MAKE A DETAILED REPRESENTATION, SUMMARY THE INFORMATION. THE SUMMARY SHOULD BE AT LEAST TWO THOUSAND WORDS]",
};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  // Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // Updating settings in the UI
  $("#summary_prompt_input").val(extension_settings[extensionName].summaryPrompt).trigger("input");
  $("#summary_input").val(extension_settings[extensionName].summary_input).trigger("input");
  $("#chunk_size_slider").val(extension_settings[extensionName].chunkSize).trigger("input");
  $("#chunk_size_value").text(extension_settings[extensionName].chunkSize);
}

// This function is called when the summary prompt input is changed in the UI
function onSummaryPromptInput(event) {
  const value = $(event.target).val();
  extension_settings[extensionName].summaryPrompt = value;
  saveSettingsDebounced();
}

// This function is called when the summary input is changed in the UI
function onSummaryInput(event) {
  const value = $(event.target).val();
  extension_settings[extensionName].summary_input = value;
  saveSettingsDebounced();
}

// This function is called when the chunk size slider is changed
function onChunkSizeChange(event) {
  const value = parseInt($(event.target).val());
  extension_settings[extensionName].chunkSize = value;
  $("#chunk_size_value").text(value);
  saveSettingsDebounced();
}

// This function sends the entire chat to the neural network in chunks of specified size and sets the response in the summary input field
async function sendEntireChatToNeuralNetwork() {
  const context = getContext();
  const chat = context.chat;

  if (!chat || chat.length === 0) {
    console.debug('No messages in chat');
    return;
  }

  const chunkSize = extension_settings[extensionName].chunkSize;
  const summaryPrompt = extension_settings[extensionName].summaryPrompt;
  let summaries = [];

  for (let i = 0; i < chat.length; i += chunkSize) {
    const chunk = chat.slice(i, i + chunkSize);
    const prompt = chunk.map(msg => msg.mes).join("\n\n") + "\n\n" + summaryPrompt; // Изменение здесь

    // Show notification before processing each chunk
    toastr.info(`Processing chunk ${i / chunkSize + 1} of ${Math.ceil(chat.length / chunkSize)}`, 'Starting processing');

    try {
      const summary = await generateRaw(prompt, '', false, false, '', extension_settings.memory.overrideResponseLength);
      if (summary) {
        summaries.push(summary);
      } else {
        console.warn('Empty summary received for chunk', i);
        toastr.warning('Empty summary received for chunk', 'Empty summary received for chunk');
      }
    } catch (error) {
      console.error('Error summarizing message:', error);
      toastr.error(String(error), 'Error summarizing message');
    }
  }

  const finalSummary = summaries.join("\n\n");
  $("#summary_input").val(finalSummary).trigger("input");
}

// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related 
  $("#extensions_settings").append(settingsHtml);

  // These are examples of listening for events
  $("#summary_prompt_input").on("input", onSummaryPromptInput);
  $("#summary_input").on("input", onSummaryInput);
  $("#chunk_size_slider").on("input", onChunkSizeChange);
  $("#send_to_neural_network_button").on("click", sendEntireChatToNeuralNetwork);

  // Load settings when starting things up (if you have any)
  loadSettings();
});
