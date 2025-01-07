declare namespace wx {
    interface FileSystemManager {
        appendFileSync(filePath: string, data: string, encoding: string): void;
        mkdirSync(dirPath: string, recursive?: boolean): void;
        statSync(path: string): Stats;
    }

    interface Stats {
        size: number;
    }

    interface Env {
        USER_DATA_PATH: string;
    }

    const env: Env;
    function getFileSystemManager(): FileSystemManager;
} 