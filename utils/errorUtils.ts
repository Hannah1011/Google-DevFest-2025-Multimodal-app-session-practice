/**
 * Converts an unknown error object into a user-friendly, natural language string.
 * This function specifically handles common API and network errors.
 * @param error The error object to parse.
 * @returns A string containing a user-friendly error message.
 */
export function getFriendlyErrorMessage(error: unknown): string {
    // Default message for unknown errors
    const defaultMessage = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Gemini API specific errors
        if (message.includes('api key not valid') || message.includes('api_key_invalid')) {
            return 'API 키가 유효하지 않습니다. 올바른 API 키를 설정했는지 확인해주세요.';
        }
        if (message.includes('permission denied')) {
            return 'API 접근 권한이 없습니다. Google Cloud 프로젝트에서 Gemini API가 활성화되었는지 확인해주세요.';
        }
        if (message.includes('quota') || message.includes('rate limit')) {
            return 'API 사용량이 할당량을 초과했습니다. 잠시 후 다시 시도하거나 사용량 한도를 확인해주세요.';
        }
        if (message.includes('503') || message.includes('overloaded') || message.includes('unavailable')) {
            return 'AI 모델 서버가 일시적으로 과부하 상태입니다. 잠시 후 자동으로 재시도되니 잠시만 기다려주세요.';
        }
         if (message.includes('invalid argument')) {
            return '서버에 잘못된 요청을 보냈습니다. 입력 내용을 확인해주세요.';
        }

        // Network errors
        if (message.includes('failed to fetch')) {
             return '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
        }

        // For other generic API/JS errors, return a slightly more informative message
        // but avoid exposing too much technical detail.
        console.error("Caught unhandled error:", error);
        return `예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해주세요. (오류: ${error.message})`;
    }

    return defaultMessage;
}
