
document.addEventListener('DOMContentLoaded', function() {
    // Проверка состояния свитча на загрузке
    chrome.storage.local.get('isEnabled', (data) => {
        const switchElement = document.getElementById('toggleSwitch');
        switchElement.checked = data.isEnabled || false; // Установите значение по умолчанию как false

        // Отправляем сообщение для установки проверки
        if (switchElement.checked) {
            chrome.runtime.sendMessage({ action: "startChecking" });
        }
    });

    document.getElementById('toggleSwitch').addEventListener('change', function() {
        const isChecked = this.checked;
        chrome.storage.local.set({ isEnabled: isChecked }); // Сохраняем состояние переключателя

        if (isChecked) {
            chrome.runtime.sendMessage({ action: "startChecking" }); // Запускаем проверку
        } else {
            chrome.runtime.sendMessage({ action: "stopChecking" }); // Останавливаем проверку
        }
    });
});