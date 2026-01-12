let lastFileName = ""; // Для отслеживания последнего имени файла
let intervalId = null;
let pidr = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Проверяем валидность контекста расширения
  if (chrome.runtime.lastError) {
    console.error("Extension context error:", chrome.runtime.lastError.message);
    return;
  }

  console.log("request", request);
  if (request.action === "startChecking") {
    pidr = true;
  } else if (request.action === "stopChecking") {
    pidr = false;
  }
  console.log("pidr", pidr);
  if (request.copiedText && pidr) {
    const fileName = request.copiedText; // Получаем имя файла из скопированного текста
    console.log("fileName", fileName);

    if (fileName && fileName !== lastFileName) {
      lastFileName = fileName; // Обновляем последнее имя файла
      downloadFile(fileName.replaceAll(" ", "")); // Инициируем скачивание
    }
  }

  // Возвращаем true для асинхронного ответа (если нужно)
  return true;
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
      }
    );

    console.log("Download started for:", fileName);
  } catch (err) {
    console.error("Error downloading file:", err);
  }
}
