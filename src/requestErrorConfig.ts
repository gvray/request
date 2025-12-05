import {
  ErrorFeedInfo,
  ErrorShowType,
  type BizError,
  type ErrorConfig,
  type IRequestOptions,
} from './types';

export const errorConfig: ErrorConfig = {
  // 当响应的数据 success 是 false 的时候，抛出 error 以供 errorHandler 处理。
  errorThrower: (res) => {
    const { success, data, code, message, showType } = res;

    if (!success) {
      const error = new Error(message) as BizError;
      error.name = 'BizError';
      error.info = { code, message, showType, data };
      throw error; // 抛出自制的错误
    }
  },
  // 接受 axios 的错误。
  // 接受 errorThrower 抛出的错误。
  errorHandler: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any,
    opts: IRequestOptions,
    feedBack?: (errorInfo: ErrorFeedInfo) => void
  ) => {
    if (opts?.skipErrorHandler) throw error;
    // 我们的 errorThrower 抛出的错误。
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
      // Axios 的错误
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
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
      // 请求已经成功发起，但没有收到响应
      // \`error.request\` 在浏览器中是 XMLHttpRequest 的实例，
      // 而在node.js中是 http.ClientRequest 的实例
      if (feedBack) {
        feedBack({
          showType: ErrorShowType.SILENT,
          errorType: 'ResponseError',
          message: 'None response! Please retry.',
        });
      } else {
        console.error('[UniRequest] ResponseError:', 'None response! Please retry.');
      }
    } else {
      // 发送请求时出了点问题
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
