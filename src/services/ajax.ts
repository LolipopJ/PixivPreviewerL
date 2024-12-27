export interface AjaxStandardResponse<data> {
  error: boolean;
  message: string;
  body: data;
}
