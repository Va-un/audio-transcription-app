import React, { useState } from 'react';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

function FileUploader() {
  const [file, setFile] = useState(null);
  const [content, setContent] = useState('');
  const [isAudioOrVideo, setIsAudioOrVideo] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setIsAudioOrVideo(selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/'));
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    if (isAudioOrVideo) {
      await handleAudioVideoUpload();
    } else {
      await handleTextFileUpload();
    }
  };

  const handleAudioVideoUpload = async () => {
    // First, upload the file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'api'
      },
      body: file
    });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.upload_url;

      // Now, submit the audio file for transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': 'api',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: true
        })
      });

      if (transcriptResponse.ok) {
        const transcriptResult = await transcriptResponse.json();

        // Poll for the transcription result
        const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptResult.id}`;
        while (true) {
          const pollingResponse = await fetch(pollingEndpoint, {
            headers: {
              'Authorization': 'api'
            }
          });
          const result = await pollingResponse.json();

          if (result.status === 'completed') {
            setContent(result);
            break;
          } else if (result.status === 'error') {
            console.error('Transcription error:', result.error);
            break;
          } else {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
    }
  };

  const handleTextFileUpload = async () => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      setContent(text);
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="audio/*,video/*,.pdf,.txt,.doc,.docx" />
      <button onClick={handleUpload}>Upload and Process</button>
      {content && (
        <div>
          <h3>Content:</h3>
          {isAudioOrVideo ? (
            content.utterances.map((utterance, index) => (
              <p key={index}>
                <strong>
                  TimeSteps: {formatTimestamp(utterance.start)} - {formatTimestamp(utterance.end)} Speaker {utterance.speaker}:
                </strong>
                {utterance.text}
              </p>
            ))
          ) : (
            <pre>{content}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUploader;