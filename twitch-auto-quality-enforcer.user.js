// ==UserScript==
// @name            Twitch Auto-Quality Enforcer
// @description     Automatically optimizes Twitch stream quality based on your preferences, with intelligent fallback to ensure uninterrupted viewing
// @namespace       https://github.com/ShubhmDalvi/Twitch-Auto-Quality-Enforcer
// @version         1.0.0
// @author          shubhmdalvi
// @homepageURL     https://github.com/ShubhmDalvi/Twitch-Auto-Quality-Enforcer
// @icon            https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// @license         MIT
// @match           https://www.twitch.tv/*
// @match           https://player.twitch.tv/*
// @grant           none
// @run-at          document-end
// ==/UserScript==

(function () {
    'use strict';

    // Set the desired auto-quality.
    /* Available Quality Options (from highest to lowest):
       - 1080p60
       - 936p60
       - 720p60
       - 720p
       - 480p
       - 360p
       - 160p
    */
    const PreferedQuality = "1080p60"; // Change this to your Prefered Quality

    const AllQuality = ["1080p60", "936p60", "720p60", "720p", "480p", "360p", "160p"];
    const PreferredIndex = AllQuality.indexOf(PreferedQuality);

    let qualityApplied = false;
    let currentStreamUrl = '';

    // Function to check if we're on a new stream
    function checkForStreamChange() {
        const newStreamUrl = window.location.href;
        if (newStreamUrl !== currentStreamUrl) {
            currentStreamUrl = newStreamUrl;
            qualityApplied = false; // Reset flag so we apply quality to new stream
            console.log('Detected stream change, will apply quality preferences');
        }
    }

    // Monitor for URL changes (stream changes)
    function monitorUrlChanges() {
        let oldHref = document.location.href;
        const body = document.querySelector("body");
        const observer = new MutationObserver(mutations => {
            if (oldHref !== document.location.href) {
                oldHref = document.location.href;
                checkForStreamChange();
            }
        });
        observer.observe(body, { childList: true, subtree: true });
    }

    // A function that waits for an element to exist in the DOM and then executes a callback function.
    function waitForElement(selector, maxAttempts = 10, callback) {
        let attempts = 0;
        const intervalId = setInterval(function () {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(intervalId);
                callback(element);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    console.warn('Element ' + selector + ' not found after ' + maxAttempts + ' attempts');
                }
            }
        }, 500);
    }

    // Main function to set quality
    function setQuality() {
        if (qualityApplied) return; // Don't apply quality multiple times

        // Check if the channel is live or offline.
        if (document.querySelector('.tw-channel-status-text-indicator')?.textContent === "LIVE" ||
            document.querySelector('.channel-status-info')?.textContent === "Offline" ||
            document.querySelector('.live-time') || // Additional check for live indicator
            document.querySelector('[data-a-target="video-player"]')) { // Check if video player exists

            console.warn("Setting quality for stream...");

            let settingsButton = null;
            let settingsMenuButton = null;

            // Click the settings button.
            waitForElement('[data-a-target="player-settings-button"]', 25, function (element) {
                settingsButton = element;
                settingsButton.click();

                // Click the quality settings button.
                waitForElement('[data-a-target="player-settings-menu-item-quality"]', 25, function (element) {
                    settingsMenuButton = element;
                    settingsMenuButton.click();

                    // Wait for the quality options to load and select the preferred quality option.
                    waitForElement('[data-a-target="tw-radio"]', 25, function (element) {
                        const inputs = document.querySelectorAll('input[type="radio"]');
                        let qualitySelected = false;

                        // 1. FIRST, TRY TO FIND THE PREFERRED QUALITY
                        for (let i = 0; i < inputs.length; i++) {
                            const label = inputs[i].parentNode.querySelector('label');
                            if (label && label.textContent.trim().includes(PreferedQuality)) {
                                inputs[i].checked = true;
                                inputs[i].click();
                                console.warn("Preferred Quality Selected: " + PreferedQuality);
                                qualitySelected = true;
                                qualityApplied = true; // Mark as applied
                                break; // Exit the loop once we found and clicked it
                            }
                        }

                        // 2. IF PREFERRED NOT FOUND, FALL BACK TO THE NEXT HIGHEST QUALITIES
                        if (!qualitySelected) {
                            console.warn(PreferedQuality + " not available. Finding next highest quality...");

                            // Start from the preferred index and go DOWN the list (to lower indices = higher quality)
                            for (let qIndex = PreferredIndex + 1; qIndex < AllQuality.length; qIndex++) {
                                let fallbackQuality = AllQuality[qIndex];
                                let foundThisQuality = false;

                                // Check if this fallback quality exists in the menu
                                for (let i = 0; i < inputs.length; i++) {
                                    const label = inputs[i].parentNode.querySelector('label');
                                    if (label && label.textContent.trim().includes(fallbackQuality)) {
                                        inputs[i].checked = true;
                                        inputs[i].click();
                                        console.warn("Fell back to next highest quality: " + fallbackQuality);
                                        qualitySelected = true;
                                        qualityApplied = true; // Mark as applied
                                        foundThisQuality = true;
                                        break;
                                    }
                                }
                                if (foundThisQuality) break; // Exit the quality search loop if we found one
                            }
                        }

                        // 3. IF NO HIGHER QUALITY IS FOUND, FALL BACK TO THE ABSOLUTE LOWEST (last option)
                        if (!qualitySelected) {
                            console.warn("No high qualities found. Falling back to lowest available.");
                            // The lowest option is usually the last one in the menu
                            let lastInputIndex = inputs.length - 1;
                            if (inputs[lastInputIndex]) {
                                inputs[lastInputIndex].checked = true;
                                inputs[lastInputIndex].click();
                                console.warn("Quality Used: " + inputs[lastInputIndex].parentNode.querySelector('label').textContent);
                                qualityApplied = true; // Mark as applied
                            }
                        }

                        // Click the settings button again to close the menu.
                        setTimeout(function() {
                            const settingsBtn = document.querySelector('[data-a-target="player-settings-button"]');
                            if (settingsBtn) {
                                settingsBtn.click();
                                console.warn("Clicked Settings Button to close menu");
                            }
                        }, 500);
                    });
                });
            });
        } else {
            console.warn("Can't detect whether Channel is live or offline.");
            // Try again in a bit
            setTimeout(setQuality, 2000);
        }
    }

    // Initialize
    function init() {
        currentStreamUrl = window.location.href;
        monitorUrlChanges();

        // Check for player periodically and set quality
        const checkInterval = setInterval(function() {
            if (!qualityApplied) {
                const player = document.querySelector('[data-a-target="video-player"]');
                if (player) {
                    setQuality();
                }
            }
        }, 3000);

        // Also set quality when mutations are detected in the DOM (stream changes)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (!qualityApplied && mutation.addedNodes.length > 0) {
                    // Check if video player was added
                    for (let node of mutation.addedNodes) {
                        if (node.querySelector && node.querySelector('[data-a-target="video-player"]')) {
                            setTimeout(setQuality, 1000);
                            break;
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start the script
    init();
})();