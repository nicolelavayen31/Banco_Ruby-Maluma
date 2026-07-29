import path from "path";
import winston from "winston";

const directorioLogs = path.resolve(process.cwd(), "logs");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? "info",

    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),
        winston.format.errors({
            stack: true
        }),
        winston.format.json()
    ),

    defaultMeta: {
        service: "BancoFuego"
    },

    transports: [
        new winston.transports.File({
            filename: path.join(directorioLogs, "error.log"),
            level: "error"
        }),

        new winston.transports.File({
            filename: path.join(directorioLogs, "combined.log")
        })
    ]
});

if (process.env.SHOW_CONSOLE_LOGS === "true") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    ({ level, message, timestamp }) =>
                        `${timestamp} [${level}]: ${message}`
                )
            )
        })
    );
}


export default logger;