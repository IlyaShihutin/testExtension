let lastFileName = ""; // Для отслеживания последнего имени файла
let intervalId = null;
let pidr = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
});
// Функция для скачивания файла
async function downloadFile(fileName) {
  const fileURL = `https://shipping.vinted.com/shipments/${fileName}/label.pdf`; // Замените на ваш фактический путь к папке
  console.log(fileURL);

  try {
    const response = await fetch(fileURL);
    if (!response.ok) throw new Error("File not found");

    chrome.downloads.download(
      {
        url: fileURL, // Указываем URL файла
        filename: fileName,
        conflictAction: "uniquify", // Если файл с таким именем уже существует, создаем уникальное имя
      },
      (downloadId) => {
        console.log("Download started with ID:", downloadId);
      }
    );

    console.log("Download started for:", fileName);
  } catch (err) {
    console.error("Error downloading file:", err);
  }
}
