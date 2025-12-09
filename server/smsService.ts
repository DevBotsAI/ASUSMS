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
  try {
    const formattedPhone = formatPhone(phone);
    
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
    
    if (data && data.response && data.response.msg) {
      const msgData = data.response.msg;
      if (msgData.err_code === "0" || msgData.err_code === 0) {
        return {
          success: true,
          smsId: msgData.id?.toString(),
          response: JSON.stringify(data),
        };
      } else {
        return {
          success: false,
          error: msgData.text || `Error code: ${msgData.err_code}`,
          response: JSON.stringify(data),
        };
      }
    }
    
    // Fallback for different response formats
    if (data && (data.id || data.msg_id)) {
      return {
        success: true,
        smsId: (data.id || data.msg_id)?.toString(),
        response: JSON.stringify(data),
      };
    }

    return {
      success: false,
      error: "Unexpected API response format",
      response: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error("SMS send error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
      response: error.response?.data ? JSON.stringify(error.response.data) : undefined,
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
