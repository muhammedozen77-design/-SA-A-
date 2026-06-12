async function askOpenAI(question) {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    throw new Error("Soru boş olamaz.");
  }

  const response = await fetch("/api/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: normalizedQuestion }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "API yanıtı alınamadı.");
  }

  return data.answer;
}

const form = document.querySelector("[data-ai-form]");
const chatHistory = document.querySelector("[data-chat-history]");
const emptyHistory = document.querySelector("[data-empty-history]");

function createMessage(role, text) {
  const message = document.createElement("section");
  message.className = `chat-message chat-message-${role}`;

  const title = document.createElement("h3");
  title.textContent = role === "question" ? "Soru" : "Yanıt";

  const content = document.createElement("p");
  content.textContent = text;

  message.append(title, content);

  return message;
}

if (form && chatHistory) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const question = String(formData.get("question") || "").trim();
    const submitButton = form.querySelector("button[type='submit']");

    if (!question) {
      return;
    }

    emptyHistory?.remove();

    const questionMessage = createMessage("question", question);
    const answerMessage = createMessage("answer", "Yanıt hazırlanıyor...");

    chatHistory.append(questionMessage, answerMessage);
    answerMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    submitButton.disabled = true;

    try {
      answerMessage.querySelector("p").textContent = await askOpenAI(question);
      form.reset();
    } catch (error) {
      answerMessage.querySelector("p").textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}
