// Add this at the beginning of your content.js file
const style = document.createElement('style');
style.textContent = `
  .airtable-popup {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 16px;
    border-radius: 4px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.5s;
  }

  .edit-popup {
    position: absolute;
    top: 50px;
    right: 10px;
    background-color: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10001;
    width: 300px;
    font-size: 14px;
  }

  .edit-popup input, .edit-popup textarea {
    width: 100%;
    padding: 6px;
    margin: 3px 0 10px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
  }

  .edit-popup textarea {
    height: 80px;
    resize: vertical;
  }

  .edit-popup h2 {
    font-size: 16px;
    margin: 0 0 10px 0;
  }

  .edit-popup .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }

  .edit-popup button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }

  .edit-popup .save-btn {
    background-color: #0073b1;
    color: white;
  }

  .edit-popup .cancel-btn {
    background-color: #e0e0e0;
  }
`;
document.head.appendChild(style);

// This script will run on LinkedIn profile pages
console.log("LinkedIn Contact Manager is active");

function addOverlayButton() {
    const button = document.createElement("button");
    button.textContent = "Add to Airtable";
    button.style.position = "fixed";
    button.style.top = "10px";
    button.style.right = "10px";
    button.style.padding = "10px";
    button.style.backgroundColor = "#0073b1";  // LinkedIn blue color
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.zIndex = "1000";

    // Create a container for the button and popup
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.right = "0";
    container.style.zIndex = "999";
    container.appendChild(button);
    
    document.body.appendChild(container);

    button.addEventListener("click", () => {
        console.log("Button clicked! Scraping profile...");
        const profileData = scrapeLinkedInProfile();
        showEditPopup(profileData, container);
    });
}

// Wait until the DOM is fully loaded
window.addEventListener("load", () => {
    if (window.location.hostname.includes("linkedin.com")) {
      addOverlayButton();
    }
});

function scrapeLinkedInProfile() {
    console.log("Starting profile scrape...");

    // Updated name selectors with multiple fallbacks
    let name = "Not Available";
    const nameSelectors = [
        "h1.text-heading-xlarge",
        "h1.inline.t-24.t-black.t-normal.break-words",
        ".pv-text-details__left-panel h1",
        "div.ph5.pb5 > div.mt2 h1",
        // Add the universal LinkedIn profile name selector
        "[data-generated-suggestion-target='urn:li:fsu_profileActionDelegate:'] h1"
    ];

    for (let selector of nameSelectors) {
        const nameElement = document.querySelector(selector);
        if (nameElement) {
            name = nameElement.innerText.trim();
            if (name && name !== "Not Available") {
                console.log("Name found with selector:", selector);
                break;
            }
        }
    }
    console.log("Name scraped:", name);

    const location = document.querySelector("span.text-body-small.inline.t-black--light.break-words")?.innerText.trim() || "Not Available";
    console.log("Location scraped:", location);

    const company = document.querySelector("div.inline-show-more-text--is-collapsed-with-line-clamp")?.innerText.trim() || "Not Available";
    console.log("Company scraped:", company);

    const jobTitle = document.querySelector("div.text-body-medium.break-words")?.innerText.trim() || "Not Available";
    console.log("Job Title scraped:", jobTitle);

    // Updated bio scraping
    let bio = "Not Available";
    const bioSelectors = [
        // Original selector
        "#about + div + div .display-flex span",
        // Additional selectors
        "section.pv-about-section div.pv-shared-text-with-see-more > div > span",
        "section[data-section='summary'] div.inline-show-more-text",
        "div.display-flex.ph5.pv3 > div > div > div > span",
        "div[data-generated-suggestion-target='urn:li:fsu_profileActionDelegate:-1'] > span"
    ];

    for (let selector of bioSelectors) {
        const bioElement = document.querySelector(selector);
        if (bioElement) {
            bio = bioElement.innerText.trim();
            if (bio && bio !== "Not Available") {
                console.log("Bio found with selector:", selector);
                break;
            }
        }
    }

    console.log("Bio scraped:", bio.substring(0, 50) + "...");

    const profileUrl = window.location.href;
    console.log("Profile URL:", profileUrl);

    return { name, location, company, jobTitle, bio, profileUrl };
}

// Add this function to send data to Airtable
function sendToAirtable(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['airtableApiKey', 'airtableBaseId', 'airtableTableName'], function(result) {
      if (!result.airtableApiKey || !result.airtableBaseId || !result.airtableTableName) {
        // Settings not found, open the options page
        chrome.runtime.sendMessage({action: "openOptionsPage"});
        reject('Airtable settings not configured');
        return;
      }

      const url = `https://api.airtable.com/v0/${result.airtableBaseId}/${result.airtableTableName}`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${result.airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Name': data.name,
            'Location': data.location,
            'Company': data.company,
            'Job Title': data.jobTitle,
            'Bio': data.bio,
            'LinkedIn URL': data.profileUrl
          }
        })
      })
      .then(response => response.json())
      .then(result => {
        console.log('Success:', result);
        resolve(result);
      })
      .catch(error => {
        console.error('Error:', error);
        reject(error);
      });
    });
  });
}

function showPopup(message, type = 'success') {
  const popup = document.createElement('div');
  popup.className = 'airtable-popup';
  popup.textContent = message;
  popup.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
  document.body.appendChild(popup);

  // Trigger reflow
  popup.offsetHeight;

  // Make popup visible
  popup.style.opacity = '1';

  // Hide popup after 3 seconds
  setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 500);
  }, 3000);
}

function showEditPopup(data, container) {
    // Remove any existing popup
    const existingPopup = container.querySelector('.edit-popup');
    if (existingPopup) {
        container.removeChild(existingPopup);
    }

    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    
    popup.innerHTML = `
        <h2>Edit Profile Data</h2>
        <div>
            <label for="name">Name:</label>
            <input type="text" id="name" value="${data.name}">
        </div>
        <div>
            <label for="location">Location:</label>
            <input type="text" id="location" value="${data.location}">
        </div>
        <div>
            <label for="company">Company:</label>
            <input type="text" id="company" value="${data.company}">
        </div>
        <div>
            <label for="jobTitle">Job Title:</label>
            <input type="text" id="jobTitle" value="${data.jobTitle}">
        </div>
        <div>
            <label for="bio">Bio:</label>
            <textarea id="bio">${data.bio}</textarea>
        </div>
        <div>
            <label for="profileUrl">Profile URL:</label>
            <input type="text" id="profileUrl" value="${data.profileUrl}" readonly>
        </div>
        <div class="buttons">
            <button class="cancel-btn">Cancel</button>
            <button class="save-btn">Add to Airtable</button>
        </div>
    `;

    container.appendChild(popup);

    // Handle cancel button
    popup.querySelector('.cancel-btn').addEventListener('click', () => {
        container.removeChild(popup);
    });

    // Handle save button
    popup.querySelector('.save-btn').addEventListener('click', () => {
        const updatedData = {
            name: popup.querySelector('#name').value,
            location: popup.querySelector('#location').value,
            company: popup.querySelector('#company').value,
            jobTitle: popup.querySelector('#jobTitle').value,
            bio: popup.querySelector('#bio').value,
            profileUrl: popup.querySelector('#profileUrl').value
        };

        sendToAirtable(updatedData)
            .then(() => {
                container.removeChild(popup);
                showPopup('Profile successfully added to Airtable!', 'success');
            })
            .catch((error) => {
                console.error('Error:', error);
                if (error === 'Airtable settings not configured') {
                    showPopup('Please configure Airtable settings in the options page', 'error');
                } else {
                    showPopup('Error: Failed to add profile to Airtable', 'error');
                }
            });
    });
}
