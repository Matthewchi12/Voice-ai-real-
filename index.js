/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
|
| When frontend and backend are on different domains,
| change this to your Render backend URL.
|
| Example:
|
| const API_URL =
|   "const API_URL = "https://ai-voice-cloned.onrender.com";
|
*/

const API_URL = "http://localhost:5000";


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const voiceFile =
  document.getElementById("voiceFile");

const uploadBox =
  document.getElementById("uploadBox");

const recordButton =
  document.getElementById("recordButton");

const recordingPanel =
  document.getElementById("recordingPanel");

const stopRecording =
  document.getElementById("stopRecording");

const recordTimer =
  document.getElementById("recordTimer");

const audioPreview =
  document.getElementById("audioPreview");

const sampleAudio =
  document.getElementById("sampleAudio");

const voiceName =
  document.getElementById("voiceName");

const cloneButton =
  document.getElementById("cloneButton");

const cloneStatus =
  document.getElementById("cloneStatus");

const textInput =
  document.getElementById("textInput");

const charCount =
  document.getElementById("charCount");

const generateButton =
  document.getElementById("generateButton");

const generateStatus =
  document.getElementById("generateStatus");

const result =
  document.getElementById("result");

const resultAudio =
  document.getElementById("resultAudio");

const downloadButton =
  document.getElementById("downloadButton");

const speedSelect =
  document.getElementById("speedSelect");

const voiceStatusDot =
  document.getElementById("voiceStatusDot");

const voiceStatusText =
  document.getElementById("voiceStatusText");


/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let selectedAudioFile = null;

let clonedVoiceId = null;

let mediaRecorder = null;

let recordedChunks = [];

let recordingInterval = null;

let recordingSeconds = 0;


/*
|--------------------------------------------------------------------------
| FILE SELECTION
|--------------------------------------------------------------------------
*/

voiceFile.addEventListener(
  "change",
  () => {

    const file =
      voiceFile.files[0];

    if (!file) {
      return;
    }

    selectedAudioFile = file;

    showAudioPreview(file);

    cloneStatus.textContent =
      "Voice sample selected.";

  }
);


/*
|--------------------------------------------------------------------------
| SHOW AUDIO PREVIEW
|--------------------------------------------------------------------------
*/

function showAudioPreview(file) {

  const audioURL =
    URL.createObjectURL(file);

  sampleAudio.src =
    audioURL;

  audioPreview.classList.remove(
    "hidden"
  );

}


/*
|--------------------------------------------------------------------------
| RECORD VOICE
|--------------------------------------------------------------------------
*/

recordButton.addEventListener(
  "click",
  async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      recordedChunks = [];

      mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorder.ondataavailable =
        event => {

          if (
            event.data &&
            event.data.size > 0
          ) {

            recordedChunks.push(
              event.data
            );

          }

        };


      mediaRecorder.onstop =
        () => {

          const blob =
            new Blob(
              recordedChunks,
              {
                type: "audio/webm"
              }
            );

          selectedAudioFile =
            new File(
              [blob],
              "recorded-voice.webm",
              {
                type: "audio/webm"
              }
            );

          showAudioPreview(
            selectedAudioFile
          );

          cloneStatus.textContent =
            "Recording ready.";

          stream
            .getTracks()
            .forEach(
              track => track.stop()
            );

        };


      mediaRecorder.start();

      recordingSeconds = 0;

      recordingPanel.classList.remove(
        "hidden"
      );

      recordButton.disabled = true;

      recordingInterval =
        setInterval(
          updateRecordingTimer,
          1000
        );

    } catch (error) {

      alert(
        "Microphone permission was denied or is unavailable."
      );

      console.error(error);

    }

  }
);


/*
|--------------------------------------------------------------------------
| STOP RECORDING
|--------------------------------------------------------------------------
*/

stopRecording.addEventListener(
  "click",
  () => {

    if (
      mediaRecorder &&
      mediaRecorder.state !== "inactive"
    ) {

      mediaRecorder.stop();

    }

    clearInterval(
      recordingInterval
    );

    recordingPanel.classList.add(
      "hidden"
    );

    recordButton.disabled = false;

  }
);


/*
|--------------------------------------------------------------------------
| RECORDING TIMER
|--------------------------------------------------------------------------
*/

function updateRecordingTimer() {

  recordingSeconds++;

  const minutes =
    Math.floor(
      recordingSeconds / 60
    );

  const seconds =
    recordingSeconds % 60;

  recordTimer.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


/*
|--------------------------------------------------------------------------
| CREATE VOICE CLONE
|--------------------------------------------------------------------------
*/

cloneButton.addEventListener(
  "click",
  async () => {

    if (!selectedAudioFile) {

      cloneStatus.textContent =
        "Please upload or record a voice sample.";

      return;

    }


    cloneButton.disabled = true;

    cloneButton.textContent =
      "Creating voice...";

    cloneStatus.textContent =
      "Uploading your sample to Fish Audio...";


    try {

      const formData =
        new FormData();

      formData.append(
        "voice",
        selectedAudioFile
      );

      formData.append(
        "name",
        voiceName.value.trim() ||
        "My Voice"
      );


      const response =
        await fetch(
          `${API_URL}/api/clone`,
          {
            method: "POST",
            body: formData
          }
        );


      const data =
        await readResponse(response);


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Voice cloning failed."
        );

      }


      clonedVoiceId =
        data.voiceId;


      voiceStatusDot.classList.remove(
        "offline"
      );

      voiceStatusText.textContent =
        "Voice clone ready";


      generateButton.disabled =
        false;


      cloneStatus.textContent =
        "✓ Voice clone created successfully.";

      cloneStatus.style.color =
        "#6ee7a0";

    } catch (error) {

      console.error(error);

      cloneStatus.textContent =
        error.message;

      cloneStatus.style.color =
        "#ff8b8b";

    } finally {

      cloneButton.disabled = false;

      cloneButton.textContent =
        "Create Voice Clone";

    }

  }
);


/*
|--------------------------------------------------------------------------
| TEXT COUNTER
|--------------------------------------------------------------------------
*/

textInput.addEventListener(
  "input",
  () => {

    charCount.textContent =
      textInput.value.length;

  }
);


/*
|--------------------------------------------------------------------------
| GENERATE SPEECH
|--------------------------------------------------------------------------
*/

generateButton.addEventListener(
  "click",
  async () => {

    const text =
      textInput.value.trim();


    if (!clonedVoiceId) {

      generateStatus.textContent =
        "Create a voice clone first.";

      return;

    }


    if (!text) {

      generateStatus.textContent =
        "Please enter some text.";

      return;

    }


    generateButton.disabled =
      true;

    generateButton.textContent =
      "Generating...";

    generateStatus.textContent =
      "Fish Audio is generating your voice...";

    result.classList.add(
      "hidden"
    );


    try {

      const response =
        await fetch(
          `${API_URL}/api/generate`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              text,
              voiceId:
                clonedVoiceId,
              speed:
                Number(
                  speedSelect.value
                )
            })
          }
        );


      if (!response.ok) {

        const data =
          await readResponse(
            response
          );

        throw new Error(
          data.message ||
          "Speech generation failed."
        );

      }


      const audioBlob =
        await response.blob();


      const audioURL =
        URL.createObjectURL(
          audioBlob
        );


      resultAudio.src =
        audioURL;


      downloadButton.href =
        audioURL;


      downloadButton.download =
        "voiceclone.mp3";


      result.classList.remove(
        "hidden"
      );


      generateStatus.textContent =
        "✓ Speech generated successfully.";

      generateStatus.style.color =
        "#6ee7a0";


      resultAudio.play().catch(
        () => {}
      );

    } catch (error) {

      console.error(error);

      generateStatus.textContent =
        error.message;

      generateStatus.style.color =
        "#ff8b8b";

    } finally {

      generateButton.disabled =
        false;

      generateButton.textContent =
        "Generate Voice";

    }

  }
);


/*
|--------------------------------------------------------------------------
| RESPONSE HELPER
|--------------------------------------------------------------------------
*/

async function readResponse(
  response
) {

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  if (
    contentType.includes(
      "application/json"
    )
  ) {

    return await response.json();

  }


  const text =
    await response.text();


  return {
    message: text
  };

}
