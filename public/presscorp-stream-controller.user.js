// ==UserScript==
// @name         Presscorp Stream Controller
// @namespace    http://tampermonkey.net/
// @version      2024-11-06
// @description  try to take over the world!
// @author       Seblor
// @match        https://discord.com/channels/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=discord.com
// @grant        none
// ==/UserScript==

(function () {
  'use strict';


  function createWebSocket () {
    const socket = new WebSocket('ws://127.0.0.1:4444');

    socket.addEventListener('open', () => {
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'openStream') {
          setTimeout(() => {
            [...document.querySelectorAll("div[class^='voiceUser']")].filter(el => el.textContent.includes('Live') && el.textContent.includes(message.userName))[0].click()
          }, 500)
          setTimeout(() => {
            const previewElement = document.querySelector("div[class^='preview']")
            if (previewElement) {
              previewElement.click();
              socket.send('success');
            }
          }, 500)
        }
      });

      socket.addEventListener('close', () => {
        createWebSocket();
      });
    });
  }

  createWebSocket();

})();