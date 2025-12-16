// SMS-PROSTO API integration
import axios from "axios";

const SMS_API_URL = "http://api.sms-prosto.ru";
const SMS_API_KEY = process.env.SMS_API_KEY || "";
const SMS_SENDER = process.env.SMS_SENDER || "ASU-MINENERGO";

export interface SmsResult {
  success: boolean;
  smsId?: string;
  error?: string;
  response?: string;
  request?: string;
  errCode?: string;
}

export interface SmsStatusResult {
  success: boolean;
  status?: string;
  error?: string;
  response?: string;
}

function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle Russian phone numbers
  if (cleaned.startsWith("8") && cleaned.length === 11) {
    cleaned = "7" + cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = "7" + cleaned;
  }
  
  return cleaned;
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const formattedPhone = formatPhone(phone);
  
  const requestParams = {
    method: "push_msg",
    key: SMS_API_KEY ? `${SMS_API_KEY.substring(0, 4)}***` : "NOT_SET",
    text: message,
    phone: formattedPhone,
    sender_name: SMS_SENDER,
    format: "json",
  };
  const requestLog = JSON.stringify(requestParams);

  try {
    const params = new URLSearchParams({
      method: "push_msg",
      key: SMS_API_KEY,
      text: message,
      phone: formattedPhone,
      sender_name: SMS_SENDER,
      format: "json",
    });

    const response = await axios.get(`${SMS_API_URL}/?${params.toString()}`, {
      timeout: 30000,
    });

    const data = response.data;
    
    if (data && data.response) {
      const msgData = data.response.msg;
      const respData = data.response.data;
      const errCode = String(msgData?.err_code || "");
      
      if (msgData && (msgData.err_code === "0" || msgData.err_code === 0)) {
        return {
          success: true,
          smsId: respData?.id?.toString(),
          response: JSON.stringify(data),
          request: requestLog,
          errCode: "0",
        };
      } else if (msgData) {
        return {
          success: false,
          error: msgData.text || `Error code: ${msgData.err_code}`,
          response: JSON.stringify(data),
          request: requestLog,
          errCode,
        };
      }
    }
    
    // Fallback for different response formats
    if (data && (data.id || data.msg_id)) {
      return {
        success: true,
        smsId: (data.id || data.msg_id)?.toString(),
        response: JSON.stringify(data),
        request: requestLog,
      };
    }

    return {
      success: false,
      error: "Unexpected API response format",
      response: JSON.stringify(data),
      request: requestLog,
    };
  } catch (error: any) {
    console.error("SMS send error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
      response: error.response?.data ? JSON.stringify(error.response.data) : undefined,
      request: requestLog,
    };
  }
}

export async function checkSmsStatus(smsId: string): Promise<SmsStatusResult> {
  try {
    const params = new URLSearchParams({
      method: "get_msg_status",
      key: SMS_API_KEY,
      id: smsId,
      format: "json",
    });

    const response = await axios.get(`${SMS_API_URL}/?${params.toString()}`, {
      timeout: 30000,
    });

    const data = response.data;
    
    if (data && data.response && data.response.msg) {
      const msgData = data.response.msg;
      // Status codes: 0 = pending, 1 = delivered, 2 = error, 3 = expired
      let status = "pending";
      if (msgData.status === 1 || msgData.status === "1") {
        status = "delivered";
      } else if (msgData.status === 2 || msgData.status === "2" || 
                 msgData.status === 3 || msgData.status === "3") {
        status = "error";
      }
      
      return {
        success: true,
        status,
        response: JSON.stringify(data),
      };
    }

    return {
      success: false,
      error: "Unexpected status response format",
      response: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error("SMS status check error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to check SMS status",
    };
  }
}

// Map API status to our notification status
export function mapSmsStatusToNotificationStatus(apiStatus: string): string {
  switch (apiStatus) {
    case "delivered":
      return "delivered";
    case "pending":
      return "sending";
    case "error":
      return "error";
    default:
      return "sending";
  }
}

// Error code descriptions from SMS-PROSTO API
export const SMS_ERROR_CODES: Record<string, string> = {
  "0": "Сообщение принято для отправки",
  "3": "API отключено. Обратитесь в поддержку",
  "7": "Заданы не все необходимые параметры",
  "99": "Транзакция отправки SMS не прошла",
  "602": "Пользователь не существует или неверный IP",
  "605": "Пользователь заблокирован",
  "607": "Имя отправителя недопустимо",
  "608": "Недопустимая длина имени отправителя",
  "609": "Сотовый оператор не подключен",
  "610": "Не подключен тариф пользователю",
  "611": "Некорректная стоимость SMS",
  "617": "Неверный формат номера получателя",
  "618": "Номер в черном списке",
  "620": "Имя отправителя должно быть на латинице",
  "621": "Некорректное имя отправителя",
  "622": "Номер в черном списке",
  "623": "Недостаточно средств",
  "624": "Запрещенные слова в сообщении",
  "625": "Не удалось определить направление",
  "626": "Не удалось получить данные по API KEY",
  "627": "Неверный API KEY",
  "628": "Тестовый режим - только привязанный номер",
  "629": "Превышен лимит номеров в запросе",
  "631": "Смешение русских и английских символов",
  "632": "Незарегистрированный отправитель",
  "645": "Сообщение отклонено",
  "699": "Не удалось установить соединение",
};

export function getErrorDescription(errCode: string | number): string {
  return SMS_ERROR_CODES[String(errCode)] || `Неизвестная ошибка (код ${errCode})`;
}

export interface BalanceResult {
  success: boolean;
  balance?: number;
  error?: string;
}

export async function getBalance(): Promise<BalanceResult> {
  try {
    const params = new URLSearchParams({
      method: "get_balance",
      key: SMS_API_KEY,
      format: "json",
    });

    const response = await axios.get(`${SMS_API_URL}/?${params.toString()}`, {
      timeout: 30000,
    });

    const data = response.data;
    
    if (data && data.response) {
      const msgData = data.response.msg;
      const respData = data.response.data;
      
      if (msgData && (msgData.err_code === "0" || msgData.err_code === 0)) {
        return {
          success: true,
          balance: parseFloat(respData?.balance || respData?.credits || "0"),
        };
      } else if (msgData) {
        return {
          success: false,
          error: msgData.text || getErrorDescription(msgData.err_code),
        };
      }
    }

    return {
      success: false,
      error: "Unexpected API response format",
    };
  } catch (error: any) {
    console.error("Balance check error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to check balance",
    };
  }
}
