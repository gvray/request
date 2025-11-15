import type { ErrorConfig } from './types';

// 错误处理方案： 错误类型
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

export const errorConfig: ErrorConfig = {
  // 当响应的数据 success 是 false 的时候，抛出 error 以供 errorHandler 处理。
  errorThrower: (res) => {
    const { success, data, code, message, showType } = res;

    if (!success) {
      const error: any = new Error(message);
      error.name = 'BizError';
      error.info = { code, message, showType, data };
      throw error; // 抛出自制的错误
    }
  },
  // 接受 axios 的错误。
  // 接受 errorThrower 抛出的错误。
  errorHandler: (error: any, opts: any) => {
    if (opts?.skipErrorHandler) throw error;
    // 我们的 errorThrower 抛出的错误。
    if (error.name === 'BizError') {
      const errorInfo = error.info;
      if (errorInfo) {
        const { message, code } = errorInfo;
        switch (errorInfo.showType) {
          case ErrorShowType.SILENT:
            // do nothing
            break;
          case ErrorShowType.WARN_MESSAGE:
            // msg.warning(message);
            break;
          case ErrorShowType.ERROR_MESSAGE:
            // msg.error(message);
            break;
          case ErrorShowType.NOTIFICATION:
            // notification.open({
            //   description: message,
            //   message: code,
            // });
            console.error('[UniRequest] Error:', message, error, code);
            break;
          case ErrorShowType.REDIRECT:
            // TODO: redirect
            break;
          default:
            // msg.error(message);
            // logger.error(error);
            console.error('[UniRequest] Error:', message, error);
        }
      }
    } else if (error.response) {
      const res = error.response.data;
      const message = res?.message || error.response.statusText;
      // Axios 的错误
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      console.error('[UniRequest] Error:', message);
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      // \`error.request\` 在浏览器中是 XMLHttpRequest 的实例，
      // 而在node.js中是 http.ClientRequest 的实例
      console.error('[UniRequest] Error:', 'None response! Please retry.');
    } else {
      // 发送请求时出了点问题
      console.error('[UniRequest] Error:', 'Request error, please retry.');
    }
  },
};
