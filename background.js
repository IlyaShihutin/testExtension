let lastFileName = ""; // Для отслеживания последнего имени файла
let intervalId = null;
let pidr = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Проверяем валидность контекста расширения
  if (chrome.runtime.lastError) {
    console.error("Extension context error:", chrome.runtime.lastError.message);
    sendResponse({ success: false, error: chrome.runtime.lastError.message });
    return false;
  }

  console.log("request", request);
  if (request.action === "startChecking") {
    pidr = true;
    sendResponse({ success: true });
    return false;
  } else if (request.action === "stopChecking") {
    pidr = false;
    sendResponse({ success: true });
    return false;
  }
  console.log("pidr", pidr);
  if (request.copiedText && pidr) {
    const fileName = request.copiedText; // Получаем имя файла из скопированного текста
    console.log("fileName", fileName);

    if (fileName && fileName !== lastFileName) {
      lastFileName = fileName; // Обновляем последнее имя файла
      downloadFile(fileName.replaceAll(" ", "")); // Инициируем скачивание
      // Сбрасываем lastFileName через 3 секунды, чтобы можно было копировать тот же файл снова
      setTimeout(() => {
        lastFileName = "";
      }, 3000);
      sendResponse({ success: true, processed: true });
    } else {
      sendResponse({ success: true, processed: false, reason: "duplicate" });
    }
    return false; // Ответ отправлен синхронно
  } else {
    sendResponse({ success: true, processed: false });
    return false;
  }
});
// Функция для скачивания файла
async function downloadFile(fileName) {
  const fileURL = `https://shipping.vinted.com/shipments/${fileName}/label.pdf`; // Замените на ваш фактический путь к папке
  console.log(fileURL);

  try {
    const response = await fetch(fileURL);
    if (!response.ok) throw new Error("File not found");
    console.log(response);

    // Получаем PDF как blob
    const blob = await response.blob();

    // Преобразуем blob в base64 для data URL (для скачивания и открытия во вкладке)
    // Используем пошаговое преобразование, чтобы избежать переполнения стека
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Преобразуем по частям (chunks), чтобы избежать "Maximum call stack size exceeded"
    let binaryString = "";
    const chunkSize = 8192; // Размер чанка
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      // Преобразуем каждый байт отдельно для безопасности
      for (let j = 0; j < chunk.length; j++) {
        binaryString += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binaryString);
    const dataURL = `data:application/pdf;base64,${base64}`;

    // Скачиваем файл как PDF используя data URL (blob URL может не работать в service worker)
    chrome.downloads.download(
      {
        url: dataURL, // Используем data URL вместо blob URL
        filename: `${fileName}.pdf`, // Убеждаемся, что файл сохраняется с расширением .pdf
        conflictAction: "uniquify", // Если файл с таким именем уже существует, создаем уникальное имя
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download error:", chrome.runtime.lastError.message);
        } else {
          console.log("Download started with ID:", downloadId);
        }
      }
    );

    // Открываем PDF файл (data URL) в новой вкладке (как _blank)
    chrome.tabs.create(
      {
        url: dataURL,
        active: true, // Открываем как активную вкладку (аналог _blank)
      },
      (tab) => {
        console.log("PDF opened in new tab:", tab.id);

        // Ждем загрузки PDF и запускаем печать через scripting API
        setTimeout(() => {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                window.print();
              },
            },
            (scriptResult) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Script print error:",
                  chrome.runtime.lastError.message
                );
                // Если scripting не работает, пробуем через сообщение
                chrome.tabs.sendMessage(
                  tab.id,
                  { action: "printPDF" },
                  (response) => {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "Print message error:",
                        chrome.runtime.lastError.message
                      );
                    } else {
                      console.log("Print message sent");
                    }
                  }
                );
              } else {
                console.log("Print dialog opened via script");
              }
            }
          );
        }, 2000); // Задержка 2 секунды для загрузки PDF
      }
    );

    console.log("Download started for:", fileName);
  } catch (err) {
    console.error("Error downloading file:", err);
  }
}
