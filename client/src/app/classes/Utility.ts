export class Utility {
    static parseQueryString(url: string): Map<string, string> {
        let result = new Map<string, string>();
        url.substring(url.indexOf("?") + 1).split("&")
            .map(s => s.split("="))
            .filter(s => s.length === 2)
            .forEach(kv => result.set(kv[0], kv[1]));
        return result;
    }

    static moveTowards(current: number, target: number, step: number): number {
        let diff = target - current;
        if(diff === 0) {
            return current;
        } else {
            let absDiff = Math.abs(diff)
            if(absDiff < step) {
                return current;
            } else {
                return current  + step * diff / absDiff;
            }   
        }
    }

}