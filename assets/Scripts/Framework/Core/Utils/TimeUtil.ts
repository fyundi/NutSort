export class TimeUtil {
    /**
     * 格式化时间戳为日期字符串
     * @param timestamp 时间戳(毫秒)
     * @param format 格式化字符串，如 'YYYY-MM-DD hh:mm:ss'
     */
    public static formatDate(timestamp: number, format: string = 'YYYY-MM-DD hh:mm:ss'): string {
        const date = new Date(timestamp);
        const formatObj = {
            'Y+': date.getFullYear(),
            'M+': date.getMonth() + 1,
            'D+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
            'q+': Math.floor((date.getMonth() + 3) / 3),
            'S': date.getMilliseconds()
        };

        for (const key in formatObj) {
            const reg = new RegExp('(' + key + ')');
            if (reg.test(format)) {
                const str = formatObj[key].toString();
                format = format.replace(reg, str.padStart(RegExp.$1.length, '0'));
            }
        }
        return format;
    }

    /**
     * 格式化秒数为时分秒
     * @param seconds 秒数
     * @param showZero 是否显示零值单位
     */
    public static formatSeconds(seconds: number, showZero: boolean = false): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const parts: string[] = [];
        if (h > 0 || showZero) parts.push(`${h}小时`);
        if (m > 0 || showZero) parts.push(`${m}分`);
        if (s > 0 || showZero) parts.push(`${s}秒`);

        return parts.join('');
    }

    /**
     * 格式化剩余时间
     * @param leftTime 剩余时间(毫秒)
     */
    public static formatLeftTime(leftTime: number): string {
        const days = Math.floor(leftTime / (24 * 3600 * 1000));
        const hours = Math.floor((leftTime % (24 * 3600 * 1000)) / (3600 * 1000));
        const minutes = Math.floor((leftTime % (3600 * 1000)) / (60 * 1000));
        const seconds = Math.floor((leftTime % (60 * 1000)) / 1000);

        if (days > 0) return `${days}天${hours}小时`;
        if (hours > 0) return `${hours}小时${minutes}分`;
        if (minutes > 0) return `${minutes}分${seconds}秒`;
        return `${seconds}秒`;
    }
} 