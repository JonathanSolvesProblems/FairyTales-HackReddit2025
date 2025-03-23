import "./createPost.js";
import { Devvit, useState, useWebView } from "@devvit/public-api";
import type { DevvitMessage, WebViewMessage } from "./message.js";

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// Add a custom post type to Devvit
Devvit.addCustomPostType({
  name: "FairyTales",
  height: "tall",
  render: (context) => {
    // Load username with `useAsync` hook
    const [username] = useState(async () => {
      return (await context.reddit.getCurrentUsername()) ?? "anon";
    });

    // Load latest story from redis with `useAsync` hook
    const [story, setStory] = useState(async () => {
      const currentStory = await context.redis.get(`story_${context.postId}`);
      return currentStory ? JSON.parse(currentStory) : [];
    });

    const [images, setImages] = useState(async () => {
      const imageData = await context.redis.get(`images_${context.postId}`);
      return imageData ? JSON.parse(imageData) : [];
    });

    const webView = useWebView<WebViewMessage, DevvitMessage>({
      // URL of your web view content
      url: "page.html",

      // Handle messages sent from the web view
      async onMessage(message, webView) {
        switch (message.type) {
          case "webViewReady":
            webView.postMessage({
              type: "initialData",
              data: {
                username,
                storySoFar: story,
                images,
              },
            });
            break;
          case "addStoryPart":
            const updatedStory = [
              ...story,
              { username: username, text: message.data.newText },
            ];
            await context.redis.set(
              `story_${context.postId}`,
              JSON.stringify(updatedStory)
            );
            setStory(updatedStory);

            try {
              const apiResponse = await fetch(
                "https://fairy-tales-hack-reddit2025.vercel.app/api/generateImage",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    prompt: updatedStory.map((part) => part.text).join(" "),
                  }),
                }
              );

              if (apiResponse.ok) {
                const imageBlob = await apiResponse.blob();
                const imageURL = URL.createObjectURL(imageBlob);

                // Save image to Redis along with the part of the story that inspired it.
                const newImageEntry = {
                  storyPart: message.data.newText,
                  imageURL,
                };
                const updatedImages = [...images, newImageEntry];
                await context.redis.set(
                  `images_${context.postId}`,
                  JSON.stringify(updatedImages)
                );
                setImages(updatedImages);

                webView.postMessage({
                  type: "updateStory",
                  data: {
                    storySoFar: updatedStory,
                  },
                });

                webView.postMessage({
                  type: "updateImages",
                  data: { images: updatedImages },
                });
              }
            } catch (error) {
              console.error("Error generating image:", error);
            }
            break;

          default:
            throw new Error(`Unknown message type: ${message satisfies never}`);
        }
      },
      onUnmount() {
        context.ui.showToast("Web view closed!");
      },
    });

    // Render the custom post type
    return (
      <vstack grow padding="small">
        <vstack grow alignment="middle center">
          <text size="xlarge" weight="bold">
            Collaborative Storytelling Game: FairyTales
          </text>
          <spacer />
          <vstack alignment="start middle">
            <text size="medium">
              Username: <text weight="bold">{username}</text>
            </text>
            <text size="medium">Story So Far:</text>
            {story.map(
              (entry: { username: string; text: string }, index: string) => (
                <text key={index} size="small">
                  {entry.username}: {entry.text}
                </text>
              )
            )}
          </vstack>
          <spacer />
          <button onPress={() => webView.mount()}>Add to the Story!</button>
          <text size="large" weight="bold">
            Generated Images:
          </text>
          {images.map((img: any, index: string) => {
            <vstack key={index} padding="small" alignment="center">
              <image url={img.imageURL} imageHeight="32px" imageWidth="32px" />
              <text size="small">{`Inspired by: "${img.storyPart}"`}</text>
            </vstack>;
          })}
        </vstack>
      </vstack>
    );
  },
});

export default Devvit;
