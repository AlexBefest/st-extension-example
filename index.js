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
const defaultSettings = {};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  // Create the settings if they don't exist
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

// This function gets the last message from the chat and sets it in the summary input field
function setLastMessageInSummaryInput() {
  const context = getContext();
  const chat = context.chat;

  if (!chat || chat.length === 0) {
    console.debug('No messages in chat');
    return;
  }

  const lastMessage = chat[chat.length - 1];
  if (lastMessage && lastMessage.mes) {
    $("#summary_input").val(lastMessage.mes).trigger("input");
  } else {
    console.debug('Last message does not contain text');
  }
}

// This function sends the entire chat to the neural network in chunks of 20 messages and sets the response in the summary input field
async function sendEntireChatToNeuralNetwork() {
  const context = getContext();
  const chat = context.chat;

  if (!chat || chat.length === 0) {
    console.debug('No messages in chat');
    return;
  }

  const chunkSize = 20;
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
  $("#summarize_button").on("click", onSummarizeButtonClick);
  $("#summary_input").on("input", onSummaryInput);

  // Load settings when starting things up (if you have any)
  loadSettings();

  // Add a button to get the last message
  const getLastMessageButton = $('<button id="get_last_message_button" class="menu_button">Get Last Message</button>');
  $(".example-extension_block:first").after(getLastMessageButton);

  // Add event listener for the new button
  $("#get_last_message_button").on("click", setLastMessageInSummaryInput);

  // Add a button to send the entire chat to the neural network
  const sendToNeuralNetworkButton = $('<button id="send_to_neural_network_button" class="menu_button">Send Entire Chat to Neural Network</button>');
  getLastMessageButton.after(sendToNeuralNetworkButton);

  // Add event listener for the new button
  $("#send_to_neural_network_button").on("click", sendEntireChatToNeuralNetwork);
});