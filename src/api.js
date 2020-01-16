const SERVER_URL = 'http://localhost:3001';

export const xhrSend = (formData, cb) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', SERVER_URL, true);

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      console.log(xhr.responseText);
      cb && cb();
    }
  };

  xhr.send(formData);
};
