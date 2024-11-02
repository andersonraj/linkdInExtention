chrome.runtime.onInstalled.addListener(() => {
  console.log("LinkedIn Contact Manager Extension Installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
if (request.action === "openOptionsPage") {
  chrome.runtime.openOptionsPage();
}
});
