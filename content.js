// Обработчик копирования текста
document.addEventListener("copy", (event) => {
  const selection = window.getSelection().toString().trim(); // Получаем выделенный текст
  console.log(selection);

  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.id &&
    selection
  ) {
    try {
      chrome.runtime.sendMessage({ copiedText: selection }, (response) => {
        // Проверяем ошибку контекста расширения
        if (chrome.runtime.lastError) {
          console.error(
            "Extension context invalidated:",
            chrome.runtime.lastError.message
          );
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
});

// Обработчик сообщений для печати PDF
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "printPDF") {
    // Проверяем, является ли текущая страница PDF (data URL)
    if (window.location.href.startsWith("data:application/pdf")) {
      // Ждем немного для полной загрузки PDF
      setTimeout(() => {
        window.print();
        console.log("Print dialog opened for PDF");
      }, 500);
    } else {
      // Если не PDF, все равно пробуем печатать
      setTimeout(() => {
        window.print();
        console.log("Print dialog opened");
      }, 500);
    }
    sendResponse({ success: true });
    return true;
  }
});
