import {
  ErrorFeedbackInfo,
  ErrorShowType,
  type BusinessError,
  type ErrorConfig,
  type GvrayRequestConfig,
} from './types';

interface ErrorThrowerPayload {
  success?: boolean;
  data?: unknown;
  code?: number;
  message?: string;
  showType?: ErrorShowType;
}

export const errorConfig: ErrorConfig<ErrorThrowerPayload> = {
  // When the response data "success" is false, throw an error for the errorHandler to handle.
  errorThrower: (res) => {
    const { success, data, code, message, showType } = res;

    if (!success) {
      const error = new Error(message) as BusinessError;
      error.name = 'BusinessError';
      error.info = { code, message, showType, data };
      throw error; // Throw a custom error for the errorHandler to handle.
    }
  },
  // Accept axios errors.
  // Accept errors thrown by errorThrower.
  errorHandler: (
    error: any,
    opts: GvrayRequestConfig,
    feedBack?: (errorInfo: ErrorFeedbackInfo) => void
  ) => {
    if (opts?.skipErrorHandler) throw error;
    // Our errorThrower throws errors.
    if (error.name === 'BusinessError') {
      const errorInfo = error.info;
      if (errorInfo) {
        const { message, code } = errorInfo;
        switch (errorInfo.showType) {
          case ErrorShowType.SILENT:
            // do nothing
            feedBack?.({
              showType: ErrorShowType.SILENT,
              errorType: error.name,
              message,
              code,
              error,
            });
            break;
          case ErrorShowType.WARN_MESSAGE:
            if (feedBack) {
              feedBack({
                showType: ErrorShowType.WARN_MESSAGE,
                errorType: error.name,
                message,
                code,
                error,
              });
            } else {
              console.warn('[Request] WarnMessage:', message, error, code);
            }
            break;
          case ErrorShowType.ERROR_MESSAGE:
            if (feedBack) {
              feedBack({
                showType: ErrorShowType.ERROR_MESSAGE,
                errorType: error.name,
                message,
                code,
                error,
              });
            } else {
              console.error('[Request] ErrorMessage:', message, error, code);
            }
            break;
          case ErrorShowType.NOTIFICATION:
            if (feedBack) {
              feedBack({
                showType: ErrorShowType.NOTIFICATION,
                errorType: error.name,
                message,
                code,
                error,
              });
            } else {
              console.error('[Request] Notification:', message, error, code);
            }
            break;
          case ErrorShowType.REDIRECT:
            if (feedBack) {
              feedBack({
                showType: ErrorShowType.REDIRECT,
                errorType: error.name,
                message,
                code,
                error,
              });
            } else {
              console.error('[Request] Redirect:', message, error, code);
            }
            break;
          default:
            if (feedBack) {
              feedBack({
                showType: ErrorShowType.DEFAULT,
                errorType: error.name,
                message,
                code,
                error,
              });
            } else {
              console.error('[Request] Default:', message, error, code);
            }
        }
      }
    } else if (error.response) {
      const res = error.response.data;
      const message = res?.message || error.response.statusText;
      // Axios errors.
      // The request was successfully sent and the server responded with a status code, but the status code exceeded the range of 2xx
      if (feedBack) {
        feedBack({
          showType: ErrorShowType.ERROR_MESSAGE,
          errorType: 'Response',
          message,
          error,
        });
      } else {
        console.error('[Request] ResponseError:', message, error);
      }
    } else if (error.request) {
      // The request was successfully sent, but no response was received.
      // \`error.request\` is an instance of XMLGvrayRequest in the browser,
      // and an instance of http.ClientRequest in node.js.
      if (feedBack) {
        feedBack({
          showType: ErrorShowType.SILENT,
          errorType: 'Response',
          message: 'None response! Please retry.',
          error,
        });
      } else {
        console.error('[Request] ResponseError:', 'None response! Please retry.');
      }
    } else {
      // Something happened in setting up the request that triggered an Error.
      if (feedBack) {
        feedBack({
          showType: ErrorShowType.SILENT,
          errorType: 'Request',
          message: 'Request error, please retry.',
          error,
        });
      } else {
        console.error('[Request] RequestError:', 'Request error, please retry.');
      }
    }
  },
  errorFeedback: (errorInfo: ErrorFeedbackInfo) => {
    console.error(
      '[Request] ErrorFeedback:',
      errorInfo,
      'It is recommended to rewrite the errorFeedBack method.'
    );
  },
};
