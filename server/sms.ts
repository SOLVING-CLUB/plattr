// SMS Service for 2Factor.in API
// https://www.2factor.in/API/DOCS/Docs.html

interface SMSConfig {
  apiKey: string;
  templateName?: string;
  useAutoOTP?: boolean; // If true, 2factor.in generates OTP; if false, we send our own
}

interface TwoFactorResponse {
  Status: string;
  Details: string;
  Session_ID?: string; // Only when using auto OTP
}

export class SMSService {
  private config: SMSConfig;

  constructor() {
    this.config = {
      apiKey: process.env.TWOFACTOR_API_KEY || process.env.BULK_SMS_API_KEY || '',
      templateName: process.env.TWOFACTOR_TEMPLATE_NAME || 'PLATTR', // Your template name in 2factor.in
      useAutoOTP: process.env.TWOFACTOR_USE_AUTO_OTP === 'true', // Set to 'true' to use 2factor.in's auto OTP
    };
  }

  /**
   * Send OTP using 2factor.in API
   * @param phone - Phone number (10 digits, without country code)
   * @param otp - OTP code to send (6 digits)
   * @returns Promise<boolean> - true if sent successfully, false otherwise
   */
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      // Format phone number (remove +91 if present, ensure 10 digits)
      const formattedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
      
      // Validate phone number
      if (formattedPhone.length !== 10) {
        console.error('❌ Invalid phone number format:', phone);
        return false;
      }

      // Validate OTP
      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        console.error('❌ Invalid OTP format:', otp);
        return false;
      }

      // Check if API key is configured
      if (!this.config.apiKey) {
        console.warn('⚠️  2Factor.in API Key not configured. OTP:', otp);
        // In development, just log the OTP
        console.log(`📱 [DEV MODE] SMS to +91${formattedPhone}: Your OTP is ${otp}`);
        return true;
      }

      // 2factor.in API endpoint for SMS (NOT voice call)
      // IMPORTANT: Using /SMS/ endpoint ensures SMS is sent, not voice call
      // Phone number should include country code (91 for India)
      const phoneWithCountryCode = `91${formattedPhone}`;
      
      // 2Factor.in API format for SMS with custom OTP and template
      // Format: https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/{otp}/{template_name}
      // CRITICAL: Must use /SMS/ not /VOICE/ or /CALL/
      // Phone format: 91XXXXXXXXXX (country code + 10 digits, no + sign)
      let apiUrl: string;
      if (this.config.templateName) {
        // With template - recommended for approved templates
        apiUrl = `https://2factor.in/API/V1/${this.config.apiKey}/SMS/${phoneWithCountryCode}/${otp}/${this.config.templateName}`;
      } else {
        // Without template - send OTP directly
        apiUrl = `https://2factor.in/API/V1/${this.config.apiKey}/SMS/${phoneWithCountryCode}/${otp}`;
      }

      console.log(`📤 [2factor.in] Sending SMS OTP (not voice call) to +91${formattedPhone}...`);
      console.log(`🔗 [2factor.in] API URL: ${apiUrl.replace(this.config.apiKey, 'API_KEY_HIDDEN')}`);
      console.log(`📋 [2factor.in] Template: ${this.config.templateName || 'None'}`);
      console.log(`🔑 [2factor.in] OTP: ${otp}`);
      
      // 2factor.in uses GET requests
      // CRITICAL: This endpoint MUST use /SMS/ to send SMS, not /VOICE/ or /CALL/
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [2factor.in] API Error:', response.status, errorText);
        
        // In development, still allow testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`📱 [DEV MODE] SMS to +91${formattedPhone}: Your OTP is ${otp}`);
          return true;
        }
        return false;
      }

      const result: TwoFactorResponse = await response.json();
      
      // Log full response for debugging
      console.log(`📥 [2factor.in] API Response:`, JSON.stringify(result, null, 2));
      
      // Check response status
      if (result.Status === 'Success') {
        console.log(`✅ [2factor.in] SMS (not voice) sent successfully to +91${formattedPhone}`);
        console.log(`📱 [2factor.in] OTP: ${otp} (check your SMS, not phone call)`);
        if (result.Session_ID) {
          console.log(`📝 [2factor.in] Session ID: ${result.Session_ID}`);
        }
        return true;
      } else {
        console.error('❌ [2factor.in] Failed to send SMS:', result.Details || result.Status);
        
        // Check if it's trying to use voice instead
        if (result.Details && result.Details.toLowerCase().includes('voice')) {
          console.error('⚠️  [2factor.in] WARNING: Voice call detected instead of SMS. Check your API endpoint.');
        }
        
        // In development, still allow testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`📱 [DEV MODE] SMS to +91${formattedPhone}: Your OTP is ${otp}`);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('❌ [2factor.in] Error sending SMS:', error);
      
      // In development, log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        const formattedPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
        console.log(`📱 [DEV MODE] SMS to +91${formattedPhone}: Your OTP is ${otp}`);
        return true;
      }
      return false;
    }
  }

  /**
   * Generate a 6-digit OTP
   * @returns 6-digit OTP string
   */
  generateOTP(): string {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const smsService = new SMSService();
