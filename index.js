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
};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  // Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // Updating settings in the UI
  $("#summary_input").val(extension_settings[extensionName].summary_input).trigger("input");
  $("#chunk_size_slider").val(extension_settings[extensionName].chunkSize).trigger("input");
  $("#chunk_size_value").text(extension_settings[extensionName].chunkSize);
}

// This function is called when the extension settings are changed in the UI
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
  let summaries = [];

  for (let i = 0; i < chat.length; i += chunkSize) {
    const chunk = chat.slice(i, i + chunkSize);
    const prompt = "Summarize the following messages:\n\n" + chunk.map(msg => msg.mes).join("\n\n");

    try {
      const summary = await generateRaw(prompt, '', false, false, '', extension_settings.memory.overrideResponseLength);
      if (summary) {
        summaries.push(summary);
      } else {
        console.warn('Empty summary received for chunk', i);
        toastr.warning('Empty summary received for chunk', 'Failed to summarize message');
      }
    } catch (error) {
      console.error('Error summarizing message:', error);
      toastr.error(String(error), 'Failed to summarize message');
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
  $("#summary_input").on("input", onSummaryInput);
  $("#chunk_size_slider").on("input", onChunkSizeChange);
  $("#send_to_neural_network_button").on("click", sendEntireChatToNeuralNetwork);

  // Load settings when starting things up (if you have any)
  loadSettings();
});