import {
  ErrorFeedInfo,
  ErrorShowType,
  type BizError,
  type ErrorConfig,
  type IRequestOptions,
} from './types';

export const errorConfig: ErrorConfig = {
  // When the response data "success" is false, throw an error for the errorHandler to handle.
  errorThrower: (res) => {
    const { success, data, code, message, showType } = res;

    if (!success) {
      const error = new Error(message) as BizError;
      error.name = 'BizError';
      error.info = { code, message, showType, data };
      throw error; // Throw a custom error for the errorHandler to handle.
    }
  },
  // Accept axios errors.
  // Accept errors thrown by errorThrower.
  errorHandler: (
    error: any,
    opts: IRequestOptions,
    feedBack?: (errorInfo: ErrorFeedInfo) => void
  ) => {
    if (opts?.skipErrorHandler) throw error;
    // Our errorThrower throws errors.
    if (error.name === 'BizError') {
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
              console.warn('[UniRequest] WarnMessage:', message, error, code);
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
              console.error('[UniRequest] ErrorMessage:', message, error, code);
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
              console.error('[UniRequest] Notification:', message, error, code);
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
              console.error('[UniRequest] Redirect:', message, error, code);
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
              console.error('[UniRequest] Default:', message, error, code);
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
          errorType: 'AxiosError',
          message,
          error,
        });
      } else {
        console.error('[UniRequest] AxiosError:', message, error);
      }
    } else if (error.request) {
      // The request was successfully sent, but no response was received.
      // \`error.request\` is an instance of XMLHttpRequest in the browser,
      // and an instance of http.ClientRequest in node.js.
      if (feedBack) {
        feedBack({
          showType: ErrorShowType.SILENT,
          errorType: 'ResponseError',
          message: 'None response! Please retry.',
          error,
        });
      } else {
        console.error('[UniRequest] ResponseError:', 'None response! Please retry.');
      }
    } else {
      // Something happened in setting up the request that triggered an Error.
      if (feedBack) {
        feedBack({
          showType: ErrorShowType.SILENT,
          errorType: 'RequestError',
          message: 'Request error, please retry.',
          error,
        });
      } else {
        console.error('[UniRequest] RequestError:', 'Request error, please retry.');
      }
    }
  },
  errorFeedBack: (errorInfo: ErrorFeedInfo) => {
    console.error(
      '[UniRequest] ErrorFeedBack:',
      errorInfo,
      'It is recommended to rewrite the errorFeedBack method.'
    );
  },
};
