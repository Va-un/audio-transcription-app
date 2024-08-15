import React from 'react';
import AudioUploader from './AudioUploader';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Audio Transcription App</h1>
        <AudioUploader />
      </header>
    </div>
  );
}

export default App;