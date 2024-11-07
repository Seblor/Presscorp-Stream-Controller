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

  function attempt(fct, delay, maxAttempts) {
    let attempts = 0;
    const interval = setInterval(() => {
      if (fct() || ++attempts === maxAttempts) {
        clearInterval(interval);
      }
    }, delay);
  }

  function createWebSocket () {
    const socket = new WebSocket('ws://127.0.0.1:4444');

    socket.addEventListener('error', () => {
      createWebSocket();
    });

    socket.addEventListener('open', () => {
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'openStream') {
          attempt(() => {
            const el = [...document.querySelectorAll("div[class^='voiceUser']")].filter(el => el.textContent.includes('Live') && el.textContent.includes(message.userName))[0]
            if (el) {
              el.click()
              return true
            }
            return false;
          }, 100, 10)
          attempt(() => {
            const previewElement = document.querySelector("div[class^='preview']")
            if (previewElement) {
              previewElement.click();
              socket.send('success');
              return true;
            }
            return false;
          }, 100, 20)
        }
      });

      socket.addEventListener('close', () => {
        createWebSocket();
      });
    });
  }

  createWebSocket();

})();