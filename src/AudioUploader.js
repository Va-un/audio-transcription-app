import React, { useState } from 'react';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

function AudioUploader() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    // First, upload the file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'API'
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
          'Authorization': 'API',
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
              'Authorization': 'API'
            }
          });
          const result = await pollingResponse.json();

          if (result.status === 'completed') {
            setTranscription(result);
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

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="audio/*" />
      <button onClick={handleUpload}>Upload and Transcribe</button>
      {transcription && (
  <div>
    <h3>Transcription:</h3>
    {transcription.utterances.map((utterance, index) => (
    <p key={index}>
      <strong>
        TimeSteps: {formatTimestamp(utterance.start)} - {formatTimestamp(utterance.end)} Speaker {utterance.speaker}:
      </strong> 
      {utterance.text}
    </p>
))}
  </div>
)}
    </div>
  );
}

export default AudioUploader;