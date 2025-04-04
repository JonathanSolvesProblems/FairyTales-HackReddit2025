/** @typedef {import('../src/message.ts').DevvitSystemMessage} DevvitSystemMessage */
/** @typedef {import('../src/message.ts').WebViewMessage} WebViewMessage */

class App {
  constructor() {
    // Get references to the HTML elements
    this.output = /** @type {HTMLPreElement} */ (document.querySelector('#messageOutput'));
    this.increaseButton = /** @type {HTMLButtonElement} */ (
      document.querySelector('#btn-increase')
    );
    this.decreaseButton = /** @type {HTMLButtonElement} */ (
      document.querySelector('#btn-decrease')
    );
    this.usernameLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#username'));
    this.submitButton = /** @type {HTMLButtonElement} */ (document.querySelector('#submitStoryPart'));
    this.storyInput = /** @type {HTMLTextAreaElement} */ (document.querySelector('#storyInput'));
    this.output = /** @type {HTMLPreElement|null} */ (document.querySelector('#messageOutput'));
    this.storyContainer = /** @type {HTMLDivElement|null} */ (document.querySelector('#storyContainer'));
    this.postWebViewMessage = this.postWebViewMessage.bind(this);
    const charCounter = document.getElementById('charCounter');
    this.imageGallery = document.querySelector('#imageGallery');

    // this.counterLabel = /** @type {HTMLSpanElement} */ (document.querySelector('#counter'));
    // this.counter = 0;

    // When the Devvit app sends a message with `postMessage()`, this will be triggered
    addEventListener('message', this.#onMessage);

    // This event gets called when the web view is loaded
    addEventListener('load', () => {
      postWebViewMessage({ type: 'webViewReady' });


    });

    // this.increaseButton.addEventListener('click', () => {
    //   // Sends a message to the Devvit app
    //   postWebViewMessage({ type: 'setCounter', data: { newCounter: this.counter + 1 } });
    // });

    // this.decreaseButton.addEventListener('click', () => {
    //   // Sends a message to the Devvit app
    //   postWebViewMessage({ type: 'setCounter', data: { newCounter: this.counter - 1 } });
    // });

    this.storyInput.addEventListener("input", () => {
      const remaining = 80 - this.storyInput.value.length;
      charCounter.textContent = `${remaining} characters remaining`;
    })

    this.submitButton.addEventListener('click', () => {
      const newText = this.storyInput.value.trim();
      if (newText) {
        this.postWebViewMessage({ type: 'addStoryPart', data: { newText }});
        this.storyInput.value = ''; // Clear input after sending
      } else {
        alert('Please enter some text before submitting!')
      }
    })

          /**
       * Sends a message to the Devvit app.
       * @arg {WebViewMessage} msg
       * @return {void}
       */
  
  }

  postWebViewMessage(msg) {
    parent.postMessage(msg, '*');
  }

  /**
   * @arg {MessageEvent<DevvitSystemMessage>} ev
   * @return {void}
   */
  #onMessage = (ev) => {
    // Reserved type for messages sent via `context.ui.webView.postMessage`
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;

    // Always output full message
    if (this.output) {
      this.output.replaceChildren(JSON.stringify(message, undefined, 2));
    }

    switch (message.type) {
      case 'initialData': {
        // Load initial data
        const { username, storySoFar, images } = message.data;
        this.usernameLabel.innerText = username;
        this.updateStory(storySoFar);
        this.updateImageGallery(images);
        break;
      }
      case 'updateStory': {
        const { storySoFar } = message.data;
        this.updateStory(storySoFar); // Update story when receiving new parts
        break;
      }
      case 'updateImages': {
        this.updateImageGallery(message.data.images);
        break;
      }
      default:
        /** to-do: @satisifes {never} */
        const _ = message;
        break;
    }
  };


/**
 * Update the story display.
 * @param {Array<{ username: string, text: string}>} story - The story to display.
 * @return { void }
 */
  updateStory(story) {
    if (!this.storyContainer) return;

    this.storyContainer.innerHTML = ''; // Clear existing content
    story.forEach((entry) => {
      const storyPart = document.createElement('p');
      storyPart.textContent = `${entry.username}: ${entry.text}`;
      storyPart.classList.add('story-part');
      this.storyContainer.appendChild(storyPart);
    });
  }

  /**
   * Updates the image gallery
   * @param {Array<{ storyPart: string, imageURL: string }>} images
   */
  updateImageGallery(images) {
    this.imageGallery.innerHTML = ''; // Clear existing images
    images.forEach((entry) => {
      const imageContainer = document.createElement('div');
      imageContainer.classList.add('image-item');

      const img = document.createElement('img');
      img.src = entry.imageURL;
      img.alt = `Inspired by: ${entry.storyPart}`;
   
      const caption = document.createElement('p');
      caption.textContent = `Inspired by: "${entry.storyPart}"`;

      imageContainer.appendChild(img);
      imageContainer.appendChild(caption);
      this.imageGallery.appendChild(imageContainer);
    });
  }
}


/**
 * Sends a message to the Devvit app.
 * @arg {WebViewMessage} msg
 * @return {void}
 */
function postWebViewMessage(msg) {
  parent.postMessage(msg, '*');
}

new App();
