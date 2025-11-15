import axios from 'axios';
import { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from "axios";
class AxiosAdapter {
  create(){
    return axios.create();
  }
}

export { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse };
export const axiosAdapter = new AxiosAdapter();
export default AxiosAdapter