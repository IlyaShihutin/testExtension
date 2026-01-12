document.addEventListener('copy', (event) => {
    const selection = window.getSelection().toString().trim(); // Получаем выделенный текст
    console.log(selection);
    
    if (typeof chrome !== 'undefined' && chrome.runtime &&selection) {
    chrome.runtime.sendMessage({ copiedText: selection });
}
});

