(function () {
  "use strict";

  const CONFIG = {
    API_URL: "/api/voice-nav",
    DEFAULT_POSITION: "bottom-right",
  };

  function createMicSvg() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
  }

  function createStopSvg() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>';
  }

  function getOrganizationIdAndPosition() {
    const script = document.currentScript;
    let organizationId = null;
    let position = CONFIG.DEFAULT_POSITION;

    if (script) {
      organizationId = script.getAttribute("data-organization-id");
      position = script.getAttribute("data-position") || CONFIG.DEFAULT_POSITION;
    }

    return { organizationId, position };
  }

  function createButton(position, onClick) {
    const button = document.createElement("button");
    button.id = "santra-voice-nav-button";
    button.innerHTML = createMicSvg();
    button.style.cssText = `
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #10b981;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(16, 185, 129, 0.35);
      transition: all 0.2s ease;
    `;

    button.addEventListener("click", onClick);
    button.addEventListener("mouseenter", function () {
      button.style.transform = "scale(1.05)";
    });
    button.addEventListener("mouseleave", function () {
      button.style.transform = "scale(1)";
    });

    document.body.appendChild(button);
    return button;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  function startRecognition(language, onResult, onEnd, onError) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError && onError(new Error("SpeechRecognition not supported"));
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      onResult && onResult(transcript);
    };

    recognition.onerror = function (event) {
      onError && onError(new Error(event.error || "Recognition error"));
    };

    recognition.onend = function () {
      onEnd && onEnd();
    };

    recognition.start();
    return recognition;
  }

  function sendVoiceNavRequest(organizationId, text, language) {
    return fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, text, language }),
    }).then(function (res) {
      if (!res.ok) {
        throw new Error("Request failed with status " + res.status);
      }
      return res.json();
    });
  }

  function handleActions(interpretResult, executeResult) {
    if (!interpretResult || !Array.isArray(interpretResult.actions)) return;

    interpretResult.actions.forEach(function (action) {
      var type = action.type;
      var params = action.params || {};

      // For front-end actions, just dispatch a DOM event.
      window.dispatchEvent(
        new CustomEvent("santra:voiceAction", {
          detail: {
            action: type,
            params: params,
            interpret: interpretResult,
            execute: executeResult,
          },
        })
      );
    });
  }

  function init() {
    var info = getOrganizationIdAndPosition();
    var organizationId = info.organizationId;
    var position = info.position;

    if (!organizationId) {
      console.error("Santra VoiceNav: data-organization-id is required");
      return;
    }

    var isListening = false;
    var recognition = null;
    var button = createButton(position, function () {
      if (isListening) {
        if (recognition) recognition.stop();
        return;
      }

      // Start listening
      isListening = true;
      button.innerHTML = createStopSvg();

      recognition = startRecognition(null, function (text) {
        sendVoiceNavRequest(organizationId, text, null)
          .then(function (data) {
            if (data && data.interpret && data.interpret.response) {
              speak(data.interpret.response);
            }
            handleActions(data.interpret, data.execute);
          })
          .catch(function (err) {
            console.error("Santra VoiceNav error", err);
          });
      }, function () {
        // onEnd
        isListening = false;
        button.innerHTML = createMicSvg();
      }, function () {
        // onError
        isListening = false;
        button.innerHTML = createMicSvg();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
