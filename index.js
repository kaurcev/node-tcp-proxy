/**
 * @fileoverview TCP-прокси (порт-форвардинг) с конфигурацией через переменные окружения.
 * Перенаправляет входящий трафик на указанный целевой хост и порт.
 */

const net = require('node:net');

// Чтение конфигурации из process.env с установкой значений по умолчанию (fallback)
const LISTEN_PORT = parseInt(process.env.LISTEN_PORT, 10) || 3000;
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';
const TARGET_HOST = process.env.TARGET_HOST || '127.0.0.1';
const TARGET_PORT = parseInt(process.env.TARGET_PORT, 10) || 57436;

/**
 * Инициализация TCP-сервера.
 * Вызывается при каждом новом входящем подключении клиента.
 * 
 * @param {net.Socket} clientSocket - Сетевой сокет подключившегося клиента.
 */
const server = net.createServer((clientSocket) => {
    
    /**
     * Создание подключения к целевому сервису.
     * Вызывается асинхронно после успешного рукопожатия (handshake) с таргетом.
     * 
     * @param {net.Socket} targetSocket - Сетевой сокет соединения с целевым сервисом.
     */
    const targetSocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
        // Организация двунаправленного обмена данными (пайпинг потоков)
        clientSocket.pipe(targetSocket);
        targetSocket.pipe(clientSocket);
    });

    /**
     * Обработка ошибок сокета клиента.
     * Гарантирует стабильность процесса при внезапном закрытии соединения клиентом.
     */
    clientSocket.on('error', (err) => {
        console.error(`[Клиент] Ошибка: ${err.message}`);
    });

    /**
     * Обработка ошибок сокета целевого сервиса.
     * Срабатывает, если целевой сервис недоступен или разорвал соединение в процессе работы.
     */
    targetSocket.on('error', (err) => {
        console.error(`[Сервис] Ошибка: ${err.message}`);
    });
});

/**
 * Запуск прослушивания входящих портов.
 */
server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`Проброс запущен!`);
    console.log(`Входной порт: ${LISTEN_HOST}:${LISTEN_PORT} ===> Целевой сервис: ${TARGET_HOST}:${TARGET_PORT}`);
});
