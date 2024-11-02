document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('settings-form');
  var status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['airtableApiKey', 'airtableBaseId', 'airtableTableName'], function(items) {
    document.getElementById('airtable-api-key').value = items.airtableApiKey || '';
    document.getElementById('airtable-base-id').value = items.airtableBaseId || '';
    document.getElementById('airtable-table-name').value = items.airtableTableName || '';
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    var apiKey = document.getElementById('airtable-api-key').value;
    var baseId = document.getElementById('airtable-base-id').value;
    var tableName = document.getElementById('airtable-table-name').value;

    chrome.storage.sync.set({
      airtableApiKey: apiKey,
      airtableBaseId: baseId,
      airtableTableName: tableName
    }, function() {
      status.textContent = 'Settings saved successfully!';
      setTimeout(function() {
        status.textContent = '';
      }, 3000);
    });
  });
});
