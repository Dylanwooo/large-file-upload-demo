import React, {useState} from 'react';
import {xhrSend} from './api';
import './App.css';

const CHUNK_SIZE = 2 * 1024 * 1024;

function App() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const onFileChange = e => {
    const [file] = e.target.files;
    setFile(file);
  };

  const createFileChunks = () => {
    let chunks = [];
    if (file.size > CHUNK_SIZE) {
      // split file into chunks
      let start = 0,
        end = 0;
      while (true) {
        end += CHUNK_SIZE;
        let fileBlob = file.slice(start, end);
        start += CHUNK_SIZE;

        if (!fileBlob.size) break;

        chunks.push(fileBlob);
      }
    } else {
      chunks.push(file.slice(0));
    }

    return chunks;
  };

  const onSubmitFile = () => {
    let sendChunkCount = 0;
    if (!file) {
      alert('please upload file first!');
      return;
    }
    const chunks = createFileChunks();
    const token =
      'token' +
      Math.random()
        .toString(36)
        .slice(-8);
    for (var i = 0; i < chunks.length; i++) {
      const form = new FormData();
      form.append('token', token);
      form.append('f1', chunks[i]);
      form.append('index', i);

      xhrSend(form, function() {
        sendChunkCount += 1;
        setProgress((sendChunkCount / chunks.length) * 100 + '%');
        if (sendChunkCount === chunks.length) {
          const formMerge = new FormData();
          formMerge.append('type', 'merge');
          formMerge.append('token', token);
          formMerge.append('chunkCount', chunks.length);
          formMerge.append('filename', file.name);

          xhrSend(formMerge);
        }
      });
    }
  };

  return (
    <div className="App">
      <div>
        <input type="file" onChange={onFileChange} />
        <button className="upload" onClick={onSubmitFile}>
          上传文件
        </button>
      </div>

      <div className="progress-wrap">
        <div className="progress" style={{width: progress}} />
      </div>
    </div>
  );
}

export default App;
