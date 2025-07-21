import { useState } from "react";
import axios from "axios";
import Tesseract from "tesseract.js";
import ScrollToBottom from "react-scroll-to-bottom";
import { v4 as uuidv4 } from "uuid";

// Import User & Bot Avatars
import userImage from "./assets/man.png";
import botImage from "./assets/robo.png";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(uuidv4());

  // Function to handle sending messages
  const handleSendMessage = async () => {
    if (!inputText && !imageFile) return;

    setIsLoading(true);

    const newMessage = { user: "user", text: inputText, image: imageFile };
    setMessages((prev) => [...prev, newMessage]);

    // Show "AI is typing..."
    setMessages((prev) => [...prev, { user: "ai", text: "AI is typing..." }]);

    try {
      let textToSend = inputText;

      if (imageFile) {
        const imageUrl = URL.createObjectURL(imageFile);
        const {
          data: { text: extractedText },
        } = await Tesseract.recognize(imageUrl, "eng");

        textToSend = extractedText.trim();
      }

      const response = await axios.post(
        "https://healthai-backend-2.onrender.com/analyze",
        {
          text: textToSend,
          sessionId,
        }
      );

      const finalText =
        response.data.description || "No description generated.";

      let currentText = "";
      for (let i = 0; i < finalText.length; i++) {
        setTimeout(() => {
          currentText += finalText[i];
          setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1 ? { ...msg, text: currentText } : msg
            )
          );
        }, i * 8); // Adjust typing speed (lower = faster)
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, text: "Error processing your request." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setInputText("");
      setImageFile(null);
      document.getElementById("imageInput").value = "";
    }
  };

  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-black">
      {/* Chatbot Header */}
      <div className="text-center text-2xl font-bold bg-gray-800 text-white py-4">
        AI Chatbot
      </div>

      {/* Chat Message Display */}
      <ScrollToBottom className="flex-grow overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start ${
                msg.user === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* AI Response */}
              {msg.user === "ai" ? (
                <div className="flex items-center">
                  <div className="rounded-full p-1 mr-3">
                    <img
                      src={botImage}
                      alt="AI Avatar"
                      className="rounded-full w-12 h-12 object-cover"
                    />
                  </div>
                  <div className="bg-gray-200 text-black p-4 rounded-md shadow-md max-w-md">
                    <p>{msg.text}</p>
                  </div>
                </div>
              ) : (
                /* User Message */
                <div className="flex items-center">
                  <div className="rounded-full p-1 mr-3">
                    <img
                      src={userImage}
                      alt="User Avatar"
                      className="rounded-full w-12 h-12 object-cover"
                    />
                  </div>
                  <div className="bg-white text-black p-4 rounded-md shadow-md border border-gray-300 max-w-md">
                    {msg.image && (
                      <img
                        src={URL.createObjectURL(msg.image)}
                        alt="User upload"
                        className="mb-2 max-w-xs h-auto rounded-lg"
                      />
                    )}
                    <p>{msg.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollToBottom>

      {/* Input Box & Send Button */}
      <div className="flex items-center bg-white p-4 border-t border-gray-300">
        {/* Image Upload Button */}
        <label htmlFor="imageInput" className="cursor-pointer">
          <span className="text-black text-2xl mr-2">📷</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          id="imageInput"
          className="hidden"
        />

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="border-blue-300 flex-grow bg-white text-black p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          className="ml-4 bg-blue-600 p-3 rounded-full hover:bg-blue-500"
          disabled={isLoading}
        >
          <span className="text-white">🚀</span>
        </button>
      </div>
    </div>
  );
};

export default App;
