export class StringUtil {
    /**
     * 格式化字符串
     * @example format("Hello {0}!", "World") => "Hello World!"
     */
    public static format(str: string, ...args: any[]): string {
        return str.replace(/{(\d+)}/g, (match, index) => {
            return args[index] !== undefined ? args[index] : match;
        });
    }

    /**
     * 截取字符串，支持中文
     * @param str 原字符串
     * @param maxLength 最大长度
     * @param suffix 后缀，默认为...
     */
    public static truncate(str: string, maxLength: number, suffix: string = '...'): string {
        if (!str) return '';
        if (str.length <= maxLength) return str;

        let len = 0;
        let truncated = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const code = char.charCodeAt(0);
            len += code > 127 || code === 94 ? 2 : 1;
            if (len <= maxLength) {
                truncated += char;
            } else {
                return truncated + suffix;
            }
        }
        return truncated;
    }

    /**
     * 获取字符串长度，中文算2个字符
     */
    public static getStringLength(str: string): number {
        let len = 0;
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            len += code > 127 || code === 94 ? 2 : 1;
        }
        return len;
    }

    /**
     * 判断字符串是否为空或空白
     */
    public static isNullOrWhiteSpace(str: string): boolean {
        return !str || str.trim().length === 0;
    }

    /**
     * 转换为驼峰命名
     */
    public static toCamelCase(str: string): string {
        return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
    }

    /**
     * 转换为帕斯卡命名
     */
    public static toPascalCase(str: string): string {
        const camel = this.toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }
} 