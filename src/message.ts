/** Message from Devvit to the web view. */
export type DevvitMessage =
  | { type: 'initialData'; data: { username: string; storySoFar: Array<{ username: string; text: string }>; images: Array<{ imageURL: string; storyPart: string }> } }
  | { type: 'updateStory'; data: { storySoFar: Array<{ username: string; text: string; }> } }
  | { type: 'updateImages'; data: { images: Array<{ storyPart: string; imageURL: string }> } };

/** Message from the web view to Devvit. */
export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'addStoryPart'; data: { newText: string } };

/**
 * Web view MessageEvent listener data type. The Devvit API wraps all messages
 * from Blocks to the web view.
 */
export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  /** Reserved type for messages sent via `context.ui.webView.postMessage`. */
  type?: 'devvit-message' | string;
};
