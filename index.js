// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "st-extension-example";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};


// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // Updating settings in the UI
  $("#summary_input").val(extension_settings[extensionName].summary_input).trigger("input");
}

// This function is called when the extension settings are changed in the UI
function onSummaryInput(event) {
  const value = $(event.target).val();
  extension_settings[extensionName].summary_input = value;
  saveSettingsDebounced();
}

// This function is called when the button is clicked
function onSummarizeButtonClick() {
  // You can do whatever you want here
  // Let's make a popup appear with the summary text
  const summaryText = $("#summary_input").val();
  toastr.info(
    `Summary: ${summaryText}`,
    "A popup appeared because you clicked the Summarize button!!!!"
  );
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
  $("#summarize_button").on("click", onSummarizeButtonClick);
  $("#summary_input").on("input", onSummaryInput);

  // Load settings when starting things up (if you have any)
  loadSettings();
});